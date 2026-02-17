from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MonitoredSearch(Base):
    __tablename__ = "monitored_searches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    query: Mapped[str] = mapped_column(String, nullable=False)
    filters: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # year_min, year_max, type
    check_interval_hours: Mapped[int] = mapped_column(Integer, default=24)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    known_result_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    results: Mapped[list] = relationship(
        "MonitoredSearchResult", back_populates="monitor",
        cascade="all, delete-orphan",
    )


class MonitoredSearchResult(Base):
    __tablename__ = "monitored_search_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    monitor_id: Mapped[int] = mapped_column(Integer, ForeignKey("monitored_searches.id"), nullable=False)
    paper_openalex_id: Mapped[str] = mapped_column(String, nullable=False)
    paper_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    found_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    monitor: Mapped["MonitoredSearch"] = relationship("MonitoredSearch", back_populates="results")
