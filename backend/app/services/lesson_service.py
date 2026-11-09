import copy
import random
import re

from sqlalchemy.orm import Session

from ..models import Lesson, QuizQuestion
from ..static_content import STATIC
from . import ai_tutor, pronunciation

STEPS = ["overview", "vocabulary", "grammar", "examples", "dialogue", "reading", "listening", "speaking", "writing", "quiz"]
CONTENT_VERSION = 2
GENERIC = ["house", "water", "thank you", "car", "book", "good night", "friend", "school", "street", "time"]


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", s.lower())).strip()


def ensure_content(db: Session, lesson: Lesson) -> dict:
    """Return v2 lesson content. Older content is upgraded: hand-written lessons are reloaded, others are regenerated once
    by the LLM and cached in the database. Quiz questions are rebuilt from the new content."""
    c = lesson.content
    if c and c.get("v") == CONTENT_VERSION:
        if pronunciation.fix_content(c):  # safety net: turn IPA symbols into easy respelling
            lesson.content = copy.deepcopy(c)
            db.commit()
        return c
    static = STATIC.get((lesson.course.level, lesson.number))
    if static:
        content = copy.deepcopy(static)
    else:
        prev = (db.query(Lesson).filter(Lesson.course_id == lesson.course_id, Lesson.number < lesson.number)
                .order_by(Lesson.number.desc()).limit(6).all())
        content = ai_tutor.generate_lesson(lesson.course.level, lesson.title, lesson.number,
                                           [p.title for p in reversed(prev)], lesson.is_assessment)
        pronunciation.fix_content(content)
        for item in content["reading"]["sentences"]:
            if isinstance(item, dict) and pronunciation.has_ipa(str(item.get("pronunciation", ""))):
                item["pronunciation"] = pronunciation.to_respelling(item["pronunciation"])
    lesson.content = content
    db.query(QuizQuestion).filter_by(lesson_id=lesson.id).delete()
    db.commit()
    return content


def with_practice(content: dict) -> dict:
    """Listening, speaking and writing exercises are built ONLY from words and sentences the lesson already taught."""
    ex, dia = content.get("examples", []), content.get("dialogue", [])
    read = (content.get("reading") or {}).get("sentences", [])
    seen, sentences = set(), []
    for s in ex + dia + read:
        if s.get("german") and s["german"] not in seen:
            seen.add(s["german"])
            sentences.append({"german": s["german"], "english": s.get("english", ""), "pronunciation": s.get("pronunciation", "")})
    taught = []
    for s in ex + dia:
        if s["german"] not in [t["german"] for t in taught]:
            taught.append(s)
    vocab = [v for v in content.get("vocabulary", []) if "/" not in v["german"] and "/" not in v["english"]]
    step = max(1, len(vocab) // 8)
    writing = [{"prompt": f"Write in German: {s['english']}", "answer": s["german"]} for s in taught]
    writing += [{"prompt": f"How do you say “{v['english']}” in German?", "answer": v["german"]} for v in vocab[::step][:8]]
    return {**content, "listening": [{"german": s["german"], "english": s["english"]} for s in sentences],
            "speaking": sentences, "writing": writing}


def build_quiz(db: Session, lesson: Lesson) -> list[QuizQuestion]:
    existing = db.query(QuizQuestion).filter_by(lesson_id=lesson.id).order_by(QuizQuestion.id).all()
    if existing:
        return existing
    content = ensure_content(db, lesson)
    vocab, examples = content["vocabulary"], content["examples"]
    rnd = random.Random(lesson.id)
    n_vocab, n_ex = (8, 4) if lesson.is_assessment else (4, 2)
    qs: list[QuizQuestion] = []
    words = rnd.sample(vocab, min(n_vocab, len(vocab)))
    pool = [v["english"] for v in vocab]
    for w in words:
        wrong = [e for e in pool if e != w["english"]]
        rnd.shuffle(wrong)
        wrong = (wrong + [g for g in GENERIC if g != w["english"]])[:3]
        options = wrong + [w["english"]]
        rnd.shuffle(options)
        qs.append(QuizQuestion(lesson_id=lesson.id, kind="mcq", prompt=f"What does “{w['german']}” mean?", options=options,
                               answer=w["english"], explanation=f"“{w['german']}” means “{w['english']}”."))
    for w in words[:2]:
        qs.append(QuizQuestion(lesson_id=lesson.id, kind="translate", prompt=f"Write in German: “{w['english']}”",
                               answer=w["german"], explanation=f"“{w['english']}” is “{w['german']}” ({w.get('pronunciation', '')})."))
    picked = rnd.sample(examples, min(n_ex, len(examples)))
    for ex in picked:
        qs.append(QuizQuestion(lesson_id=lesson.id, kind="translate", prompt=f"Translate into German: “{ex['english']}”",
                               answer=ex["german"], explanation=f"Correct sentence: {ex['german']}"))
    for ex in picked[:1]:
        tokens = ex["german"].rstrip(".?!").split()
        if len(tokens) >= 2:
            qs.append(QuizQuestion(lesson_id=lesson.id, kind="fill", answer=tokens[-1],
                                   prompt="Fill in the blank: " + " ".join(tokens[:-1] + ["____"]) + f"  ({ex['english']})",
                                   explanation=f"Full sentence: {ex['german']}"))
    db.add_all(qs)
    db.commit()
    return db.query(QuizQuestion).filter_by(lesson_id=lesson.id).order_by(QuizQuestion.id).all()
