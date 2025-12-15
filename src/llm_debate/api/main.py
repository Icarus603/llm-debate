from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from llm_debate.api.routes.debates import router as debates_router

app = FastAPI(title="llm-debate API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(debates_router, prefix="/debates", tags=["debates"])
