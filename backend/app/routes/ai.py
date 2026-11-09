from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import ai_rate_limit, current_user
from ..models import Conversation, Lesson, Message, SpeakingSession, User
from ..schemas import ChatIn, CorrectIn, DefineIn, ExplainIn, SpeakingIn
from ..services import ai_tutor
from ..services.progress_service import touch_activity

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _conv(db: Session, user: User, cid: int) -> Conversation:
    c = db.get(Conversation, cid)
    if not c or c.user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    return c


@router.post("/chat")
def chat(body: ChatIn, u: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    if body.conversation_id:
        conv = _conv(db, u, body.conversation_id)
    else:
        conv = Conversation(user_id=u.id, title=body.message[:60], lesson_id=body.lesson_id)
        db.add(conv)
        db.flush()
    lesson = db.get(Lesson, body.lesson_id or conv.lesson_id) if (body.lesson_id or conv.lesson_id) else None
    recent = db.query(Message).filter_by(conversation_id=conv.id).order_by(Message.id.desc()).limit(12).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]
    history.append({"role": "user", "content": body.message})
    try:
        reply = ai_tutor.chat_reply(history, u.settings.level, lesson.title if lesson else None)
    except Exception:
        db.rollback()
        raise
    db.add(Message(conversation_id=conv.id, role="user", content=body.message))
    msg = Message(conversation_id=conv.id, role="assistant", content=reply)
    db.add(msg)
    touch_activity(db, u.id)
    db.commit()
    return {"conversation_id": conv.id, "title": conv.title, "reply": reply, "message_id": msg.id}


@router.get("/conversations")
def conversations(u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Conversation).filter_by(user_id=u.id).order_by(Conversation.id.desc()).limit(50).all()
    return [{"id": c.id, "title": c.title, "created_at": c.created_at} for c in rows]


@router.get("/conversations/{cid}")
def conversation(cid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    c = _conv(db, u, cid)
    return {"id": c.id, "title": c.title, "messages": [{"id": m.id, "role": m.role, "content": m.content} for m in c.messages]}


@router.post("/conversations/{cid}/clear")
def clear(cid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    c = _conv(db, u, cid)
    db.query(Message).filter_by(conversation_id=c.id).delete()
    db.commit()
    return {"ok": True}


@router.delete("/conversations/{cid}")
def delete_conversation(cid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(_conv(db, u, cid))
    db.commit()
    return {"ok": True}


@router.post("/explain")
def explain(body: ExplainIn, u: User = Depends(ai_rate_limit)):
    return {"explanation": ai_tutor.explain(body.topic, u.settings.level)}


@router.post("/correct")
def correct(body: CorrectIn, u: User = Depends(ai_rate_limit)):
    return ai_tutor.correct(body.text, u.settings.level)


@router.post("/define-word")
def define_word(body: DefineIn, u: User = Depends(ai_rate_limit)):
    return ai_tutor.define_word(body.word, u.settings.level)


@router.post("/speaking-feedback")
def speaking_feedback(body: SpeakingIn, u: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    fb = ai_tutor.speaking_feedback(body.transcript, u.settings.level)
    db.add(SpeakingSession(user_id=u.id, transcript=body.transcript, feedback=fb))
    touch_activity(db, u.id)
    db.commit()
    return fb


@router.get("/speaking-sessions")
def speaking_sessions(u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(SpeakingSession).filter_by(user_id=u.id).order_by(SpeakingSession.id.desc()).limit(20).all()
    return [{"id": s.id, "transcript": s.transcript, "feedback": s.feedback, "created_at": s.created_at} for s in rows]
