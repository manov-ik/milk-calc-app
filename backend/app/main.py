from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.database import engine, Base
from app.routes import milk, auth

app = FastAPI()

# 1️⃣ Create tables
Base.metadata.create_all(bind=engine)

# 2️⃣ Enable CORS (for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://milk-log.netlify.app","*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3️⃣ Include routes
app.include_router(
    milk.router,
    prefix="/api/milk",
    tags=["Milk"]
)
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Auth"]
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)