from fastapi import APIRouter, Request, Query
from services.data_fetcher import get_headline_df
from services.nowcast import get_nowcast
from middleware.rate_limit import limiter, LIMIT_GENERAL

router = APIRouter(prefix="/api/nowcast", tags=["nowcast"])


@router.get("")
@limiter.limit(LIMIT_GENERAL)
async def nowcast(request: Request, service: str = Query("rail_mrt_kajang")):
    df, is_stale = await get_headline_df()
    result = get_nowcast(df, service)
    result["is_stale"] = is_stale
    return result
