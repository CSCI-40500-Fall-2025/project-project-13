#!/usr/bin/env python3
"""
Script to collect NYC tourist attractions data using Google Maps API
"""
import os, sys, asyncio

# set policy immediately, before anything else
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

print(f"[run] set policy pid={os.getpid()} policy={asyncio.get_event_loop_policy().__class__.__name__}")

import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db import get_db, create_all_tables, create_extensions
from app.services import DataCollectionService

async def main():
    """Main function to collect NYC attractions data"""
    load_dotenv()
    
    # Check if required API keys are set
    if not os.getenv("GOOGLE_MAPS_API_KEY"):
        print("Error: GOOGLE_MAPS_API_KEY not found in environment variables")
        print("Please add GOOGLE_MAPS_API_KEY=your_api_key to your .env file")
        return
    
    if not os.getenv("AWS_ACCESS_KEY"):
        print("Error: AWS_ACCESS_KEY not found in environment variables")
        print("Please add AWS_ACCESS_KEY=your_access_key to your .env file")
        return
    
    if not os.getenv("AWS_SECRET_ACCESS_KEY"):
        print("Error: AWS_SECRET_ACCESS_KEY not found in environment variables")
        print("Please add AWS_SECRET_ACCESS_KEY=your_secret_key to your .env file")
        return
    
    # Check if database URL is set
    if not os.getenv("DB"):
        print("Error: DB not found in environment variables")
        print("Please add DB=your_database_url to your .env file")
        return
    
    print("Setting up database...")
    try:
        # Create tables and extensions
        await create_extensions()
        await create_all_tables()
        print("Database setup complete!")
    except Exception as e:
        print(f"Error setting up database: {e}")
        print("This might be due to missing vector extension. Continuing anyway...")
        # Try to continue without vector extension
        try:
            await create_all_tables()
            print("Database setup completed without vector extension")
        except Exception as e2:
            print(f"Fatal error setting up database: {e2}")
            return
    
    print("Starting data collection...")
    
    # Get database session
    async for db in get_db():
        try:
            data_service = DataCollectionService()
            
            # Collect NYC attractions
            print("Collecting NYC tourist attractions...")
            attractions = await data_service.collect_nyc_attractions(db)
            
            print(f"\n✅ Successfully collected {len(attractions)} attractions!")
            print("\nCollected attractions:")
            for attraction in attractions:
                print(f"- {attraction.location} (Rating: {attraction.rating})")
            
            # Also collect some specific NYC landmarks
            print("\nCollecting additional NYC landmarks...")
            additional_queries = [
                "museums in New York",
                "parks in New York", 
                "restaurants in New York",
                "shopping in New York"
            ]
            
            for query in additional_queries:
                print(f"Searching for: {query}")
                additional_attractions = await data_service.collect_attractions_by_query(db, query)
                print(f"Found {len(additional_attractions)} additional attractions")
            
            break  # Exit the async generator
            
        except Exception as e:
            print(f"Error during data collection: {e}")
            break

if __name__ == "__main__":
    asyncio.run(main())
