# CampusFlow AI 🎓🤖

> An AI-powered Campus Management and Academic Analytics Platform built with FastAPI and React.

CampusFlow AI streamlines institutional workflows, student lifecycle management, attendance tracking, and performance analytics with built-in predictive machine learning models to identify at-risk students early and drive proactive academic interventions.

---

## 🌟 Key Features

- **🔐 Authentication & RBAC**: Secure JWT-based authentication supporting role-based access control (Admin, Faculty, Student, Parent).
- **📊 Real-Time Analytics & Dashboard**: Comprehensive overview of attendance rates, grade distributions, and department metrics.
- **🧠 AI Academic Risk Prediction**: Machine learning pipeline trained on attendance and assessment data to classify academic risk levels (Low, Moderate, High).
- **📋 Student & Faculty Management**: Complete CRUD operations for students, faculty members, departments, and course subjects.
- **📅 Attendance & Marks Tracking**: Automated recording, validation, and analytics for course attendance and examination marks.
- **🔄 ETL Pipeline**: Data ingestion, transformation, and validation pipelines for bulk student, attendance, and marks processing.
- **🎨 Modern Dark UI / UX**: Polished SaaS interface with interactive charts, responsive tables, and 3D campus visualizer.

### Sample Student Import

The ETL Data Center supports CSV imports for student rosters. Upload
`Backend/sample_students.csv` from the **Students** import option to add its
24 fictional records across six departments. Existing roll numbers or email
addresses are skipped; bulk imports create student profiles without login
accounts.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Database**: PostgreSQL with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **Authentication**: OAuth2 with JWT tokens (`python-jose`, `passlib[bcrypt]`)
- **Machine Learning**: Scikit-Learn (`RandomForestClassifier`), NumPy, Pandas
- **Validation**: Pydantic v2

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS design system with custom CSS variables and glassmorphism dark theme
- **Visualization**: Lucide Icons, Recharts, Three.js / React Three Fiber

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL database (or SQLite for local testing)

---

### Backend Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv env
   # Windows:
   .\env\Scripts\activate
   # Linux / macOS:
   source env/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your database credentials and secret key:
   ```bash
   cp .env.example .env
   ```

5. **Initialize database tables and seed sample data**:
   ```bash
   python create_tables.py
   python seed_database.py
   ```

6. **Start the API server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Interactive API docs are available at `http://localhost:8000/docs`.

---

### Frontend Setup

1. **Navigate to the Frontend directory**:
   ```bash
   cd Frontend/my-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## 📁 Project Structure

```
CampusFlow/
├── Backend/
│   ├── analytics/           # Analytics queries and ML model pipelines
│   ├── api/                 # FastAPI routes (auth, students, faculty, marks, etl, etc.)
│   ├── auth/                # Security dependencies and password hashing
│   ├── database/            # Database engine and session management
│   ├── etl/                 # Ingestion, validation, and transformation logic
│   ├── models/              # SQLAlchemy database models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Core business logic services
│   ├── main.py              # Application entry point
│   └── requirements.txt     # Python dependencies
│
├── Frontend/
│   └── my-app/
│       ├── public/          # Static assets
│       ├── src/
│       │   ├── components/  # Reusable UI components & 3D visualizations
│       │   ├── context/     # Auth and state contexts
│       │   ├── pages/       # Application views & role-based dashboards
│       │   ├── services/    # API client services
│       │   ├── App.jsx      # Route configuration
│       │   └── index.css    # Core design system tokens & theme
│       └── package.json
│
├── .gitignore
└── README.md
```

---

## 👥 Authors & Acknowledgments

- **CampusFlow AI Development Team**
- Final Year Project
