from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import Lesson, QuizAttempt, User, utcnow
from ..schemas import QuizSubmitIn
from ..services import lesson_service
from ..services.lesson_service import norm
from ..services.progress_service import get_progress, touch_activity

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])
PASS_PERCENT = 70


@router.get("/{lesson_id}")
def get_quiz(lesson_id: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    qs = lesson_service.build_quiz(db, lesson)
    return {"quiz_id": lesson.id, "lesson_title": lesson.title, "is_assessment": lesson.is_assessment,
            "questions": [{"id": q.id, "kind": q.kind, "prompt": q.prompt, "options": q.options} for q in qs]}


@router.post("/{quiz_id}/submit")
def submit(quiz_id: int, body: QuizSubmitIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    """quiz_id is the lesson id: every lesson has exactly one quiz."""
    lesson = db.get(Lesson, quiz_id)
    if not lesson:
        raise HTTPException(404, "Quiz not found")
    qs = lesson_service.build_quiz(db, lesson)
    results, score = [], 0
    for q in qs:
        given = body.answers.get(str(q.id), "")
        ok = bool(given) and norm(given) == norm(q.answer)
        score += ok
        results.append({"id": q.id, "prompt": q.prompt, "your_answer": given, "correct_answer": q.answer, "correct": ok,
                        "explanation": q.explanation})
    percent = round(100 * score / len(qs)) if qs else 0
    db.add(QuizAttempt(user_id=u.id, lesson_id=lesson.id, score=score, total=len(qs), answers=body.answers))
    touch_activity(db, u.id)
    completed = False
    if percent >= PASS_PERCENT:
        p = get_progress(db, u.id, lesson.id, create=True)
        if p.status != "completed":
            p.status, p.completed_at, p.updated_at = "completed", utcnow(), utcnow()
            touch_activity(db, u.id, lessons=1)
        completed = True
    db.commit()
    return {"score": score, "total": len(qs), "percent": percent, "passed": percent >= PASS_PERCENT,
            "lesson_completed": completed, "results": results}
