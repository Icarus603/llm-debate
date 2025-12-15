from __future__ import annotations

from celery import Celery

from llm_debate.core.settings import load_settings

settings = load_settings()

celery_app = Celery(
    "llm_debate",
    broker=str(settings.redis_url),
    backend=str(settings.redis_url),
    include=["llm_debate.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

