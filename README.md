
# 🛠 Prerequisites

| Tool | Version | Download |
|---|---|---|
| Python | **3.9 – 3.14** | https://python.org |
| Node.js | 18+ | https://nodejs.org |

Check what you have:
```bash
python --version
node --version
```

---

#  Setup — Backend

# Step 1 — Open a terminal in the backend folder

```bat
cd path\to\todo-app-final\backend
```

# Step 2 — Create a virtual environment

```bat
python -m venv venv
```

# Step 3 — Activate it

```bat
:: Windows Command Prompt
venv\Scripts\activate.bat

:: Windows PowerShell
venv\Scripts\Activate.ps1



You should now see **(venv)** at the start of your prompt.

# Step 4 — Install dependencies

```bat
pip install -r requirements.txt
```
# Step 5 — Start the backend

```bat
python main.py
```


The SQLite database (`todos.db`) is created automatically.

---

# Setup — Frontend

Open a **new terminal window** (keep the backend running).

# Step 1 — Navigate to the frontend

```bat
cd path\to\todo-app-final\frontend
```

# Step 2 — Install dependencies

```bat
npm install
```

# Step 3 — Start the dev server

```bat
npm run dev
```

Expected output:
```
  VITE ready in XXX ms
  ➜  Local: http://localhost:3000/
```

---

## 🌐 Open the App

Go to **http://localhost:3000** in your browser.

---
