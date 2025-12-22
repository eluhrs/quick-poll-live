import random
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
import secrets
import datetime
import sys

def create_liberty_poll(target_username="admin"):
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
        poll_title = "What Does Liberty Mean to You?"
        slug = f"liberty-{secrets.token_hex(2)}" # Unique slug
        # Set close date to 30 days from now
        closes_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        
        # Check if poll exists with same title (optional, but good for idempotency if running multiple times)
        # But user wants a 'new' poll, so slug randomness handles it.
        
        poll = models.Poll(title=poll_title, slug=slug, owner_id=user.id, is_active=True, closes_at=closes_at)
        db.add(poll)
        db.commit()
        db.refresh(poll)
        print(f"Created Poll: {poll.title} (slug: {poll.slug})")

        # 3. Define Questions
        questions_data = [
            {
                "text": "Which of the following concepts is most essential to your personal definition of \"liberty\"?",
                "type": "multiple_choice",
                "vis": "donut",
                "options": [
                    "Freedom from government interference and control.",
                    "The right to access necessities like healthcare, education, and housing.",
                    "The power to challenge injustice through protest and advocacy.",
                    "All of the above."
                ],
                "weights": [40, 15, 10, 35] # Polarized between A and D
            },
            {
                "text": "The core ideals of liberty and equality expressed in the American founding documents have been fully achieved for all people in the United States today.",
                "type": "multiple_choice",
                "vis": "horizontal_bar",
                "options": [
                    "True — The ideals have been fully realized.",
                    "False — The ideals have not been realized at all.",
                    "Partially — Progress has been made, but significant work remains.",
                    "Theory Only — The ideals exist mostly in our founding documents."
                ],
                "weights": [5, 10, 55, 30] # Skewed towards C/D
            },
            {
                "text": "When an individual’s liberty is actively denied or threatened, who holds the greatest responsibility for fighting for that liberty?",
                "type": "multiple_choice",
                "vis": "treemap",
                "options": [
                    "The individual themselves.",
                    "The government or justice system.",
                    "The community and fellow citizens.",
                    "All stakeholders share responsibility."
                ],
                "weights": [15, 10, 20, 55] # Bias towards D
            },
            {
                "text": "A person’s right to liberty should include the freedom to act in a way that directly harms or restricts the liberty of others.",
                "type": "multiple_choice", 
                "vis": "pie",
                "options": [
                    "True",
                    "False"
                ],
                "weights": [8, 92] # Strong consensus for False
            },
            {
                "text": "In the context of \"Unfinished Revolutions,\" which current area of advocacy do you feel is the most critical for advancing liberty today?",
                "type": "multiple_choice",
                "vis": "radial_bar", 
                "options": [
                    "Civil Rights and Racial Justice",
                    "Women’s Rights and Gender Equality",
                    "Economic Justice and Workers’ Rights",
                    "Environmental Justice and Climate Action",
                    "Digital Liberty, Privacy, and Information Access",
                    "Educational Equity and Intellectual Freedom"
                ],
                "weights": [10, 10, 35, 20, 15, 10] # Economic and Env as top
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
            
            # Store weights alongside options for vote generation
            created_questions.append({"q": question, "opts": created_opts, "weights": q_data.get("weights")})

        print("Created Questions and Options.")

        # 4. Generate 500 Random Responses
        print("Generating 500 responses...")
        
        for i in range(500):
            for item in created_questions:
                q = item["q"]
                opts = item["opts"]
                weights = item["weights"]
                
                vote = models.Vote(question_id=q.id)
                
                # Weighted Random selection logic
                if opts:
                    # random.choices returns a list [choice], so take [0]
                    # If weights are missing for some reason, default to uniform
                    if weights and len(weights) == len(opts):
                        selected_opt = random.choices(opts, weights=weights, k=1)[0]
                    else:
                        selected_opt = random.choice(opts)
                    
                    vote.option_id = selected_opt.id
                
                db.add(vote)
            
            if i % 50 == 0:
                 print(f"Generated {i} respondents...")

        db.commit()
        print("Successfully generated 500 responses!")
        print(f"Poll Slug: {poll.slug}")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    target_user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    create_liberty_poll(target_user)
