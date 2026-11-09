"""AI service layer. All LLM / speech calls go through AIProvider so another vendor can be swapped in."""
import json
import logging
import re
from typing import Optional

from fastapi import HTTPException
from openai import OpenAI, OpenAIError

from ..config import settings

log = logging.getLogger("ai")

TUTOR_PROMPT = """You are a professional German language instructor who teaches German to English-speaking learners.
Your levels follow CEFR: A1, A2, B1, B2, C1, C2.

Always:
- Adapt your German to the learner's current level (A1: short sentences, common words).
- Explain difficult concepts in simple English and show German and English side by side.
- Correct mistakes politely, explain WHY, and give a better alternative sentence.
- Encourage the learner to answer in German. Never discourage the learner.
- Ask one question at a time during practice.
- Avoid grammar far above the learner's level unless asked.
- Use natural, grammatically correct German. Add pronunciation hints when useful.
- Never just translate; teach the underlying rule.
Keep replies concise (under about 180 words) and well structured."""


class OpenAIProvider:
    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url or None,
                             timeout=settings.ai_timeout_seconds)

    def chat(self, messages: list[dict], json_mode: bool = False, max_tokens: Optional[int] = None) -> str:
        tokens = max_tokens or settings.ai_max_tokens
        kwargs = dict(model=settings.openai_model, messages=messages, temperature=0.4)
        if "gpt-oss" in settings.openai_model:
            # reasoning models spend part of the token budget on thinking; keep it short and leave room for the answer
            kwargs["reasoning_effort"] = "low"
            tokens *= 3
        kwargs["max_tokens"] = tokens
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        return self.client.chat.completions.create(**kwargs).choices[0].message.content or ""

    def chat_stream(self, messages: list[dict], max_tokens: Optional[int] = None):
        tokens = max_tokens or settings.ai_max_tokens
        kwargs = dict(model=settings.openai_model, messages=messages, temperature=0.5, stream=True)
        if "gpt-oss" in settings.openai_model:
            kwargs["reasoning_effort"] = "low"
            tokens *= 3
        kwargs["max_tokens"] = tokens
        for chunk in self.client.chat.completions.create(**kwargs):
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def transcribe(self, data: bytes, filename: str) -> str:
        r = self.client.audio.transcriptions.create(model=settings.openai_stt_model, file=(filename, data), language="de")
        return r.text

    def speak(self, text: str) -> bytes:
        if not settings.tts_enabled:
            raise HTTPException(501, "Server text-to-speech is disabled. The browser voice is used instead.")
        r = self.client.audio.speech.create(model=settings.openai_tts_model, voice="alloy", input=text)
        return r.read()


_provider: Optional[OpenAIProvider] = None


def get_provider() -> OpenAIProvider:
    global _provider
    if not settings.openai_api_key:
        raise HTTPException(503, "OPENAI_API_KEY is not configured on the server. Add it to backend/.env and restart.")
    if _provider is None:
        _provider = OpenAIProvider()
    return _provider


def _run(fn):
    provider = get_provider()
    try:
        return fn(provider)
    except HTTPException:
        raise
    except OpenAIError as e:
        log.exception("LLM provider error")
        raise HTTPException(502, f"The AI provider returned an error: {getattr(e, 'message', str(e))[:200]}")


def _json(raw: str) -> dict:
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    raise HTTPException(502, "The AI returned an unreadable response. Please try again.")


def system_prompt(level: str, lesson_title: Optional[str] = None) -> str:
    p = f"{TUTOR_PROMPT}\n\nLearner CEFR level: {level}."
    if lesson_title:
        p += f"\nThe learner is currently studying: {lesson_title}. Relate examples to it when natural."
    return p


def chat_reply(history: list[dict], level: str, lesson_title: Optional[str] = None) -> str:
    msgs = [{"role": "system", "content": system_prompt(level, lesson_title)}] + history
    return _run(lambda p: p.chat(msgs)).strip()


def explain(topic: str, level: str) -> str:
    msgs = [{"role": "system", "content": system_prompt(level)},
            {"role": "user", "content": f"Explain this German topic in simple English with 4 German example sentences (with translations): {topic}"}]
    return _run(lambda p: p.chat(msgs, max_tokens=900)).strip()


def correct(text: str, level: str) -> dict:
    msgs = [{"role": "system", "content": system_prompt(level) + "\nReply ONLY with JSON."},
            {"role": "user", "content": 'Check this German text. JSON keys: "corrected" (string), "english" (translation of corrected), '
             '"explanation" (simple English, kind tone), "mistakes" (list of {"wrong","right","why"}). Text: ' + text}]
    return _json(_run(lambda p: p.chat(msgs, json_mode=True, max_tokens=700)))


