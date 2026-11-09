from app.database import SessionLocal
from app.models import QuizQuestion


def test_curriculum_seeded_and_static_lesson(client, auth):
    lessons = client.get("/api/lessons?level=A1", headers=auth).json()
    assert len(lessons) >= 28 and lessons[0]["title"].startswith("German Alphabet")
    d1 = client.get(f"/api/lessons/{lessons[0]['id']}", headers=auth).json()
    c = d1["content"]
    assert c["vocabulary"] and c["grammar"]["explanation"] and c["reading"]["sentences"] and c["dialogue"]
    assert len(c["speaking"]) >= 10 and len(c["writing"]) >= 10
    # every writing answer comes from sentences/words taught in the lesson
    taught = {s["german"] for s in c["examples"] + c["dialogue"]} | {v["german"] for v in c["vocabulary"]}
    assert all(w["answer"] in taught for w in c["writing"])


def test_progress_persists_and_recommends_next_day(client, auth):
    lessons = client.get("/api/lessons?level=A1", headers=auth).json()
    day5, day6 = lessons[4], lessons[5]
    r = client.post(f"/api/progress/lessons/{day5['id']}", json={"status": "completed"}, headers=auth)
    assert r.json()["status"] == "completed"
    # "close the app" and come back with a fresh login
    token = client.post("/api/auth/login", json={"email": "a@example.com", "password": "secret123"}).json()["access_token"]
    p = client.get("/api/progress", headers={"Authorization": f"Bearer {token}"}).json()
    assert p["completed"] == 1 and p["recommended"]["id"] == day6["id"] and p["streak"] == 1
    # any day can be opened directly, and bookmarks / resume position are saved
    client.post(f"/api/progress/lessons/{lessons[14]['id']}", json={"bookmarked": True, "last_position": 3}, headers=auth)
    day15 = [l for l in client.get("/api/lessons?level=A1", headers=auth).json() if l["id"] == lessons[14]["id"]][0]
    assert day15["bookmarked"] and day15["last_position"] == 3


def test_quiz_flow_saves_attempt(client, auth):
    lesson = client.get("/api/lessons?level=A1", headers=auth).json()[1]
    quiz = client.get(f"/api/quizzes/{lesson['id']}", headers=auth).json()
    assert quiz["questions"] and "answer" not in quiz["questions"][0]
    with SessionLocal() as db:
        answers = {str(q.id): q.answer for q in db.query(QuizQuestion).filter_by(lesson_id=lesson["id"])}
    res = client.post(f"/api/quizzes/{quiz['quiz_id']}/submit", json={"answers": answers}, headers=auth).json()
    assert res["percent"] == 100 and res["lesson_completed"]
    assert client.get("/api/progress", headers=auth).json()["recent_quizzes"][0]["score"] == res["score"]
