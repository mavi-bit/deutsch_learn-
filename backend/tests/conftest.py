import os

os.environ["DATABASE_URL"] = "sqlite:///./test_german.db"
os.environ["OPENAI_API_KEY"] = ""
os.environ["SECRET_KEY"] = "test-secret"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:  # lifespan recreates tables and seeds the curriculum
        yield c


@pytest.fixture()
def auth(client):
    r = client.post("/api/auth/register", json={"email": "a@example.com", "name": "Anna", "password": "secret123"})
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


class FakeProvider:
    def chat(self, messages, json_mode=False, max_tokens=None):
        return "Gut gemacht! Good attempt."

    def chat_stream(self, messages, max_tokens=None):
        yield "Hallo! "
        yield "Wie geht es dir?\nEN: Hello! How are you?"

    def transcribe(self, data, filename):
        return "Ich gehe zur Schule"

    def speak(self, text):
        return b"mp3"
