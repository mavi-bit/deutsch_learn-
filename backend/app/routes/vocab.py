from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import User, Vocabulary
from ..schemas import VocabIn
from ..services.pronunciation import to_respelling

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])


def out(v: Vocabulary) -> dict:
    return {"id": v.id, "german": v.german, "english": v.english, "pronunciation": to_respelling(v.pronunciation), "example": v.example,
            "category": v.category, "level": v.level, "source": v.source, "created_at": v.created_at}


@router.get("")
def list_words(q: Optional[str] = None, level: Optional[str] = None, u: User = Depends(current_user), db: Session = Depends(get_db)):
    query = db.query(Vocabulary).filter_by(user_id=u.id)
    if level:
        query = query.filter(Vocabulary.level == level)
    if q:
        like = f"%{q}%"
        query = query.filter(Vocabulary.german.ilike(like) | Vocabulary.english.ilike(like))
    return [out(v) for v in query.order_by(Vocabulary.id.desc())]


@router.post("", status_code=201)
def add_word(body: VocabIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if db.query(Vocabulary).filter_by(user_id=u.id, german=body.german.strip()).first():
        raise HTTPException(409, "This word is already saved")
    v = Vocabulary(user_id=u.id, **{**body.model_dump(), "german": body.german.strip()})
    db.add(v)
    db.commit()
    return out(v)


@router.delete("/{word_id}")
def remove_word(word_id: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    v = db.get(Vocabulary, word_id)
    if not v or v.user_id != u.id:
        raise HTTPException(404, "Word not found")
    db.delete(v)
    db.commit()
    return {"ok": True}
