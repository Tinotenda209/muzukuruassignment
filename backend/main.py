"""
To-Do App — Flask Backend (pure Python, works on Python 3.9–3.14)
Routes: POST /register | POST /login | GET /protected | CRUD /todos
"""

import logging
import sqlite3
import datetime
import os
from functools import wraps
from typing import Any, Callable

from flask import Flask, request, jsonify, g
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24
DB_PATH = "todos.db"

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"])


# ── Database ──────────────────────────────────────────────────────────────────
def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_: Any) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    with app.app_context():
        db = get_db()
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                username         TEXT    UNIQUE NOT NULL,
                email            TEXT    UNIQUE NOT NULL,
                hashed_password  TEXT    NOT NULL,
                created_at       TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS todos (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                title       TEXT    NOT NULL,
                description TEXT    NOT NULL DEFAULT '',
                completed   INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT    DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        db.commit()
    logger.info("Database ready at %s", DB_PATH)


# ── Auth helpers ──────────────────────────────────────────────────────────────
def make_token(user_id: int, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def token_required(f: Callable) -> Callable:
    """Decorator: validates Authorization: Bearer <token> header."""
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"detail": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"detail": "Token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"detail": "Invalid token."}), 401

        db = get_db()
        user = db.execute(
            "SELECT id, username, email FROM users WHERE id = ?",
            (int(payload["sub"]),),
        ).fetchone()

        if user is None:
            return jsonify({"detail": "User not found."}), 401

        g.current_user = dict(user)
        return f(*args, **kwargs)

    return decorated


# ── Auth routes ───────────────────────────────────────────────────────────────
@app.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if len(username) < 3:
        return jsonify({"detail": "Username must be at least 3 characters."}), 422
    if "@" not in email:
        return jsonify({"detail": "Please enter a valid email address."}), 422
    if len(password) < 6:
        return jsonify({"detail": "Password must be at least 6 characters."}), 422

    db = get_db()

    if db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        logger.warning("Register blocked – username taken: %s", username)
        return jsonify({"detail": "USERNAME_TAKEN"}), 409

    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        logger.warning("Register blocked – email taken: %s", email)
        return jsonify({"detail": "EMAIL_TAKEN"}), 409

    hashed = generate_password_hash(password)
    db.execute(
        "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
        (username, email, hashed),
    )
    db.commit()
    logger.info("User registered: %s", username)
    return jsonify({"message": "Account created successfully. You can now log in."}), 201


@app.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    db = get_db()
    user = db.execute(
        "SELECT id, username, hashed_password FROM users WHERE email = ?", (email,)
    ).fetchone()

    if user is None or not check_password_hash(user["hashed_password"], password):
        logger.warning("Login failed for email: %s", email)
        return jsonify({"detail": "Invalid email or password."}), 401

    token = make_token(user["id"], user["username"])
    logger.info("User authenticated: %s", user["username"])
    return jsonify({
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "user_id": user["id"],
    })


@app.get("/protected")
@token_required
def protected():
    logger.info("Protected accessed by user_id=%s", g.current_user["id"])
    return jsonify({"message": "Access granted", **g.current_user})


# ── Todo routes ───────────────────────────────────────────────────────────────
@app.get("/todos")
@token_required
def get_todos():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC",
        (g.current_user["id"],),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.post("/todos")
@token_required
def create_todo():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()

    if not title:
        return jsonify({"detail": "Title cannot be empty."}), 422

    db = get_db()
    cursor = db.execute(
        "INSERT INTO todos (user_id, title, description) VALUES (?, ?, ?)",
        (g.current_user["id"], title, description),
    )
    db.commit()
    row = db.execute("SELECT * FROM todos WHERE id = ?", (cursor.lastrowid,)).fetchone()
    logger.info("Todo created id=%s by %s", row["id"], g.current_user["username"])
    return jsonify(dict(row)), 201


@app.put("/todos/<int:todo_id>")
@token_required
def update_todo(todo_id: int):
    db = get_db()
    existing = db.execute(
        "SELECT * FROM todos WHERE id = ? AND user_id = ?",
        (todo_id, g.current_user["id"]),
    ).fetchone()

    if not existing:
        return jsonify({"detail": "Todo not found."}), 404

    data = request.get_json(silent=True) or {}
    title = data.get("title", existing["title"])
    if title is not None:
        title = title.strip() or existing["title"]
    description = data.get("description", existing["description"])
    completed = data.get("completed", bool(existing["completed"]))

    db.execute(
        "UPDATE todos SET title=?, description=?, completed=? WHERE id=?",
        (title, description, int(completed), todo_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    return jsonify(dict(updated))


@app.delete("/todos/<int:todo_id>")
@token_required
def delete_todo(todo_id: int):
    db = get_db()
    existing = db.execute(
        "SELECT id FROM todos WHERE id = ? AND user_id = ?",
        (todo_id, g.current_user["id"]),
    ).fetchone()

    if not existing:
        return jsonify({"detail": "Todo not found."}), 404

    db.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    db.commit()
    logger.info("Todo %s deleted by %s", todo_id, g.current_user["username"])
    return "", 204


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    logger.info("Starting Flask server on http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
