import json
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..deps import ai_rate_limit
from ..models import Conversation, Message, User
from ..services import ai_tutor
from ..services.progress_service import touch_activity

router = APIRouter(prefix="/api/voice", tags=["voice"])
Mode = Literal["teacher", "fluency", "interview"]


class VoiceIn(BaseModel):
    text: str = Field("", max_length=1000)
    mode: Mode = "teacher"
    topic: str = Field("", max_length=120)
    conversation_id: Optional[int] = None
    start: bool = False


class SummaryIn(BaseModel):
    conversation_id: int
    mode: Mode = "teacher"


def sse(obj: dict) -> str:
    return "data: " + json.dumps(obj, ensure_ascii=False) + "\n\n"


def _own(db: Session, user: User, cid: int) -> Conversation:
    c = db.get(Conversation, cid)
    if not c or c.user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    return c


@router.post("/stream")
def stream(body: VoiceIn, u: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    """Streams the teacher's reply token by token so the browser can start speaking after the first sentence."""
    if not body.start and not body.text.strip():
        raise HTTPException(422, "Say or type something first")
    provider = ai_tutor.get_provider()  # raises a clear 503 before streaming starts if no key
    if body.conversation_id:
        conv = _own(db, u, body.conversation_id)
    else:
        conv = Conversation(user_id=u.id, title=f"Voice · {body.mode}")
        db.add(conv)
        db.commit()
    recent = db.query(Message).filter_by(conversation_id=conv.id).order_by(Message.id.desc()).limit(16).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]
    user_text = "Begin the session now: greet me and start." if body.start else body.text.strip()
    msgs = ai_tutor.voice_messages(body.mode, body.topic, u.settings.level, history, user_text)
    cid, uid, start, said = conv.id, u.id, body.start, body.text.strip()

    def gen():
        yield sse({"conversation_id": cid})
        parts: list[str] = []
        try:
            for delta in provider.chat_stream(msgs, max_tokens=350):
                parts.append(delta)
                yield sse({"t": delta})
        except OpenAIError as e:
            yield sse({"error": f"The AI provider returned an error: {getattr(e, 'message', str(e))[:200]}"})
            return
        reply = "".join(parts).strip()
        if not reply:
            yield sse({"error": "The AI sent an empty reply. Please try again."})
            return
        with SessionLocal() as s:  # own session: the request-scoped one may already be closed
            if not start:
                s.add(Message(conversation_id=cid, role="user", content=said))
            s.add(Message(conversation_id=cid, role="assistant", content=reply))
            touch_activity(s, uid)
            s.commit()
        yield sse({"done": True})

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/summary")
def summary(body: SummaryIn, u: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    conv = _own(db, u, body.conversation_id)
    if not any(m.role == "user" for m in conv.messages):
        raise HTTPException(400, "Talk for at least one turn first")
    transcript = "\n".join(f"{'Teacher' if m.role == 'assistant' else 'Learner'}: {m.content}" for m in conv.messages)[-6000:]
    return ai_tutor.voice_summary(transcript, body.mode, u.settings.level)
