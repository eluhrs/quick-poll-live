from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .models import QuestionType

class VoteBase(BaseModel):
    pass

class Vote(VoteBase):
    id: int
    question_id: int
    option_id: Optional[int]
    text_answer: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class OptionBase(BaseModel):
    text: str

class OptionCreate(OptionBase):
    pass

class Option(OptionBase):
    id: int
    question_id: int
    votes: List[Vote] = []
    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    text: str
    question_type: QuestionType
    visualization_type: str = "bar"

class QuestionCreate(QuestionBase):
    options: List[OptionCreate] = []

class Question(QuestionBase):
    id: int
    poll_id: int
    order: int = 0
    options: List[Option] = []
    votes: List[Vote] = []
    class Config:
        from_attributes = True

# ... Poll schemas follow


class PollBase(BaseModel):
    title: str

class PollCreate(PollBase):
    closes_at: Optional[datetime] = None
    color_palette: Optional[str] = "lehigh_soft"

class PollUpdate(BaseModel):
    title: Optional[str] = None
    closes_at: Optional[datetime] = None
    color_palette: Optional[str] = None
    slide_duration: Optional[int] = None
    enable_title_page: Optional[bool] = None
    is_active: Optional[bool] = None

class Poll(BaseModel):
    id: int
    title: str
    slug: str
    owner_id: int
    created_at: datetime
    closes_at: Optional[datetime]
    color_palette: str
    slide_duration: int
    is_active: bool
    questions: List[Question] = []
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    polls: List[Poll] = []
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class VoteCreate(BaseModel):
    question_id: int
    option_id: Optional[int] = None
    text_answer: Optional[str] = None

