import time
from collections import defaultdict, deque

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

bearer = HTTPBearer(auto_error=False)


def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        uid = int(jwt.decode(creds.credentials, settings.secret_key, algorithms=["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(401, "User no longer exists")
    return user


_hits: dict[int, deque] = defaultdict(deque)


def ai_rate_limit(user: User = Depends(current_user)) -> User:
    """Simple per-user sliding window (in-memory; use Redis if you run several workers)."""
    now, q = time.time(), _hits[user.id]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= settings.ai_rate_limit_per_minute:
        raise HTTPException(429, "Too many AI requests. Please wait a minute and try again.")
    q.append(now)
    return user
