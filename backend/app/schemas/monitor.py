from typing import Dict, List, Optional

from pydantic import BaseModel


class MonitorCreate(BaseModel):
    name: str
    query: str
    filters: Optional[Dict] = None
    check_interval_hours: int = 24


class MonitorSummary(BaseModel):
    id: int
    name: str
    query: str
    check_interval_hours: int
    last_checked_at: Optional[str] = None
    known_result_count: int = 0
    unread_count: int = 0
    created_at: Optional[str] = None


class MonitorResultOut(BaseModel):
    id: int
    paper_openalex_id: str
    paper_title: Optional[str] = None
    is_read: bool = False
    found_at: Optional[str] = None


class MonitorDetail(MonitorSummary):
    filters: Optional[Dict] = None
    results: List[MonitorResultOut] = []
