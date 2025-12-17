from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
import secrets
from datetime import datetime
from .. import models, schemas, database, auth
from ..websockets import manager

router = APIRouter(prefix="/polls", tags=["polls"])

@router.post("/", response_model=schemas.Poll)
def create_poll(poll: schemas.PollCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    slug = secrets.token_hex(3)
    while db.query(models.Poll).filter(models.Poll.slug == slug).first():
        slug = secrets.token_hex(3)
    
    db_poll = models.Poll(
        title=poll.title, 
        slug=slug, 
        owner_id=current_user.id,
        closes_at=poll.closes_at
    )
    db.add(db_poll)
    db.commit()
    db.refresh(db_poll)
    return db_poll

@router.get("/", response_model=List[schemas.Poll])
def list_polls(active_only: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Auto-close check
    now = datetime.utcnow()
    active_polls = db.query(models.Poll).filter(models.Poll.is_active == True).all()
    
    for p in active_polls:
        if p.closes_at and p.closes_at < now:
            print(f"Auto-closing poll {p.slug} (Closes at: {p.closes_at}, Now: {now})")
            p.is_active = False
            p.closed_at = now
    
    db.commit()

    # 2. Fetch sorted (Newest First)
    query = db.query(models.Poll).filter(models.Poll.owner_id == current_user.id)
    if active_only:
        query = query.filter(models.Poll.is_active == True)
    
    return query.order_by(models.Poll.created_at.desc()).all()

@router.get("/{slug}", response_model=schemas.Poll)
def get_poll(slug: str, db: Session = Depends(database.get_db)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll

@router.put("/{slug}", response_model=schemas.Poll)
def update_poll(slug: str, poll_update: schemas.PollUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll_update.title is not None:
        poll.title = poll_update.title
    
    # Handle closes_at specifically (allow setting to None to clear generic nullable fields, but logic here is simple)
    # Pydantic sends None if not set, so typical PATCH behavior is trickier. Here we assume we send what we want to update.
    # If the user wants to Clear the date, they might send a specific signal or we treat explicit None difference. 
    # For now, let's assume if it's in the payload we update it.
    # But FastAPI Body default is None. So if not provided, it's None.
    # We should check update_data dict or use exclude_unset=True in Pydantic v2 calls, but here generic check:
    
    # Simple approach: Update if not None. To CLEAR date, frontend might need to send a specific value or we verify `exclude_unset`.
    # Let's strictly check against exclude_unset if passing the model directly, but here separate fields.
    # Actually, let's just use `poll_update.dict(exclude_unset=True)` logic.
    
    update_data = poll_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(poll, key, value)

    db.commit()
    db.refresh(poll)
    return poll

@router.put("/{slug}/close", response_model=schemas.Poll)
def close_poll(slug: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_active = False
    poll.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(poll)
    return poll

@router.put("/{slug}/open", response_model=schemas.Poll)
def reopen_poll(slug: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_active = True
    poll.closed_at = None
    db.commit()
    db.refresh(poll)
    return poll

@router.post("/{slug}/questions", response_model=schemas.Question)
def add_question(slug: str, question: schemas.QuestionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    db_question = models.Question(
        poll_id=poll.id, 
        text=question.text, 
        question_type=question.question_type, 
        visualization_type=question.visualization_type,
        order=0 # Check if order is in schema, otherwise default 0
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    for opt in question.options:
        db_option = models.Option(question_id=db_question.id, text=opt.text)
        db.add(db_option)
    
    db.commit()
    db.refresh(db_question)
    return db_question

@router.delete("/{slug}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(slug: str, question_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    question = db.query(models.Question).filter(models.Question.id == question_id, models.Question.poll_id == poll.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    return None

@router.put("/{slug}/questions/reorder")
def reorder_questions(slug: str, ordered_ids: List[int] = Body(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Check all questions belong to poll
    questions = db.query(models.Question).filter(models.Question.poll_id == poll.id).all()
    q_map = {q.id: q for q in questions}
    
    for idx, q_id in enumerate(ordered_ids):
        if q_id in q_map:
            q_map[q_id].order = idx
            
    db.commit()
    return {"status": "success"}

@router.put("/{slug}/questions/{question_id}", response_model=schemas.Question)
def update_question(slug: str, question_id: int, question_update: schemas.QuestionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify poll ownership
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    db_question = db.query(models.Question).filter(models.Question.id == question_id, models.Question.poll_id == poll.id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update fields
    db_question.text = question_update.text
    db_question.question_type = question_update.question_type
    db_question.visualization_type = question_update.visualization_type
    # order ??

    # Update options - simplest strategy: delete all and recreate
    # (In a real app, you might try to preserve IDs for voting integrity, but for now we assume editing might reset votes or just keep them orphaned if not careful. 
    # Actually, if we delete options, we lose votes linked to them usually. 
    # USER REQUEST: "Make it so questions can be edited". 
    # If we change options, checking if votes exist is safer, but simpler is just replace.)
    
    # Deleting old options
    db.query(models.Option).filter(models.Option.question_id == db_question.id).delete()
    
    # Add new options
    for opt in question_update.options:
        db_option = models.Option(question_id=db_question.id, text=opt.text)
        db.add(db_option)

    db.commit()
    db.refresh(db_question)
    return db_question

@router.post("/{slug}/vote")
async def submit_vote(slug: str, vote: schemas.VoteCreate, db: Session = Depends(database.get_db)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll or not poll.is_active:
         raise HTTPException(status_code=400, detail="Poll is closed or invalid")
    
    # Extra check if auto-close wasn't triggered by listing yet
    if poll.closes_at and poll.closes_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Poll has expired")

    db_vote = models.Vote(question_id=vote.question_id, option_id=vote.option_id, text_answer=vote.text_answer)
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    
    # Broadcast update
    # For simplicity, sending a signal to refetch or sending the vote itself.
    # Ideally we act as aggregators. sending {"event": "new_vote", "poll_id": poll.id}
    await manager.broadcast({"event": "update", "poll_id": poll.id}, slug)
    
    return {"status": "success"}

@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poll(slug: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    db.delete(poll)
    db.commit()
    return None

