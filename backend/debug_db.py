import sqlite3
import os

db_path = "/data/poll.db"

if not os.path.exists(db_path):
    print(f"DB file not found at {db_path}!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Users ---")
cursor.execute("SELECT id, username FROM users")
for u in cursor.fetchall():
    print(f"User: {u[1]} [ID: {u[0]}]")
print("")

print("--- Polls ---")
cursor.execute("SELECT id, title, slug, is_active, owner_id FROM polls ORDER BY created_at DESC LIMIT 5")
polls = cursor.fetchall()

for p in polls:
    pid, title, slug, active, owner_id = p
    print(f"Poll: {title} ({slug}) [ID: {pid}] Active: {active} Owner: {owner_id}")
    cursor.execute("SELECT id, text, question_type, \"order\" FROM questions WHERE poll_id = ?", (pid,))
    questions = cursor.fetchall()
    print(f"  Questions ({len(questions)}):")
    for q in questions:
        qid, qtext, qtype, qorder = q
        print(f"    - {qtext} (Type: {qtype}, Order: {qorder})")
        # Count votes
        if qtype == "open_ended":
            cursor.execute("SELECT count(*) FROM votes WHERE question_id = ?", (qid,))
            vcount = cursor.fetchone()[0]
            print(f"      [Votes: {vcount}]")
        else:
            cursor.execute("SELECT id, text FROM options WHERE question_id = ?", (qid,))
            opts = cursor.fetchall()
            for opt in opts:
                oid, otext = opt
                cursor.execute("SELECT count(*) FROM votes WHERE option_id = ?", (oid,))
                ovcount = cursor.fetchone()[0]
                print(f"      [Option: {otext} | Votes: {ovcount}]")
    print("")

conn.close()
