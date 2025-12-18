import random
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
import secrets

def seed_data():
    db = SessionLocal()
    try:
        # 1. Get Admin User
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            print("Admin user not found. Creating...")
            hashed_password = get_password_hash("password")
            admin = models.User(username="admin", hashed_password=hashed_password)
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Create Poll
        poll_title = "Tech Team Survey 2025"
        slug = secrets.token_hex(3)
        # Set close date to 7 days from now
        import datetime
        closes_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        poll = models.Poll(title=poll_title, slug=slug, owner_id=admin.id, is_active=True, closes_at=closes_at)
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

        created_questions = []

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
            created_opts = []
            if q_data["options"]:
                for opt_text in q_data["options"]:
                    option = models.Option(text=opt_text, question_id=question.id)
                    db.add(option)
                    created_opts.append(option)
                db.commit()
            
            created_questions.append({"q": question, "opts": created_opts})

        print("Created Questions and Options.")

        # 4. Generate 100 Votes
        print("Generating 100 responses...")
        
        words = ["Challenging", "Growth", "Fast", "AI", "Remote", "Busy", "Exciting", "Chaotic"]

        for i in range(100):
            # For each question, cast a vote
            for item in created_questions:
                q = item["q"]
                opts = item["opts"]
                
                vote = models.Vote(question_id=q.id)
                
                if q.question_type == "multiple_choice" and opts:
                    # Pick a random option, weighted slightly to make charts interesting
                    # e.g. triangular distribution to favor middle options or just random
                    selected_opt = random.choice(opts)
                    vote.option_id = selected_opt.id
                
                elif q.question_type == "open_ended":
                     vote.text_answer = random.choice(words)

                db.add(vote)
        
        db.commit()
        print("Successfully generated 100 responses!")
        print(f"Access the poll at: http://localhost:8081/poll/{slug}/display")
        print(f"Edit the poll at: http://localhost:8081/admin/poll/{slug}/edit")

        # 5. Create an Archived Poll
        expired_date = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        archived_poll = models.Poll(title="Old Team Survey 2024", slug=secrets.token_hex(3), owner_id=admin.id, is_active=False, closes_at=expired_date, closed_at=expired_date)
        db.add(archived_poll)
        db.commit()
        print(f"Created Archived Poll: {archived_poll.title}")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
