# Gunicorn configuration for ApnaGhar
import multiprocessing
import os

# Bind to PORT environment variable (Render uses this)
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# Worker configuration
workers = 2  # Keep low for free tier
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# CRITICAL: Timeout settings for RAG initialization
# PyTorch + sentence-transformers loading takes 30-60 seconds
timeout = 120  # 2 minutes for worker timeout
graceful_timeout = 120  # 2 minutes for graceful shutdown
keepalive = 5

# Logging
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Don't preload app - let each worker load independently
preload_app = False
