from pydantic import BaseModel
from typing import List


class MilkDaySchema(BaseModel):
    day: int
    an: int
    fn: int

class MilkMonthCreateSchema(BaseModel):
    user_id: int
    year: int
    month: int
    milk_price: float
    daily_entries: List[MilkDaySchema]
    
class MilkMonthResponseSchema(BaseModel):
    year: int
    month: int
    milk_price: float
    daily_entries: List[MilkDaySchema]

class ConsolidateResponseSchema(BaseModel):
    year: int
    month: int
    milk_price: float
    total_milk: int
    total_amount: float
    quantity_frequency: dict[int, int]