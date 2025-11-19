import os, sys, asyncio

# set policy immediately, before anything else
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

print(f"[run] set policy pid={os.getpid()} policy={asyncio.get_event_loop_policy().__class__.__name__}")

import uvicorn
from app import logger

try:
    logger.info("Starting API")
    if __name__ == "__main__":
        uvicorn.run("app.app:app", host="127.0.0.1", port=8000)
except Exception as e:
    logger.critical(f"API could not be started: {e}")