def speaking_feedback(transcript: str, level: str) -> dict:
    msgs = [{"role": "system", "content": system_prompt(level) + "\nReply ONLY with JSON."},
            {"role": "user", "content": 'A learner said this in German (it is a speech-to-text transcript, so judge grammar, vocabulary and word choice only; '
             'you cannot hear pronunciation). JSON keys: "corrected", "english", "explanation", "vocabulary_notes" (list of strings), '
             '"pronunciation_tip" (one general tip for the hardest sounds in the corrected sentence, text-based), '
             '"reply_de" (a short natural German reply that continues the conversation), "reply_en" (its translation). Transcript: ' + transcript}]
    return _json(_run(lambda p: p.chat(msgs, json_mode=True, max_tokens=800)))


def define_word(word: str, level: str) -> dict:
    msgs = [{"role": "system", "content": "You are a German dictionary. Reply ONLY with JSON."},
            {"role": "user", "content": f'Define the German word or phrase "{word}" for an English speaker. JSON keys: "german" (with article for nouns), '
             '"english", "pronunciation" (English-style respelling), "example" (a German sentence), "category", "level" (A1-C2).'}]
    return _json(_run(lambda p: p.chat(msgs, json_mode=True, max_tokens=300)))


BASIC_WORDS = ("ich, du, er, sie, es, wir, ihr, Sie, bin, bist, ist, sind, seid, habe, hast, hat, haben, ein, eine, einen, der, die, das, den, dem, "
               "und, oder, nicht, kein, keine, ja, nein, in, zu, mit, von, aus, auf, an, am, im, hier, da, wie, was, wer, wo, auch, sehr, gut")
BASIC_SET = {w.strip().lower() for w in BASIC_WORDS.split(",")}
PRON_RULE = ('Every pronunciation field must be an easy English-style respelling an English speaker can read aloud, stressed syllable in CAPITALS, '
             'syllables joined by hyphens, e.g. "ikh bin MUE-deh". NEVER use IPA or phonetic symbols.')


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-zäöüß]+", text.lower())


def _covered(tok: str, known: set[str]) -> bool:
    if len(tok) <= 2 or tok in BASIC_SET or tok in known:
        return True
    return any(len(k) >= 3 and (tok.startswith(k[:max(3, len(k) - 2)]) or k.startswith(tok[:max(3, len(tok) - 2)])) for k in known)


def uncovered_words(sentences: list[dict], vocab: list[dict], extra: tuple = ()) -> list[str]:
    """German words used in sentences that the learner was never taught (not in vocabulary, glossary or basic words)."""
    known = set(extra)
    for v in vocab:
        known.update(_tokens(str(v.get("german", ""))))
    miss: list[str] = []
    for s in sentences:
        for t in _tokens(str(s.get("german", ""))):
            if not _covered(t, known) and t not in miss:
                miss.append(t)
    return miss


def generate_lesson(level: str, title: str, number: int, previous_titles: list[str], is_assessment: bool) -> dict:
    """Two small AI calls (core lesson, then a reading text built from that vocabulary), then a vocabulary-coverage check."""
    extra = f" This is a revision/assessment lesson: review these earlier topics: {', '.join(previous_titles)}." if is_assessment else ""
    core_msgs = [{"role": "system", "content": "You are a German curriculum designer. Reply ONLY with valid JSON."},
                 {"role": "user", "content": f"Create Day {number} of the CEFR {level} German course for English speakers. Topic: {title}.{extra} "
                  'JSON keys: "objectives" (3 strings), "vocabulary" (15-18 items {"german","english","pronunciation","category"}; nouns with article; verbs in the infinitive), '
                  '"grammar" ({"title","explanation"}: simple English, short paragraphs, use • bullets), "examples" (10-12 items {"german","english","pronunciation"}), '
                  '"dialogue" (6-8 items {"speaker": "A" or "B", "german","english","pronunciation"}), "practical" (3 short real-life tasks). '
                  f"STRICT RULES: every German content word used in examples and dialogue MUST also be listed in vocabulary (these basic words are allowed without listing: {BASIC_WORDS}). "
                  f"Sentences must be short and suitable for {level}. {PRON_RULE} German must be correct."}]
    content = _json(_run(lambda p: p.chat(core_msgs, json_mode=True, max_tokens=3200)))
    for key in ("objectives", "vocabulary", "grammar", "examples", "dialogue", "practical"):
        if not content.get(key):
            raise HTTPException(502, "The AI lesson was incomplete. Please try again.")
    vocab = content["vocabulary"]

    miss = uncovered_words(content["examples"] + content["dialogue"], vocab)
    if len(miss) >= 4:  # ask only for the missing words, instead of regenerating everything
        fix = [{"role": "system", "content": "You are a German dictionary. Reply ONLY with JSON."},
               {"role": "user", "content": f'These German words are used in lesson sentences but are missing from the vocabulary: {", ".join(miss[:12])}. '
                'Return {"extra": [{"german","english","pronunciation","category"}]} with the dictionary form (nouns with article) and English meaning. '
                f"Skip proper names. {PRON_RULE}"}]
        try:
            vocab += [v for v in _json(_run(lambda p: p.chat(fix, json_mode=True, max_tokens=700))).get("extra", []) if isinstance(v, dict)][:12]
        except HTTPException:
            pass  # coverage is best-effort; the lesson is still usable

    words = ", ".join(str(v.get("german", "")) for v in vocab)
    read_msgs = [{"role": "system", "content": "You are a German teacher. Reply ONLY with valid JSON."},
                 {"role": "user", "content": f"Write a short reading text for a {level} learner on the topic: {title}. Use ONLY these vocabulary words (plus basic words: {BASIC_WORDS}): {words}. "
                  'JSON keys: "title" (English), "sentences" (6-8 items {"german","english","pronunciation"}), '
                  '"glossary" (items {"german","english"} for any word you used that is not in the list; keep this empty if possible), '
                  '"questions" (3 items {"question","answer"}: simple English comprehension questions with short English answers). ' + PRON_RULE}]
    reading = _json(_run(lambda p: p.chat(read_msgs, json_mode=True, max_tokens=1500)))
    if not reading.get("sentences"):
        raise HTTPException(502, "The AI reading text was incomplete. Please try again.")
    reading.setdefault("glossary", [])
    reading.setdefault("questions", [])
    content.update({"v": 2, "vocabulary": vocab, "reading": reading})
    return content


