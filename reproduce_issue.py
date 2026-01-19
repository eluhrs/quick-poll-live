from app.database import SessionLocal
from app import models
import secrets
import datetime
import random

db = SessionLocal()
try:
    # Create user if needed
    user = db.query(models.User).filter(models.User.username == 'admin').first()
    
    # Create Poll
    slug = "radial_test"
    poll = models.Poll(title="Radial Bar Test", slug=slug, owner_id=user.id, is_active=True, closes_at=datetime.datetime.utcnow() + datetime.timedelta(days=1))
    db.add(poll)
    db.commit()
    
    # Create Question with 10 options
    q = models.Question(text="Testing 10 Options", question_type="multiple_choice", visualization_type="radial_bar", poll_id=poll.id, order=0)
    db.add(q)
    db.commit()
    
    options = []
    for i in range(10):
        opt = models.Option(text=f"Option {i+1}", question_id=q.id)
        db.add(opt)
        options.append(opt)
    db.commit()
    
    # Add votes to all options
    for opt in options:
        # random votes 1-10
        count = random.randint(1, 10)
        for _ in range(count):
            v = models.Vote(question_id=q.id, option_id=opt.id)
            db.add(v)
    db.commit()
    
    print(f"Created poll {slug} with 10 options and votes.")
    
except Exception as e:
    print(e)
finally:
    db.close()
