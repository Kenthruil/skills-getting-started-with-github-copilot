from fastapi.testclient import TestClient
from urllib.parse import quote

from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_dictionary():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # check a known activity exists
    assert "Chess Club" in data


def test_signup_then_duplicate_fails_and_delete_works():
    activity = "Chess Club"
    email = "test.student@example.com"

    # Ensure email not already present; if present, remove it first to have a clean test state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup should succeed
    signup_url = f"/activities/{quote(activity)}/signup?email={quote(email)}"
    resp = client.post(signup_url)
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant is now in the activity list
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert email in data[activity]["participants"]

    # Duplicate signup should fail with 400
    resp_dup = client.post(signup_url)
    assert resp_dup.status_code == 400

    # Now remove the participant via DELETE
    delete_url = f"/activities/{quote(activity)}/participants?email={quote(email)}"
    resp_del = client.delete(delete_url)
    assert resp_del.status_code == 200
    del_body = resp_del.json()
    assert "Removed" in del_body.get("message", "")

    # Confirm removal from activities
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity]["participants"]
