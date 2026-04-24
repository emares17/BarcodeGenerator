import os
import logging

logger = logging.getLogger(__name__)

_client = None
_checked = False

ZIP_CACHE_TTL = 120
ZIP_CACHE_MAX_BYTES = 5_000_000


def get_redis():
    """Return a Redis client or None if Redis is unavailable."""
    global _client, _checked
    if _checked:
        return _client

    _checked = True
    redis_url = os.getenv('REDIS_URL')
    if not redis_url:
        return None

    try:
        import redis
        c = redis.from_url(redis_url, socket_connect_timeout=2, socket_timeout=2, decode_responses=False)
        c.ping()
        _client = c
        logger.info("Redis connected")
    except Exception as e:
        logger.warning("Redis unavailable, running without cache: %s", e)

    return _client


def cache_zip(user_sheet_id: str, zip_bytes: bytes) -> None:
    """Write ZIP bytes to cache. Silently skips if Redis is down or ZIP is too large."""
    if len(zip_bytes) > ZIP_CACHE_MAX_BYTES:
        return
    r = get_redis()
    if not r:
        return
    try:
        r.setex(f"zip:{user_sheet_id}", ZIP_CACHE_TTL, zip_bytes)
    except Exception as e:
        logger.warning("Redis cache_zip failed: %s", e)


def get_cached_zip(user_sheet_id: str):
    """Return cached ZIP bytes or None."""
    r = get_redis()
    if not r:
        return None
    try:
        return r.get(f"zip:{user_sheet_id}")
    except Exception as e:
        logger.warning("Redis get_cached_zip failed: %s", e)
        return None


def invalidate_zip(user_sheet_id: str) -> None:
    """Remove a ZIP entry from cache (call on delete)."""
    r = get_redis()
    if not r:
        return
    try:
        r.delete(f"zip:{user_sheet_id}")
    except Exception as e:
        logger.warning("Redis invalidate_zip failed: %s", e)
