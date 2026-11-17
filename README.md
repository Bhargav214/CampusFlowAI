# CampusFlow AI 🎓🤖

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E.svg?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Pandas ETL](https://img.shields.io/badge/Pandas-2.2+-150458.svg?style=flat&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **CampusFlow AI** is a next-generation Academic Data Platform and Explainable AI (XAI) Student Success Management System. It unites real-time attendance telemetry, examination mark sheets, automated Pandas ETL data ingestion, and Scikit-Learn predictive modeling to identify at-risk students early and drive proactive faculty interventions.

---

## 🏛️ System Architecture & Data Flow

```mermaid
flowchart LR
    A["Raw Academic Records<br/>(CSV / Excel / Roster)"] --> B["Stage 1: Pre-Flight<br/>Schema & Type Validator"]
    B --> C["Stage 2: Pandas Data<br/>Sanitization & Transformation"]
    C --> D[("PostgreSQL 15+<br/>Atomic Relational Store")]
    D --> E["Scikit-Learn Random Forest<br/>& Explainable AI Engine"]
    E --> F["Prescriptive Recovery Targets<br/>& Probability Confidence"]
    F --> G["Natural Language Query Engine<br/>('Ask CampusFlow AI')"]
    D --> H["Role-Based Web Dashboards<br/>(Admin, Faculty, Student, Parent)"]
    F --> H
    G --> H
```

---

## ✨ Key Capabilities

### 1. 🔐 Role-Based Access Control (RBAC)
Dedicated portals for all four institutional stakeholders:
* **Administrator**: Full departmental management, curriculum setup, faculty assignment, system-wide analytics, and audit exports.
* **Faculty Advisor**: 1-click batch classroom attendance rosters, examination mark entry, student risk alerts, and intervention logging.
* **Student Self-Analytics**: Personal attendance compliance tracking, grade distributions, and predictive academic standing.
* **Parent Guardian Portal**: Real-time attendance verification, assessment reviews, and direct academic alert notifications.

### 2. 🧠 Explainable AI (XAI) Academic Risk Radar & Live What-If Simulator
* **Autonomous Predictive Classifier**: Scikit-Learn `RandomForestClassifier` running in-memory with singleton model caching for zero-latency inference across whole student cohorts.
* **Confidence & Continuous Risk Scoring**: Continuous scoring ($0–100$) based on probability distributions (`predict_proba`).
* **Prescriptive Recovery Targets**: Calculates actionable milestones (e.g. *"Requires +13.0% attendance, approx 6 consecutive lectures, to clear mandatory 75% cutoff"*).
* **Subject Variance Trigger**: Automatically flags students with high performance spreads between subjects ($> 35$ marks).
* **Interactive What-If Simulator**: Allows faculty to simulate attendance and marks scenarios in real-time.

### 3. 💬 Natural-Language AI Data Querying (`Ask CampusFlow AI`)
* Plain-English command search bar running locally without any external paid API keys.
* Deterministic regex + intent extraction engine parsing thresholds and entities.
* Quick-prompt chips:
  * *"Attendance shortage (< 75%)"*
  * *"High risk students needing intervention"*
  * *"Top 5 academic performers"*
  * *"Subject-wise average performance"*

### 4. ⚡ Fast Class Roster Attendance & Marks UX
* **Atomic Batch Roster (`POST /attendance/bulk`)**: Faculty can mark an entire class session present or absent with 1-click toggles and save atomically.
* **Interactive Mark Sheet (`POST /marks/bulk`)**: Single-table grade entry supporting internal assessments, final examinations, and auto-computed letter grades.

### 5. 🔄 3-Stage Pandas ETL Data Ingestion Wizard
* **Drag-and-Drop Ingestion**: Interactive CSV and Excel upload for Student Directories, Attendance Logs, and Mark Sheets.
* **Client Pre-Flight Validation**: Instant browser-side column matching, schema preview, and missing header detection.
* **Row-Level Backend Diagnostics**: Returns structured errors (`row_number`, `column`, `error_message`) with rollback safety.
* **Sample Templates**: One-click download of standardized sample CSV templates.

### 6. 📄 Certified Institutional Reports & Official Print View
* **Certified PDF Downloads**: Attendance Reports, Examination Grade Rosters, AI Risk Audits, and Cohort Censuses generated via ReportLab.
* **1-Click Raw CSV Exports**: Date-stamped CSV downloads on Directory, Risk, and Report views.
* **Printable Institutional Dossier**: Formal printable report view with formal college headers, KPI summary, and faculty/HoD/principal signature lines.

### 7. 🎨 Linear-Grade Dual-Theme SaaS UI + 3D Campus Visualizer
* High-contrast **Light Mode** (ideal for classroom projectors) and **Dark Mode** (optimized for low-light lab environments) driven by CSS variable tokens.
* Interactive 3D digital-twin campus visualizer built with Three.js.

---

## 👥 Demo Viva Login Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusflow.com` | `admin123` | Institutional Oversight, Departments, Faculty & Student Master |
| **Faculty** | `faculty@campusflow.com` | `faculty123` | Class Rosters, Marks Entry, Risk Radar, Interventions |
| **Student** | `student@campusflow.com` | `student123` | Attendance Compliance, Gradebook, Predictive Trajectory |
| **Parent** | `parent@campusflow.com` | `parent123` | Ward Telemetry, Attendance Alerts, Guardian Notices |

> **Viva Pro-Tip:** The login page includes a **"⚡ Quick Viva Demo Login"** pill switcher that populates credentials with a single click.

---

## 🚀 Step-by-Step Local Setup

### Prerequisites
* **Python 3.11+** (Python 3.13 recommended)
* **Node.js 18+** & `npm`
* **PostgreSQL 14+** (or SQLite fallback)

---

### Backend Setup (FastAPI + SQLAlchemy)

1. **Navigate to the Backend directory**:
   ```bash
   cd CampusFlow/Backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell):
   python -m venv env
   .\env\Scripts\activate

   # Linux / macOS:
   python3 -m venv env
   source env/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in `Backend/` (or use the preconfigured default):
   ```env
   DATABASE_URL=postgresql://postgres:root@localhost:5432/campus_flow
   SECRET_KEY=a90f5878ede440ae746b2e58d1d40a90e63067527ffd17bb32b8c713727319e4
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

5. **Seed the database with realistic Bengaluru college data**:
   ```bash
   python seed_database.py
   ```
   *Seeds authentic departments (`BCA`, `B.Com`, `BBA`, `B.Sc Data Science`), subjects, faculty advisors, and 50 student records with varied telemetry.*

6. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   * Interactive Swagger Docs: `http://localhost:8000/docs`
   * Health Check: `http://localhost:8000/health`

---

### Frontend Setup (React 18 + Vite)

1. **Navigate to the Frontend directory**:
   ```bash
   cd CampusFlow/Frontend/my-app
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Verify production build**:
   ```bash
   npm run build
   ```

---

## 📁 Repository Structure

```
CampusFlow/
├── Backend/
│   ├── analytics/               # ML training, feature pipeline, XAI & NL query
│   │   ├── ml/
│   │   │   ├── features.py      # Feature engineering (attendance, marks spread)
│   │   │   ├── predict.py       # In-memory cached model inference & XAI targets
│   │   │   ├── train.py         # Random Forest training script
│   │   │   └── model.pkl        # Serialized model artifact
│   │   ├── nl_query.py          # Deterministic Natural-Language query engine
│   │   ├── risk.py              # Rule-based and explainable risk evaluator
│   │   └── dashboard.py         # Aggregated KPI queries
│   ├── api/                     # FastAPI endpoint routers
│   │   ├── analytics.py         # Risk telemetry, ML predictions & /ask endpoint
│   │   ├── attendance.py        # Single & /attendance/bulk roster endpoints
│   │   ├── marks.py             # Single & /marks/bulk marksheet endpoints
│   │   ├── etl.py               # Ingestion endpoints for CSV/Excel data
│   │   ├── reports.py           # ReportLab PDF generation
│   │   ├── student.py           # Student directory CRUD
│   │   └── ...
│   ├── etl/                     # 3-Stage Pandas ETL Pipeline
│   │   ├── validator.py         # Row-level schema and range validation
│   │   ├── transformer.py       # Data sanitization, trimming & type coercion
│   │   └── loader.py            # Atomic database batch loaders with rollback
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic v2 validation contracts
│   ├── main.py                  # FastAPI lifespan setup & global error handlers
│   ├── seed_database.py         # Idempotent realistic college seeder
│   └── sample_students.csv      # Sample multi-department student directory
│
├── Frontend/
│   └── my-app/
│       ├── src/
│       │   ├── components/
│       │   │   ├── dashboard/   # AskCampusFlowAI bar, 3D Campus scene
│       │   │   └── ui/          # PageHeader, StatCard, StatusBadge, DataTable
│       │   ├── pages/           # Feature pages (Dashboard, AIRisk, Attendance, etc.)
│       │   ├── context/         # AuthContext & ThemeProvider
│       │   ├── services/        # Axios API client modules
│       │   ├── App.jsx          # Protected route table
│       │   └── index.css        # Dual-theme design tokens & CSS utilities
│       └── package.json
│
└── README.md
```

---

## 🎓 Team & Project Credits

This project was conceived, designed, and engineered as a final year undergraduate software engineering capstone:

* **Bhargav Sai P** — *Principal Backend Engineer & Database Systems*
* **Syed Ayan Mahadi** — *Lead Frontend Architect & Machine Learning Pipeline*

*Developed for the Final Year Project Viva & Demonstration, 2026–2027.*
