import asyncio
from utils.logging import log
from services.config import TRAINING_CUTOFF
from services.data_fetcher import get_headline_df

_DEFAULT_SERVICES = [
    "rail_mrt_kajang",
    "rail_lrt_kj",
    "rail_komuter",
    "rail_mrt_pjy",
    "rail_lrt_ampang",
]


async def warm_backtest_cache() -> None:
    """
    Pre-compute backtest results on startup so first user request is fast.
    Runs non-blocking — startup is not delayed if this fails.
    """
    try:
        from services.backtesting import run_backtest
        from utils.cache import cache_set
        from services.config import CACHE_TTL_BACKTEST

        df, _ = await get_headline_df()
        warmed = 0
        for service in _DEFAULT_SERVICES:
            try:
                result = run_backtest(df, service, TRAINING_CUTOFF)
                cache_key = f"backtest_{service}_{TRAINING_CUTOFF}"
                await cache_set(cache_key, result, ttl=CACHE_TTL_BACKTEST)
                warmed += 1
            except Exception as e:
                log.warning("backtest_warmup_service_failed", service=service, error=str(e))

        log.info("backtest_cache_warmed", services=warmed, total=len(_DEFAULT_SERVICES))
    except Exception as e:
        log.warning("backtest_warmup_failed", error=str(e))
