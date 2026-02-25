from sqlalchemy import Column, Integer, Date, Float, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)

    milk_entries = relationship("MilkEntry", back_populates="user", cascade="all, delete-orphan")
    milk_prices = relationship("MilkPrice", back_populates="user", cascade="all, delete-orphan")


class MilkEntry(Base):
    __tablename__ = "milk_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    an = Column(Integer, nullable=False, default=0)
    fn = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="milk_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="unique_user_date"),
    )


class MilkPrice(Base):
    __tablename__ = "milk_prices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    user = relationship("User", back_populates="milk_prices")

    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="unique_user_month"),
    )