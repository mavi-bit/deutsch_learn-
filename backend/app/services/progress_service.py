from datetime import date, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (Course, DailyActivity, Lesson, LessonProgress, QuizAttempt, SpeakingSession,
                      User, Vocabulary, utcnow)


def get_progress(db: Session, user_id: int, lesson_id: int, create: bool = False) -> Optional[LessonProgress]:
    p = db.query(LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not p and create:
        p = LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.add(p)
        db.flush()
    return p


def touch_activity(db: Session, user_id: int, seconds: int = 0, lessons: int = 0) -> None:
    row = db.query(DailyActivity).filter_by(user_id=user_id, day=date.today()).first()
    if not row:
        row = DailyActivity(user_id=user_id, day=date.today(), seconds=0, lessons_completed=0)
        db.add(row)
    row.seconds += seconds
    row.lessons_completed += lessons


def streak(db: Session, user_id: int) -> int:
    days = {d for (d,) in db.query(DailyActivity.day).filter_by(user_id=user_id)}
    d = date.today() if date.today() in days else date.today() - timedelta(days=1)
    n = 0
    while d in days:
        n += 1
        d -= timedelta(days=1)
    return n


def brief(l: Lesson, p: Optional[LessonProgress]) -> dict:
    return {"id": l.id, "number": l.number, "title": l.title, "level": l.course.level, "module_id": l.module_id,
            "module_title": l.module.title, "is_assessment": l.is_assessment,
            "status": p.status if p else "not_started", "bookmarked": bool(p and p.bookmarked),
            "last_position": p.last_position if p else 0, "has_content": bool(l.content)}


def summary(db: Session, user: User) -> dict:
    level = user.settings.level
    progs = {p.lesson_id: p for p in db.query(LessonProgress).filter_by(user_id=user.id)}
    levels, lessons_by_level = [], {}
    for c in db.query(Course).order_by(Course.id):
        ls = db.query(Lesson).filter_by(course_id=c.id).order_by(Lesson.number).all()
        lessons_by_level[c.level] = ls
        done = sum(1 for l in ls if progs.get(l.id) and progs[l.id].status == "completed")
        levels.append({"level": c.level, "completed": done, "total": len(ls)})
    ls = lessons_by_level.get(level, [])
    is_done = lambda l: progs.get(l.id) is not None and progs[l.id].status == "completed"
    last_no = max((l.number for l in ls if is_done(l)), default=0)
    rec = next((l for l in ls if l.number > last_no and not is_done(l)), None) or next((l for l in ls if not is_done(l)), None)
    in_prog = [l for l in ls if progs.get(l.id) and progs[l.id].status == "in_progress"]
    in_prog.sort(key=lambda l: progs[l.id].updated_at, reverse=True)
    cur = in_prog[0] if in_prog else None
    cur_level = next(x for x in levels if x["level"] == level) if levels else {"completed": 0, "total": 0}
    today = date.today()
    act = {a.day: a.seconds for a in db.query(DailyActivity).filter(DailyActivity.user_id == user.id, DailyActivity.day >= today - timedelta(days=13))}
    quizzes = (db.query(QuizAttempt).filter_by(user_id=user.id).order_by(QuizAttempt.id.desc()).limit(6).all())
    total_seconds = sum(p.seconds_spent for p in progs.values())
    return {
        "level": level,
        "completed": cur_level["completed"], "total": cur_level["total"],
        "percent": round(100 * cur_level["completed"] / cur_level["total"]) if cur_level["total"] else 0,
        "streak": streak(db, user.id),
        "total_seconds": total_seconds,
        "today_seconds": act.get(today, 0),
        "daily_goal_minutes": user.settings.daily_goal_minutes,
        "vocab_count": db.query(func.count(Vocabulary.id)).filter_by(user_id=user.id).scalar(),
        "speaking_sessions": db.query(func.count(SpeakingSession.id)).filter_by(user_id=user.id).scalar(),
        "current": brief(cur, progs.get(cur.id)) if cur else None,
        "recommended": brief(rec, progs.get(rec.id)) if rec else None,
        "recent_quizzes": [{"lesson_id": q.lesson_id, "lesson_title": q.lesson.title, "score": q.score, "total": q.total,
                            "created_at": q.created_at} for q in quizzes],
        "activity": [{"day": (today - timedelta(days=i)).isoformat(), "seconds": act.get(today - timedelta(days=i), 0)} for i in range(13, -1, -1)],
        "levels": levels,
    }
