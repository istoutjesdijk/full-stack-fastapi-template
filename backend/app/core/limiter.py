from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Shared rate limiter. Keyed on the client IP (correct behind the proxy thanks to
# FORWARDED_ALLOW_IPS). Disabled in tests via RATE_LIMIT_ENABLED. Note: storage is
# in-memory and per-process, so with multiple workers the effective limit is
# per-worker; use a shared backend (e.g. Redis) if you need a global limit.
limiter = Limiter(key_func=get_remote_address, enabled=settings.RATE_LIMIT_ENABLED)
