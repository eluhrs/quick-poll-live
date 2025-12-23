from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
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
    # 2. Fetch sorted (Newest First) - GLOBAL ACCESS
    query = db.query(models.Poll)
    # query = db.query(models.Poll).filter(models.Poll.owner_id == current_user.id) # DISABLED FOR SHARED ACCESS
    if active_only:
        query = query.filter(models.Poll.is_active == True)
    
    results = query.order_by(models.Poll.created_at.desc()).all()
    print(f"DEBUG LIST_POLLS: UserID={current_user.id}, ActiveOnly={active_only}, Found={len(results)}")
    for p in results:
        print(f"  - Poll: {p.slug} (Owner: {p.owner_id}, Active: {p.is_active})")
    return results

@router.get("/{slug}", response_model=schemas.Poll)
def get_poll(slug: str, db: Session = Depends(database.get_db)):
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll

@router.put("/{slug}", response_model=schemas.Poll)
def update_poll(slug: str, poll_update: schemas.PollUpdate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
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
    db.refresh(poll)
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return poll

@router.put("/{slug}/close", response_model=schemas.Poll)
def close_poll(slug: str, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_active = False
    poll.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(poll)
    db.refresh(poll)
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return poll

@router.put("/{slug}/open", response_model=schemas.Poll)
def reopen_poll(slug: str, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_active = True
    poll.closed_at = None
    db.commit()
    db.refresh(poll)
    db.refresh(poll)
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return poll

@router.post("/{slug}/questions", response_model=schemas.Question)
def add_question(slug: str, question: schemas.QuestionCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Calculate Order: Max current order + 1
    max_order_q = db.query(models.Question).filter(models.Question.poll_id == poll.id).order_by(models.Question.order.desc()).first()
    new_order = (max_order_q.order + 1) if max_order_q else 0

    db_question = models.Question(
        poll_id=poll.id, 
        text=question.text, 
        question_type=question.question_type, 
        visualization_type=question.visualization_type,
        order=new_order
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    for opt in question.options:
        db_option = models.Option(question_id=db_question.id, text=opt.text)
        db.add(db_option)
    
    db.commit()
    db.refresh(db_question)
    db.refresh(db_question)
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return db_question

@router.delete("/{slug}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(slug: str, question_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    question = db.query(models.Question).filter(models.Question.id == question_id, models.Question.poll_id == poll.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    db.delete(question)
    db.commit()
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return None

@router.put("/{slug}/questions/reorder")
def reorder_questions(slug: str, ordered_ids: List[int] = Body(...), background_tasks: BackgroundTasks = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Note: background_tasks=None default because Body(...) comes before it in arg list sometimes causing issues if fastAPI order matters, 
    # but actually FastAPI is smart. Let's strictly type it.
    pass 
    # Actually, simpler to just add it. reorder_questions(..., background_tasks: BackgroundTasks, ...)

    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Check all questions belong to poll
    questions = db.query(models.Question).filter(models.Question.poll_id == poll.id).all()
    q_map = {q.id: q for q in questions}
    
    for idx, q_id in enumerate(ordered_ids):
        if q_id in q_map:
            q_map[q_id].order = idx
            
    db.commit()
            
    db.commit()
    if background_tasks:
        background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
    return {"status": "success"}

@router.put("/{slug}/questions/{question_id}", response_model=schemas.Question)
def update_question(slug: str, question_id: int, question_update: schemas.QuestionCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify poll ownership
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    db_question = db.query(models.Question).filter(models.Question.id == question_id, models.Question.poll_id == poll.id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update fields
    db_question.text = question_update.text
    db_question.question_type = question_update.question_type
    db_question.visualization_type = question_update.visualization_type
    
    # Non-destructive Option Update
    # 1. Fetch existing options
    existing_options = db.query(models.Option).filter(models.Option.question_id == db_question.id).all()
    existing_map = {opt.id: opt for opt in existing_options}
    
    # 2. Track which existing IDs are kept
    kept_ids = set()
    
    # 3. Iterate new options
    for opt_create in question_update.options:
        # If ID provided and valid, update it
        if opt_create.id and opt_create.id in existing_map:
            existing_opt = existing_map[opt_create.id]
            existing_opt.text = opt_create.text
            kept_ids.add(opt_create.id)
        else:
            # Create new
            new_opt = models.Option(question_id=db_question.id, text=opt_create.text)
            db.add(new_opt)
            
    # 4. Delete removed options
    for opt in existing_options:
        if opt.id not in kept_ids:
            db.delete(opt)

    db.commit()
    db.refresh(db_question)
    db.refresh(db_question)
    background_tasks.add_task(manager.broadcast, {"event": "update", "poll_id": poll.id}, slug)
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
    # poll = db.query(models.Poll).filter(models.Poll.slug == slug, models.Poll.owner_id == current_user.id).first()
    poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    db.delete(poll)
    db.commit()
    return None