def transcribe(data: bytes, filename: str) -> str:
    return _run(lambda p: p.transcribe(data, filename))


def synthesize(text: str) -> bytes:
    return _run(lambda p: p.speak(text))


# ---------- Live voice teacher ----------
VOICE_BASE = """You are Lena, a warm, patient German teacher talking with a learner by voice. Your reply is read aloud, so:
- Use 1 to 3 short spoken sentences. No lists, no markdown, no emojis.
- Speak German at the learner's CEFR level ({level}); use simpler words for A1/A2.
- After the German, add a new line starting with "EN:" containing a short English translation or a one-sentence correction tip. Never write English before the German.
"""
VOICE_MODES = {
    "teacher": "Mode: free conversation about {topic}. Chat naturally and end each turn with a short question. "
               "If the learner makes a mistake, naturally repeat their idea correctly in your German reply and explain briefly after EN:.",
    "fluency": "Mode: fluency coach, topic: {topic}. Ask open questions that need two or three sentences to answer. Praise effort. "
               "If an answer is very short, ask the learner to say more. After EN: give one better phrase or one correction.",
    "interview": "Mode: you are a German interviewer running {topic}, in character. Ask ONE question at a time and follow up on the answers, "
                 "getting slightly harder. Do NOT correct mistakes or give hints during the interview. Begin with a greeting and the first question. "
                 "After about 8 questions, thank the learner and say the interview is finished. After EN: give only the English translation of what you said.",
}
VOICE_DEFAULT_TOPIC = {"teacher": "everyday life", "fluency": "everyday life", "interview": "a job interview (Vorstellungsgespräch)"}


def voice_messages(mode: str, topic: str, level: str, history: list[dict], user_text: str) -> list[dict]:
    system = VOICE_BASE.format(level=level) + VOICE_MODES[mode].format(topic=topic.strip() or VOICE_DEFAULT_TOPIC[mode])
    return [{"role": "system", "content": system}] + history[-16:] + [{"role": "user", "content": user_text}]


def voice_summary(transcript: str, mode: str, level: str) -> dict:
    kind = "a mock German interview" if mode == "interview" else "a German speaking practice session"
    extra = "; say whether the learner would likely pass this interview and why" if mode == "interview" else ""
    msgs = [{"role": "system", "content": "You are an expert German examiner. Reply ONLY with JSON."},
            {"role": "user", "content": f"Evaluate the LEARNER in {kind} (target CEFR level {level}). The transcript comes from speech recognition, so ignore "
             "punctuation and capitalisation and judge grammar, vocabulary, fluency and answer quality only; you cannot judge pronunciation. "
             'JSON keys: "overall" (0-100), "fluency", "grammar", "vocabulary", "content" (each 1-10), "strengths" (3 short strings), '
             '"mistakes" (up to 5 of {"said","better","why"}), "tips" (3 short actionable strings), '
             f'"verdict" (2 sentences in English{extra}).\n\nTranscript:\n{transcript}'}]
    return _json(_run(lambda p: p.chat(msgs, json_mode=True, max_tokens=900)))
