from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from backend.api.services.redis_client import RedisClient
import time

RATE_LIMIT = 100  # requests per minute
WINDOW = 60  # seconds

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{client_ip}"
        
        # Get current count
        redis = await RedisClient.get_client()
        current = await redis.get(key)
        
        if current is None:
            await redis.setex(key, WINDOW, 1)
        else:
            count = int(current)
            if count >= RATE_LIMIT:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
            await redis.incr(key)
        
        return await call_next(request)