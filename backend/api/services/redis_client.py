import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    _client = None
    _enabled = False  # Set to False to disable Redis

    @classmethod
    async def initialize(cls):
        # Skip Redis initialization
        cls._enabled = False
        logger.warning("Redis is disabled. Using fallback in-memory cache.")
        return None

    @classmethod
    async def get_client(cls):
        return None

    @classmethod
    async def close(cls):
        pass

    @classmethod
    async def set_json(cls, key: str, value: Any, ex: int = None):
        if not cls._enabled:
            return False
        # ... real implementation if needed

    @classmethod
    async def get_json(cls, key: str) -> Optional[Any]:
        if not cls._enabled:
            return None
        return None

    @classmethod
    async def setex(cls, key: str, seconds: int, value: str):
        if not cls._enabled:
            return False
        return False

    @classmethod
    async def get(cls, key: str) -> Optional[str]:
        if not cls._enabled:
            return None
        return None

    @classmethod
    async def incr(cls, key: str):
        if not cls._enabled:
            return 1
        return 1

    @classmethod
    async def delete(cls, key: str):
        if not cls._enabled:
            return True
        return True