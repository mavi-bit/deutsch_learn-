import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

Level = Literal["A1", "A2", "B1", "B2", "C1", "C2"]


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def strong(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class SettingsIn(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    level: Optional[Level] = None
    daily_goal_minutes: Optional[int] = Field(None, ge=5, le=240)
    theme: Optional[Literal["light", "dark"]] = None


class ProgressIn(BaseModel):
    status: Optional[Literal["not_started", "in_progress", "completed"]] = None
    bookmarked: Optional[bool] = None
    last_position: Optional[int] = Field(None, ge=0, le=20)
    add_seconds: int = Field(0, ge=0, le=3600)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[int] = None
    lesson_id: Optional[int] = None


class ExplainIn(BaseModel):
    topic: str = Field(min_length=1, max_length=300)


class CorrectIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class SpeakingIn(BaseModel):
    transcript: str = Field(min_length=1, max_length=1000)


class DefineIn(BaseModel):
    word: str = Field(min_length=1, max_length=80)


class VocabIn(BaseModel):
    german: str = Field(min_length=1, max_length=160)
    english: str = Field(min_length=1, max_length=200)
    pronunciation: str = Field("", max_length=160)
    example: str = Field("", max_length=500)
    category: str = Field("", max_length=60)
    level: Level = "A1"
    source: Literal["manual", "lesson", "chat"] = "manual"


class QuizSubmitIn(BaseModel):
    answers: dict[str, str]


class SynthIn(BaseModel):
    text: str = Field(min_length=1, max_length=800)
