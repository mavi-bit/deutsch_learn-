from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import Course, Lesson, LessonProgress, Module, User
from ..services import lesson_service
from ..services.progress_service import brief, get_progress

router = APIRouter(prefix="/api", tags=["courses"])


def _progs(db: Session, uid: int) -> dict:
    return {p.lesson_id: p for p in db.query(LessonProgress).filter_by(user_id=uid)}


@router.get("/courses")
def courses(u: User = Depends(current_user), db: Session = Depends(get_db)):
    progs, out = _progs(db, u.id), []
    for c in db.query(Course).order_by(Course.id):
        ls = db.query(Lesson).filter_by(course_id=c.id).all()
        out.append({"id": c.id, "level": c.level, "title": c.title, "description": c.description, "total": len(ls),
                    "completed": sum(1 for l in ls if progs.get(l.id) and progs[l.id].status == "completed")})
    return out


@router.get("/courses/{course_id}/modules")
def modules(course_id: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if not db.get(Course, course_id):
        raise HTTPException(404, "Course not found")
    progs = _progs(db, u.id)
    mods = db.query(Module).filter_by(course_id=course_id).order_by(Module.position).all()
    return [{"id": m.id, "title": m.title, "position": m.position,
             "lessons": [brief(l, progs.get(l.id)) for l in m.lessons]} for m in mods]


@router.get("/lessons")
def lessons(level: Optional[str] = None, q: Optional[str] = None, status: Optional[str] = None,
            bookmarked: Optional[bool] = None, u: User = Depends(current_user), db: Session = Depends(get_db)):
    progs = _progs(db, u.id)
    query = db.query(Lesson).join(Course).order_by(Course.id, Lesson.number)
    if level:
        query = query.filter(Course.level == level)
    if q:
        query = query.filter(Lesson.title.ilike(f"%{q}%"))
    out = [brief(l, progs.get(l.id)) for l in query]
    if status:
        out = [l for l in out if l["status"] == status]
    if bookmarked:
        out = [l for l in out if l["bookmarked"]]
    return out


@router.get("/lessons/{lesson_id}")
def lesson_detail(lesson_id: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    content = lesson_service.ensure_content(db, lesson)
    nxt = db.query(Lesson).filter_by(course_id=lesson.course_id, number=lesson.number + 1).first()
    return {**brief(lesson, get_progress(db, u.id, lesson.id)), "content": lesson_service.with_practice(content), "next_id": nxt.id if nxt else None,
            "steps": lesson_service.STEPS}
