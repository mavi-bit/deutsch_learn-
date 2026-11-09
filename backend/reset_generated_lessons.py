"""Clears AI-generated lesson text (and their auto-made quiz questions) so lessons are regenerated
the next time you open them, using the current prompt. A1 Days 1-3 are hand-written and are kept.
Run from the backend folder with the venv active:  python reset_generated_lessons.py"""
from app.database import SessionLocal
from app.models import Course, Lesson, QuizQuestion
from app.static_content import STATIC

with SessionLocal() as db:
    cleared = 0
    for lesson in db.query(Lesson).join(Course).all():
        if (lesson.course.level, lesson.number) in STATIC:
            continue
        if lesson.content is not None:
            lesson.content = None
            cleared += 1
        db.query(QuizQuestion).filter_by(lesson_id=lesson.id).delete()
    db.commit()
    print(f"Cleared {cleared} generated lessons. They will be rewritten when you open them.")
