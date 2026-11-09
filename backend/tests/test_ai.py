from app.services import ai_tutor
from tests.conftest import FakeProvider


def test_ai_requires_key_when_missing(client, auth):
    r = client.post("/api/ai/chat", json={"message": "Hallo"}, headers=auth)
    assert r.status_code == 503 and "OPENAI_API_KEY" in r.json()["detail"]


def test_chat_persists_history(client, auth, monkeypatch):
    monkeypatch.setattr(ai_tutor, "get_provider", lambda: FakeProvider())
    r = client.post("/api/ai/chat", json={"message": "Ich bin gut."}, headers=auth).json()
    conv = client.get(f"/api/ai/conversations/{r['conversation_id']}", headers=auth).json()
    assert [m["role"] for m in conv["messages"]] == ["user", "assistant"]
    client.post(f"/api/ai/conversations/{conv['id']}/clear", headers=auth)
    assert client.get(f"/api/ai/conversations/{conv['id']}", headers=auth).json()["messages"] == []


def test_speech_endpoints(client, auth, monkeypatch):
    monkeypatch.setattr(ai_tutor, "get_provider", lambda: FakeProvider())
    t = client.post("/api/speech/transcribe", files={"file": ("a.webm", b"123", "audio/webm")}, headers=auth)
    assert t.json()["text"] == "Ich gehe zur Schule"
    assert client.post("/api/speech/synthesize", json={"text": "Hallo"}, headers=auth).content == b"mp3"


def test_voice_stream_persists_turns(client, auth, monkeypatch):
    import json
    monkeypatch.setattr(ai_tutor, "get_provider", lambda: FakeProvider())
    r = client.post("/api/voice/stream", json={"mode": "interview", "start": True}, headers=auth)
    assert r.status_code == 200 and '"done"' in r.text and "Hallo" in r.text
    cid = json.loads(r.text.split("data:")[1])["conversation_id"]
    client.post("/api/voice/stream", json={"text": "Ich bin Anna.", "mode": "interview", "conversation_id": cid}, headers=auth)
    msgs = client.get(f"/api/ai/conversations/{cid}", headers=auth).json()["messages"]
    assert [m["role"] for m in msgs] == ["assistant", "user", "assistant"]
    assert client.post("/api/voice/stream", json={"mode": "teacher"}, headers=auth).status_code == 422
