from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum
import datetime
import secrets

from .database import Base

class QuestionType(str, enum.Enum):
    OPEN_ENDED = "open_ended"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    polls = relationship("Poll", back_populates="owner")

class Poll(Base):
    __tablename__ = "polls"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    slug = Column(String, unique=True, index=True, default=lambda: secrets.token_hex(3))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True) # Manually closed
    closes_at = Column(DateTime, nullable=True) # Auto-close schedule
    color_palette = Column(String, default="lehigh_soft") # lehigh_soft, vibrant, pastel, dark
    slide_duration = Column(Integer, default=3)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="polls")
    questions = relationship("Question", back_populates="poll", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(SQLEnum(QuestionType), default=QuestionType.MULTIPLE_CHOICE)
    visualization_type = Column(String, default="bar") # bar, pie, wordcloud, list
    poll_id = Column(Integer, ForeignKey("polls.id"))
    text = Column(String)
    order = Column(Integer, default=0)

    poll = relationship("Poll", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="question", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    text = Column(String)

    question = relationship("Question", back_populates="options")
    votes = relationship("Vote", back_populates="option")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    option_id = Column(Integer, ForeignKey("options.id"), nullable=True)
    text_answer = Column(Text, nullable=True) # For open-ended
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="votes")
    option = relationship("Option", back_populates="votes")
