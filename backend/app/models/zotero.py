from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ZoteroConfig(Base):
    __tablename__ = "zotero_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    api_key: Mapped[str] = mapped_column(String, nullable=False)
    library_id: Mapped[str] = mapped_column(String, nullable=False)
    library_type: Mapped[str] = mapped_column(String, default="user")  # "user" or "group"
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class ZoteroPaperMapping(Base):
    __tablename__ = "zotero_paper_mappings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paper_openalex_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    zotero_item_key: Mapped[str] = mapped_column(String, nullable=False, index=True)
    zotero_collection_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
