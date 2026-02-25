from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import User

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"user_id": user.id, "username": user.username}


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(username=req.username, password=req.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.id, "username": user.username}
