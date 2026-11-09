from sqlalchemy.orm import Session

from .curriculum import COURSES, CURRICULUM
from .models import Course, Lesson, Module
from .static_content import STATIC


def seed(db: Session) -> None:
    if db.query(Course).count():
        return
    for level, modules in CURRICULUM.items():
        title, desc = COURSES[level]
        course = Course(level=level, title=title, description=desc)
        db.add(course)
        db.flush()
        n = 0
        for pos, (mtitle, titles) in enumerate(modules, 1):
            module = Module(course_id=course.id, title=mtitle, position=pos)
            db.add(module)
            db.flush()
            for t in titles:
                n += 1
                db.add(Lesson(course_id=course.id, module_id=module.id, number=n, title=t,
                              is_assessment=any(k in t for k in ("Revision", "Assessment", "Test")),
                              content=STATIC.get((level, n))))
    db.commit()
