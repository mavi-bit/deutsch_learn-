from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import Lesson, LessonProgress, QuizAttempt, SpeakingSession, User, utcnow
from ..schemas import ProgressIn
from ..services.progress_service import brief, get_progress, summary, touch_activity

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("")
def my_progress(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return summary(db, u)


@router.post("/lessons/{lesson_id}")
def update_lesson_progress(lesson_id: int, body: ProgressIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    p = get_progress(db, u.id, lesson_id, create=True)
    if body.bookmarked is not None:
        p.bookmarked = body.bookmarked
    if body.last_position is not None:
        p.last_position = body.last_position
    p.seconds_spent += body.add_seconds
    activity = bool(body.add_seconds or body.status or body.last_position is not None)
    if body.status:
        if body.status == "completed" and p.status != "completed":
            p.completed_at = utcnow()
            touch_activity(db, u.id, lessons=1)
        if body.status != "completed":
            p.completed_at = None
        p.status = body.status
    elif p.status == "not_started" and (body.add_seconds or body.last_position is not None):
        p.status = "in_progress"
    if activity:
        touch_activity(db, u.id, seconds=body.add_seconds)
    p.updated_at = utcnow()
    db.commit()
    return {**brief(lesson, p), "seconds_spent": p.seconds_spent}


@router.get("/history")
def history(u: User = Depends(current_user), db: Session = Depends(get_db)):
    items = []
    for p in db.query(LessonProgress).filter_by(user_id=u.id, status="completed"):
        l = db.get(Lesson, p.lesson_id)
        items.append({"type": "lesson_completed", "title": f"Completed Day {l.number}: {l.title}", "detail": l.course.level,
                      "at": p.completed_at or p.updated_at})
    for q in db.query(QuizAttempt).filter_by(user_id=u.id):
        items.append({"type": "quiz", "title": f"Quiz: {q.lesson.title}", "detail": f"{q.score}/{q.total}", "at": q.created_at})
    for s in db.query(SpeakingSession).filter_by(user_id=u.id):
        items.append({"type": "speaking", "title": "Speaking practice", "detail": s.transcript[:60], "at": s.created_at})
    items.sort(key=lambda i: i["at"], reverse=True)
    return items[:60]
