import urllib.request
import urllib.parse
import json
import sys

base_url = "http://localhost:8000"

# 1. Login
auth_data = urllib.parse.urlencode({"username": "admin", "password": "password"}).encode()
req = urllib.request.Request(f"{base_url}/token", data=auth_data, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read().decode())
        token = token_data["access_token"]
except Exception as e:
    print(f"Login failed: {e}")
    sys.exit(1)

# 2. Get Polls
req = urllib.request.Request(f"{base_url}/polls/")
req.add_header("Authorization", f"Bearer {token}")

with urllib.request.urlopen(req) as response:
    polls = json.loads(response.read().decode())

if not polls:
    print("No polls")
else:
    p = polls[0]
    print(f"Slug: {p['slug']}")
    print(f"Closes At (Raw JSON): {p.get('closes_at', 'NONE')}")
