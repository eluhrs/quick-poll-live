import random
import argparse
import sys
import secrets
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
import datetime

def generate_random_votes(db, poll, count):
    print(f"Generating {count} random votes for poll '{poll.title}' ({poll.slug})...")
    
    words = ["Challenging", "Growth", "Fast", "AI", "Remote", "Busy", "Exciting", "Chaotic", "Innovative", "Collaborative"]
    
    # Pre-fetch questions and options to improve performance
    questions = db.query(models.Question).filter(models.Question.poll_id == poll.id).all()
    q_data = []
    for q in questions:
        options = db.query(models.Option).filter(models.Option.question_id == q.id).all()
        q_data.append({"q": q, "opts": options})

    for i in range(count):
        for item in q_data:
            q = item["q"]
            opts = item["opts"]
            
            vote = models.Vote(question_id=q.id)
            
            if q.question_type == "multiple_choice" and opts:
                selected_opt = random.choice(opts)
                vote.option_id = selected_opt.id
            
            elif q.question_type == "open_ended":
                 vote.text_answer = random.choice(words)

            db.add(vote)
            
        # Commit in batches of 100 to avoid huge transactions if count is large
        if (i + 1) % 100 == 0:
            db.commit()
            print(f"  ...generated {i + 1} votes")

    db.commit()
    print(f"Successfully added {count} votes to poll '{poll.slug}'!")

def seed_initial_data(target_username="admin", count=100):
    db = SessionLocal()
    try:
        # 1. Get User
        user = db.query(models.User).filter(models.User.username == target_username).first()
        if not user:
            print(f"User {target_username} not found. Creating...")
            hashed_password = get_password_hash("password")
            user = models.User(username=target_username, hashed_password=hashed_password)
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user: {user.username} (ID: {user.id})")
        else:
            print(f"Seeding data for existing user: {user.username} (ID: {user.id})")

        # 2. Create Poll
        poll_title = "Tech Team Survey 2025"
        slug = secrets.token_hex(3)
        closes_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        poll = models.Poll(title=poll_title, slug=slug, owner_id=user.id, is_active=True, closes_at=closes_at)
        db.add(poll)
        db.commit()
        db.refresh(poll)
        print(f"Created Poll: {poll.title} (slug: {poll.slug})")

        # 3. Create Questions & Options
        questions_data = [
            {
                "text": "What is your primary programming language?",
                "type": "multiple_choice",
                "vis": "bar",
                "options": ["Python", "JavaScript", "Rust", "Go", "Java", "C++"]
            },
            {
                "text": "Which framework distribution?",
                "type": "multiple_choice",
                "vis": "donut",
                "options": ["React", "Vue", "Angular", "Svelte", "Next.js"]
            },
            {
                "text": "Preferred Office Coffee (Pie)",
                "type": "multiple_choice",
                "vis": "pie",
                "options": ["Espresso", "Latte", "Drip Coffee", "Cold Brew", "Tea", "None"]
            },
            {
                "text": "Project Priorities (Treemap)",
                "type": "multiple_choice",
                "vis": "treemap",
                "options": ["Technical Debt", "New Features", "Customer Support", "Documentation", "Testing Infrastructure", "Security Audits", "Performance Tuning"]
            },
            {
                "text": "What is the biggest challenge in deployment? (Horizontal Bar)",
                "type": "multiple_choice",
                "vis": "horizontal_bar",
                "options": ["Coordinating with multiple teams on release schedules", "Dealing with flaky integration tests in CI/CD", "Database migration compatibility issues", "Environment configuration drift", "Legacy system dependencies"]
            },
            {
                "text": "Rate the team's strengths (Radar)",
                "type": "multiple_choice",
                "vis": "radar",
                "options": ["Communication", "Coding Speed", "Architecture", "Testing", "Design"]
            },
            {
                "text": "Years of Experience",
                "type": "multiple_choice",
                "vis": "radial_bar",
                "options": ["< 1 Year", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"]
            },
            {
                 "text": "One word to describe 2024?",
                 "type": "open_ended",
                 "vis": "wordcloud",
                 "options": [] 
            },
            {
                "text": "Favorite Pizza Topping (Word Cloud)",
                "type": "multiple_choice",
                "vis": "wordcloud",
                "options": ["Pepperoni", "Mushrooms", "Onions", "Sausage", "Bacon", "Extra cheese", "Black olives", "Green peppers"]
            }
        ]

        for idx, q_data in enumerate(questions_data):
            question = models.Question(
                text=q_data["text"],
                question_type=q_data["type"],
                visualization_type=q_data["vis"],
                poll_id=poll.id,
                order=idx
            )
            db.add(question)
            db.commit()
            db.refresh(question)
            
            # Add options
            if q_data["options"]:
                for opt_text in q_data["options"]:
                    option = models.Option(text=opt_text, question_id=question.id)
                    db.add(option)
                db.commit()
            
        print("Created Questions and Options.")

        # 4. Generate Random Votes
        generate_random_votes(db, poll, count)

        print(f"Access the poll at: http://localhost:8081/poll/{slug}/display")
        print(f"Edit the poll at: http://localhost:8081/admin/poll/{slug}/edit")

        # 5. Create an Archived Poll
        expired_date = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        archived_poll = models.Poll(title="Old Team Survey 2024", slug=secrets.token_hex(3), owner_id=user.id, is_active=False, closes_at=expired_date, closed_at=expired_date)
        db.add(archived_poll)
        db.commit()
        print(f"Created Archived Poll: {archived_poll.title}")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

def seed_existing_poll(slug: str, count: int):
    db = SessionLocal()
    try:
        poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
        if not poll:
            print(f"Error: Poll with slug '{slug}' not found.")
            return

        generate_random_votes(db, poll, count)
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Data Script")
    parser.add_argument("--slug", help="Slug of existing poll to seed votes for")
    parser.add_argument("--count", type=int, default=100, help="Number of random votes to generate (default: 100)")
    parser.add_argument("--user", default="admin", help="Username for initial seed (default: admin)")
    
    args = parser.parse_args()

    if args.slug:
        seed_existing_poll(args.slug, args.count)
    else:
        seed_initial_data(args.user, args.count)
