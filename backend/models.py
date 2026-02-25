from sqlalchemy import Column, Integer, Date, Float, UniqueConstraint
from database import Base


class MilkEntry(Base):
    __tablename__ = "milk_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    an = Column(Integer, nullable=False, default=0)
    fn = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="unique_user_date"),
    )


class MilkPrice(Base):
    __tablename__ = "milk_prices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="unique_user_month"),
    )