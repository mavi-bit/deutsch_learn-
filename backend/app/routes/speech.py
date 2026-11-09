from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

from ..deps import ai_rate_limit
from ..models import User
from ..schemas import SynthIn
from ..services import ai_tutor

router = APIRouter(prefix="/api/speech", tags=["speech"])
MAX_AUDIO = 10 * 1024 * 1024


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), u: User = Depends(ai_rate_limit)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty audio upload")
    if len(data) > MAX_AUDIO:
        raise HTTPException(413, "Audio is too large (max 10 MB)")
    text = await run_in_threadpool(ai_tutor.transcribe, data, file.filename or "speech.webm")
    return {"text": text}


@router.post("/synthesize")
def synthesize(body: SynthIn, u: User = Depends(ai_rate_limit)):
    return Response(content=ai_tutor.synthesize(body.text), media_type="audio/mpeg")
