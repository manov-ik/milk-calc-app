from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import calendar

from app.database import get_db
from app.models import MilkEntry, MilkPrice
from app.schemas import ConsolidateResponseSchema, MilkMonthCreateSchema, MilkMonthPatchSchema, MilkMonthResponseSchema

router = APIRouter()

@router.post("/month")
def save_month(
    payload: MilkMonthCreateSchema,
    db: Session = Depends(get_db)):
    try:
        # 1️⃣ Compute start and end dates
        start_date = date(payload.year, payload.month, 1)
        last_day = calendar.monthrange(payload.year, payload.month)[1]
        end_date = date(payload.year, payload.month, last_day)

        # 2️⃣ Delete old entries for that user + month
        db.query(MilkEntry).filter(
            MilkEntry.user_id == payload.user_id,
            MilkEntry.date >= start_date,
            MilkEntry.date <= end_date
        ).delete()

        # 3️⃣ Insert new entries
        for entry in payload.daily_entries:
            entry_date = date(payload.year, payload.month, entry.day)

            new_entry = MilkEntry(
                user_id=payload.user_id,
                date=entry_date,
                an=entry.an,
                fn=entry.fn
            )

            db.add(new_entry)
        
        # 4️⃣ Upsert milk price
        existing_price = db.query(MilkPrice).filter(
            MilkPrice.user_id == payload.user_id,
            MilkPrice.year == payload.year,
            MilkPrice.month == payload.month
        ).first()
        
        if existing_price:
            existing_price.price = payload.milk_price
        else:
            new_price = MilkPrice(
                user_id=payload.user_id,
                year=payload.year,
                month=payload.month,
                price=payload.milk_price
            )
            db.add(new_price)

        # 5️⃣ Commit transaction
        db.commit()

        return {"message": "Month saved successfully"}



    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/month")
def patch_month(
    payload: MilkMonthPatchSchema,
    db: Session = Depends(get_db)):
    """Upsert only the changed entries for a month (no delete-all)."""
    try:
        # 1️⃣ Upsert each changed daily entry
        for entry in payload.daily_entries:
            entry_date = date(payload.year, payload.month, entry.day)

            existing = db.query(MilkEntry).filter(
                MilkEntry.user_id == payload.user_id,
                MilkEntry.date == entry_date
            ).first()

            if existing:
                existing.an = entry.an
                existing.fn = entry.fn
            else:
                db.add(MilkEntry(
                    user_id=payload.user_id,
                    date=entry_date,
                    an=entry.an,
                    fn=entry.fn
                ))

        # 2️⃣ Upsert milk price (only if provided)
        if payload.milk_price is not None:
            existing_price = db.query(MilkPrice).filter(
                MilkPrice.user_id == payload.user_id,
                MilkPrice.year == payload.year,
                MilkPrice.month == payload.month
            ).first()

            if existing_price:
                existing_price.price = payload.milk_price
            else:
                db.add(MilkPrice(
                    user_id=payload.user_id,
                    year=payload.year,
                    month=payload.month,
                    price=payload.milk_price
                ))

        # 3️⃣ Commit
        db.commit()
        return {"message": "Changes saved", "entries_updated": len(payload.daily_entries)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/month", response_model=MilkMonthResponseSchema)
def get_month(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    entries = db.query(MilkEntry).filter(
        MilkEntry.user_id == user_id,
        MilkEntry.date >= start_date,
        MilkEntry.date <= end_date
    ).order_by(MilkEntry.date).all()

    price_obj = db.query(MilkPrice).filter(
        MilkPrice.user_id == user_id,
        MilkPrice.year == year,
        MilkPrice.month == month
    ).first()

    milk_price = price_obj.price if price_obj else 0

    daily_entries = [
        {
            "day": entry.date.day,
            "an": entry.an,
            "fn": entry.fn
        }
        for entry in entries
    ]

    return {
        "year": year,
        "month": month,
        "milk_price": milk_price,
        "daily_entries": daily_entries
    }

@router.get("/consolidate", response_model=ConsolidateResponseSchema)
def consolidate_data(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    
    # Placeholder for future consolidation logic
    entries = db.query(MilkEntry).filter(
        MilkEntry.user_id == user_id,
        MilkEntry.date >= date(year, month, 1),
        MilkEntry.date <= date(year, month, calendar.monthrange(year, month)[1])
    ).all()
    MilkPrice_obj = db.query(MilkPrice).filter(
        MilkPrice.user_id == user_id,
        MilkPrice.year == year,
        MilkPrice.month == month
    ).first()
    frequency = {}


    for entry in entries:
        if entry.fn > 0:
            frequency[entry.fn] = frequency.get(entry.fn, 0) + 1
        if entry.an > 0:
            frequency[entry.an] = frequency.get(entry.an, 0) + 1
        
    price = MilkPrice_obj.price if MilkPrice_obj else 0
    total_milk_ml = sum(entry.an + entry.fn for entry in entries)
    total_milk_liters = round(total_milk_ml / 1000, 2)
    total_amt = (total_milk_ml / 1000) * price

    return ConsolidateResponseSchema(
        year=year,
        month=month,
        milk_price=price,
        total_milk=total_milk_liters,
        total_amount=round(total_amt),
        quantity_frequency=frequency
    )