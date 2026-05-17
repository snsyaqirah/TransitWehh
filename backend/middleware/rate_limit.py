from slowapi import Limiter
from slowapi.util import get_remote_address

# Key function — rate limit by client IP
limiter = Limiter(key_func=get_remote_address)

# Tiers:
#   60/minute  — general data endpoints
#   30/minute  — anomaly, decompose, event-study (moderate compute)
#   10/minute  — forecast, backtest (Prophet — heavy compute)
#   EXEMPT     — /api/health (Railway pings every 10-30s — never throttle)
LIMIT_GENERAL = "60/minute"
LIMIT_MODERATE = "30/minute"
LIMIT_HEAVY = "10/minute"
