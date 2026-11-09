def test_register_login_me(client):
    body = {"email": "a@example.com", "name": "Anna", "password": "secret123"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409
    r = client.post("/api/auth/login", json={"email": "a@example.com", "password": "secret123"})
    assert r.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"})
    assert me.json()["settings"]["level"] == "A1"


def test_bad_password_and_weak_password(client):
    assert client.post("/api/auth/register", json={"email": "b@example.com", "name": "B", "password": "short"}).status_code == 422
    assert client.post("/api/auth/register", json={"email": "b@example.com", "name": "B", "password": "onlyletters"}).status_code == 422
    client.post("/api/auth/register", json={"email": "b@example.com", "name": "B", "password": "secret123"})
    assert client.post("/api/auth/login", json={"email": "b@example.com", "password": "wrong1234"}).status_code == 401


def test_protected_routes_require_token(client):
    assert client.get("/api/progress").status_code == 401
    assert client.get("/api/lessons").status_code == 401
