from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import User, UserSettings
from ..schemas import LoginIn, RegisterIn, SettingsIn
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api", tags=["auth"])


def user_out(u: User) -> dict:
    s = u.settings
    return {"id": u.id, "email": u.email, "name": u.name,
            "settings": {"level": s.level, "daily_goal_minutes": s.daily_goal_minutes, "theme": s.theme}}


@router.post("/auth/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists")
    u = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password))
    u.settings = UserSettings()
    db.add(u)
    db.commit()
    return {"access_token": create_token(u.id), "token_type": "bearer", "user": user_out(u)}


@router.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_token(u.id), "token_type": "bearer", "user": user_out(u)}


@router.post("/auth/logout")
def logout(_: User = Depends(current_user)):
    # Tokens are stateless; the client discards its token. Progress stays in the database.
    return {"ok": True}


@router.get("/auth/me")
def me(u: User = Depends(current_user)):
    return user_out(u)


@router.put("/settings")
def update_settings(body: SettingsIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.name is not None:
        u.name = body.name.strip()
    for field in ("level", "daily_goal_minutes", "theme"):
        v = getattr(body, field)
        if v is not None:
            setattr(u.settings, field, v)
    db.commit()
    return user_out(u)
