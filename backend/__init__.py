import logging
import os
from logtail import LogtailHandler

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()

logging.basicConfig(
    level=logging._nameToLevel.get(LOG_LEVEL, logging.DEBUG),
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
logger.setLevel(logging._nameToLevel.get(LOG_LEVEL, logging.DEBUG))

BETTERSTACK_TOKEN = os.getenv("BETTERSTACK_TOKEN", "")
if BETTERSTACK_TOKEN:
    handler = LogtailHandler(
        source_token=BETTERSTACK_TOKEN,
        host='https://s1596350.eu-nbg-2.betterstackdata.com',
    )

    handler.setLevel(logging._nameToLevel.get(LOG_LEVEL, logging.DEBUG))

    logger.addHandler(handler)
