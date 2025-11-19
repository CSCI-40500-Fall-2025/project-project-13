from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db, create_all_tables, create_extensions
from .services import DataCollectionService
from .models.atractions import Attraction
import psycopg  
from .routes.auth import endpoints
from .routes.auth.auth_middleware import TokenRefreshMiddleware
from .__init__ import logger

app = FastAPI()
app.include_router(endpoints.router)

app.add_middleware(TokenRefreshMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Run extension + table creation at startup. Be defensive about
    # psycopg prepared-statement / duplicate-index errors which can happen
    # under --reload or when multiple processes race.
    try:
        logger.info("Creating/Checking tables in DB")
        await create_extensions()
        await create_all_tables()
        logger.info("Finished setting up tables in DB")
    except Exception as e:
        # unwrap __cause__ if SQLAlchemy wrapped the driver error
        cause = getattr(e, "__cause__", None)
        # ignore duplicate prepared statement (psycopg) during reload races
        if isinstance(e, psycopg.errors.DuplicatePreparedStatement) or isinstance(cause, psycopg.errors.DuplicatePreparedStatement):
            print("Ignored DuplicatePreparedStatement during startup (likely due to --reload).")
        else:
            # Log and re-raise for unexpected errors (so failures are visible)
            print("Startup error (will re-raise):", e)
            logger.error(f"Error occured Creating/Checkign tables in DB: {e}")
            raise e

# Initialize data collection service
data_service = DataCollectionService()

@app.get("/")
async def root():
    logger.debug("called /")
    return {"message": "NYC Tourist Attractions API"}

@app.get("/attractions")
async def get_attractions(db: AsyncSession = Depends(get_db)):
    """Get all attractions from the database"""
    logger.debug("/attractions called")
    try:
            
        attractions = await data_service.get_all_attractions(db)
        return [attraction.__json__() for attraction in attractions]
    except Exception as e:
        logger.error(f"Error occured in /attractions: {e}")
        return HTTPException(status_code=401, detail=e)

@app.get("/attractions/search")
async def search_attractions(query: str, db: AsyncSession = Depends(get_db)):
    """Search attractions by query"""
    logger.debug("/attractions/search called")

    try:
        query.strip(" ")
        if not query:
            return HTTPException(status_code=401, detail="empty input")
        attractions = await data_service.search_attractions(db, query)
        return attractions
    except Exception as e:
        logger.error(f"Error occured in /attractions/search: {e}")
        return HTTPException(status_code=401, detail=e)


@app.get("/near_by")
async def near_by(location: str, distance: int, db: AsyncSession = Depends(get_db)):
    """Find attractions near a location (legacy endpoint)"""
    logger.debug("/near_by called")
    attractions = await data_service.search_attractions(db, location)
    return [attraction.__json__() for attraction in attractions]
