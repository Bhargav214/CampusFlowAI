from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CampusFlow Backend",
    description="Minimal FastAPI backend scaffold for CampusFlow.",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "CampusFlow FastAPI backend is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
