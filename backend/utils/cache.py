import asyncio
from typing import Any, Callable, Awaitable
from utils.logging import log

_store: dict[str, tuple[Any, float]] = {}
_locks: dict[str, asyncio.Lock] = {}


def _get_lock(key: str) -> asyncio.Lock:
    if key not in _locks:
        _locks[key] = asyncio.Lock()
    return _locks[key]


async def cache_get(key: str, ignore_ttl: bool = False) -> Any | None:
    import time
    if key in _store:
        value, expires_at = _store[key]
        if ignore_ttl or time.time() < expires_at:
            return value
    return None


async def cache_set(key: str, value: Any, ttl: int) -> None:
    import time
    _store[key] = (value, time.time() + ttl)


async def fetch_with_stale_fallback(
    cache_key: str,
    fetch_fn: Callable[[], Awaitable[Any]],
    ttl: int,
) -> tuple[Any, bool]:
    """
    Returns (data, is_stale).
    On upstream failure: serves expired cache if available, raises if nothing cached.
    """
    import httpx

    async with _get_lock(cache_key):
        fresh = await cache_get(cache_key)
        if fresh is not None:
            return fresh, False

        try:
            data = await fetch_fn()
            await cache_set(cache_key, data, ttl)
            return data, False
        except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
            stale = await cache_get(cache_key, ignore_ttl=True)
            if stale is not None:
                log.warning("stale_cache_served", key=cache_key, reason=str(e))
                return stale, True
            raise
