from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    papers: Mapped[list] = relationship(
        "CollectionPaper", back_populates="collection", cascade="all, delete-orphan"
    )


class CollectionPaper(Base):
    __tablename__ = "collection_papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_id: Mapped[int] = mapped_column(Integer, ForeignKey("collections.id"), nullable=False)
    paper_openalex_id: Mapped[str] = mapped_column(String, ForeignKey("papers.openalex_id"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    collection: Mapped["Collection"] = relationship("Collection", back_populates="papers")
    paper: Mapped["Paper"] = relationship("Paper")


# Import Paper here to resolve forward reference
from app.models.paper import Paper  # noqa: E402, F401
