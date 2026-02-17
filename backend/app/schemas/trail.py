from typing import Dict, List, Optional

from pydantic import BaseModel


class TrailStepCreate(BaseModel):
    step_type: str
    payload: Optional[Dict] = None
    result_snapshot: Optional[Dict] = None


class TrailStepOut(BaseModel):
    id: int
    step_order: int
    step_type: str
    payload: Optional[Dict] = None
    result_snapshot: Optional[Dict] = None
    created_at: Optional[str] = None


class TrailCreate(BaseModel):
    name: Optional[str] = None


class TrailSummary(BaseModel):
    id: int
    name: Optional[str] = None
    step_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TrailDetail(TrailSummary):
    steps: List[TrailStepOut] = []


class TrailAddStep(BaseModel):
    step_type: str
    payload: Optional[Dict] = None
    result_snapshot: Optional[Dict] = None
