from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import JSON, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Paper(Base):
    __tablename__ = "papers"

    openalex_id: Mapped[str] = mapped_column(String, primary_key=True)
    doi: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    publication_year: Mapped[Optional[int]] = mapped_column(Integer, index=True, nullable=True)
    publication_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cited_by_count: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    abstract_inverted_index: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    authorships_json: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)
    primary_location_json: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    open_access_json: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    topics_json: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)
    referenced_work_ids: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
