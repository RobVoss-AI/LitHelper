from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SearchTrail(Base):
    __tablename__ = "search_trails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    steps: Mapped[list] = relationship(
        "SearchTrailStep", back_populates="trail",
        cascade="all, delete-orphan", order_by="SearchTrailStep.step_order",
    )


class SearchTrailStep(Base):
    __tablename__ = "search_trail_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trail_id: Mapped[int] = mapped_column(Integer, ForeignKey("search_trails.id"), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    step_type: Mapped[str] = mapped_column(String, nullable=False)  # "search" | "paper_view" | "citation_explore" | "discovery"
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # query, paper_id, etc.
    result_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # compact result data
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    trail: Mapped["SearchTrail"] = relationship("SearchTrail", back_populates="steps")
