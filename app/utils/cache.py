# app/utils/cache.py
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import json
from flask import request

# Simple in-memory cache
_cache = {}


def cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate cache key"""
    key_parts = [prefix]
    key_parts.extend(str(arg) for arg in args)
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cache(ttl_seconds: int = 300):
    """Cache decorator for functions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_key(func.__name__, *args, **kwargs)
            
            # Check cache
            if key in _cache:
                cached_data, cached_time = _cache[key]
                if datetime.utcnow() - cached_time < timedelta(seconds=ttl_seconds):
                    return cached_data
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            _cache[key] = (result, datetime.utcnow())
            
            return result
        return wrapper
    return decorator


def clear_cache(prefix: str = None):
    """Clear cache"""
    if prefix:
        keys_to_delete = [k for k in _cache.keys() if k.startswith(prefix)]
        for k in keys_to_delete:
            del _cache[k]
    else:
        _cache.clear()


def cache_clear_all():
    """Clear all cache"""
    _cache.clear()


# Cache for API responses
def cached_api(ttl_seconds: int = 60):
    """Cache API responses"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check if cache is enabled for this request
            cache_control = request.headers.get('Cache-Control', '')
            if 'no-cache' in cache_control:
                return func(*args, **kwargs)
            
            # Generate cache key from request
            key = cache_key(
                func.__name__,
                request.path,
                request.args.to_dict(),
                request.user.id if hasattr(request, 'user') else None
            )
            
            # Check cache
            if key in _cache:
                cached_data, cached_time = _cache[key]
                if datetime.utcnow() - cached_time < timedelta(seconds=ttl_seconds):
                    return cached_data
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            _cache[key] = (result, datetime.utcnow())
            
            return result
        return wrapper
    return decorator