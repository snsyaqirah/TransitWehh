import json, os
from fastapi import APIRouter, Request
from services.data_fetcher import get_headline_df
from services.insights import generate_insights
from middleware.rate_limit import limiter, LIMIT_GENERAL

router = APIRouter(prefix="/api", tags=["meta"])

_ANNOTATIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "annotations.json")
_MY50_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "my50_fares.json")


@router.get("/insights")
@limiter.limit(LIMIT_GENERAL)
async def get_insights(request: Request):
    df, is_stale = await get_headline_df()
    insights = generate_insights(df)
    return {"data": insights, "is_stale": is_stale}


@router.get("/annotations")
@limiter.limit(LIMIT_GENERAL)
async def get_annotations(request: Request):
    with open(_ANNOTATIONS_PATH) as f:
        data = json.load(f)
    return {"data": data}


@router.get("/tools/my50-fares")
@limiter.limit(LIMIT_GENERAL)
async def get_my50_fares(request: Request):
    with open(_MY50_PATH) as f:
        data = json.load(f)
    return data
