from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict
from ..models.atractions import Attraction, Embedding
from .google_maps_service import GoogleMapsService
from .embedding_service import EmbeddingService
import asyncio
from datetime import datetime

class DataCollectionService:
    def __init__(self):
        self.google_maps_service = GoogleMapsService()
        self.embedding_service = EmbeddingService()
    
    async def collect_nyc_attractions(self, db: AsyncSession) -> List[Attraction]:
        """Collect NYC tourist attractions and save them to the database"""
        print("Starting NYC attractions collection...")
        
        # Get attractions from Google Maps
        places = await self.google_maps_service.search_nyc_tourist_spots()
        
        created_attractions = []
        
        for place in places:
            try:
                # Skip if no place_id (can't ensure uniqueness)
                if not place.get('place_id'):
                    print(f"Skipping {place['name']} - no place_id")
                    continue
                
                # Check if attraction already exists by place_id
                existing_attraction = await db.execute(
                    select(Attraction).where(Attraction.place_id == place['place_id'])
                )
                existing = existing_attraction.scalar_one_or_none()
                
                if existing:
                    print(f"Attraction with place_id {place['place_id']} already exists, skipping...")
                    continue
                
                # Create comprehensive attraction record
                attraction = Attraction(
                    # Basic information
                    location=place['name'],
                    description=place.get('formatted_address', ''),
                    address=place.get('address', ''),
                    latitude=place.get('latitude'),
                    longitude=place.get('longitude'),
                    
                    # Google Places data
                    place_id=place.get('place_id'),
                    types=place.get('types', []),
                    primary_type=place.get('primary_type', ''),
                    
                    # Ratings and reviews
                    rating=place.get('rating', 0.0),
                    user_ratings_total=place.get('user_ratings_total', 0),
                    price_level=place.get('price_level'),
                    
                    # Contact information
                    website=place.get('website', ''),
                    phone=place.get('phone', ''),
                    international_phone=place.get('international_phone', ''),
                    
                    # Business hours
                    opening_hours=place.get('opening_hours', {}),
                    business_status=place.get('business_status', ''),
                    
                    # Location details
                    vicinity=place.get('vicinity', ''),
                    plus_code=place.get('plus_code', ''),
                    formatted_address=place.get('formatted_address', ''),
                    
                    # Media
                    photos=place.get('photos', []),
                    videos=place.get('videos', []),
                    
                    # Additional Google Places data
                    utc_offset=place.get('utc_offset'),
                    
                    # Timestamps
                    created=datetime.now().isoformat(),
                    last_updated=datetime.now().isoformat(),
                    
                    # Legacy fields for backward compatibility
                    type=place.get('primary_type', ''),
                    tags=place.get('types', []),
                    images=place.get('photos', [])
                )
                
                db.add(attraction)
                await db.commit()
                await db.refresh(attraction)
                
                # Create embeddings for the attraction
                await self._create_embeddings_for_attraction(db, attraction, place)
                
                created_attractions.append(attraction)
                print(f"Created attraction: {attraction.location} (place_id: {attraction.place_id})")
                
            except Exception as e:
                print(f"Error creating attraction {place.get('name', 'Unknown')}: {e}")
                await db.rollback()
                continue
        
        print(f"Successfully created {len(created_attractions)} attractions")
        return created_attractions
    
    async def collect_attractions_by_query(self, db: AsyncSession, query: str, location: str = "New York, NY") -> List[Attraction]:
        """Collect attractions based on a search query"""
        print(f"Searching for attractions with query: '{query}' in {location}")
        
        places = await self.google_maps_service.search_by_query(query, location)
        
        created_attractions = []
        
        for place in places:
            try:
                # Skip if no place_id (can't ensure uniqueness)
                if not place.get('place_id'):
                    print(f"Skipping {place['name']} - no place_id")
                    continue
                
                # Check if attraction already exists by place_id
                existing_attraction = await db.execute(
                    select(Attraction).where(Attraction.place_id == place['place_id'])
                )
                existing = existing_attraction.scalar_one_or_none()
                
                if existing:
                    print(f"Attraction with place_id {place['place_id']} already exists, skipping...")
                    continue
                
                # Create comprehensive attraction record (same as collect_nyc_attractions)
                attraction = Attraction(
                    # Basic information
                    location=place['name'],
                    description=place.get('formatted_address', ''),
                    address=place.get('address', ''),
                    latitude=place.get('latitude'),
                    longitude=place.get('longitude'),
                    
                    # Google Places data
                    place_id=place.get('place_id'),
                    types=place.get('types', []),
                    primary_type=place.get('primary_type', ''),
                    
                    # Ratings and reviews
                    rating=place.get('rating', 0.0),
                    user_ratings_total=place.get('user_ratings_total', 0),
                    price_level=place.get('price_level'),
                    
                    # Contact information
                    website=place.get('website', ''),
                    phone=place.get('phone', ''),
                    international_phone=place.get('international_phone', ''),
                    
                    # Business hours
                    opening_hours=place.get('opening_hours', {}),
                    business_status=place.get('business_status', ''),
                    
                    # Location details
                    vicinity=place.get('vicinity', ''),
                    plus_code=place.get('plus_code', ''),
                    formatted_address=place.get('formatted_address', ''),
                    
                    # Media
                    photos=place.get('photos', []),
                    videos=place.get('videos', []),
                    
                    # Additional Google Places data
                    utc_offset=place.get('utc_offset'),
                    
                    # Timestamps
                    created=datetime.now().isoformat(),
                    last_updated=datetime.now().isoformat(),
                    
                    # Legacy fields for backward compatibility
                    type=place.get('primary_type', ''),
                    tags=place.get('types', []),
                    images=place.get('photos', [])
                )
                
                db.add(attraction)
                await db.commit()
                await db.refresh(attraction)
                
                # Create embeddings for the attraction
                await self._create_embeddings_for_attraction(db, attraction, place)
                
                created_attractions.append(attraction)
                print(f"Created attraction: {attraction.location} (place_id: {attraction.place_id})")
                
            except Exception as e:
                print(f"Error creating attraction {place.get('name', 'Unknown')}: {e}")
                await db.rollback()
                continue
        
        print(f"Successfully created {len(created_attractions)} attractions")
        return created_attractions
    
    async def _create_embeddings_for_attraction(self, db: AsyncSession, attraction: Attraction, place_data: dict = None):
        """Create embeddings for an attraction's description, tags, and reviews"""
        try:
            embedding_count = 0
            
            # Create embeddings for description/address
            if attraction.description:
                description_embeddings = await self.embedding_service.create_embeddings_for_description(attraction.description)
                
                for text, embedding, start_idx, end_idx in description_embeddings:
                    embedding_record = Embedding(
                        order=1,  # 1 for description chunks
                        start_ind=start_idx,
                        end_ind=end_idx,
                        embedding=embedding,
                        attraction_id=attraction.id
                    )
                    db.add(embedding_record)
                    embedding_count += 1
            
            # Create embeddings for types/tags
            if attraction.types:
                tag_embeddings = await self.embedding_service.create_embeddings_for_tags(attraction.types)
                
                for text, embedding, start_idx, end_idx in tag_embeddings:
                    embedding_record = Embedding(
                        order=-1,  # -1 indicates it's a tag
                        start_ind=start_idx,
                        end_ind=end_idx,
                        embedding=embedding,
                        attraction_id=attraction.id
                    )
                    db.add(embedding_record)
                    embedding_count += 1
            
             # Create embeddings for reviews if available (limit to top 15 by rating then recency)
            if place_data and place_data.get('reviews'):
                reviews = place_data['reviews']
                # Sort by rating desc then time desc if present
                reviews_sorted = sorted(
                    reviews,
                    key=lambda r: (r.get('rating', 0), r.get('time', 0)),
                    reverse=True,
                )
                reviews_top = reviews_sorted[:15]
                review_embeddings = await self.embedding_service.create_embeddings_for_reviews(reviews_top)
                
                for text, embedding, start_idx, end_idx in review_embeddings:
                    embedding_record = Embedding(
                        order=2,  # 2 for reviews
                        start_ind=start_idx,
                        end_ind=end_idx,
                        embedding=embedding,
                        attraction_id=attraction.id
                    )
                    db.add(embedding_record)
                    embedding_count += 1
            
            # Create embedding for editorial summary if available
            if place_data and place_data.get('editorial_summary', {}).get('overview'):
                summary_text = place_data['editorial_summary']['overview']
                summary_embedding = await self.embedding_service.create_embedding(summary_text)
                embedding_record = Embedding(
                    order=3,  # 3 for editorial summary
                    start_ind=0,
                    end_ind=len(summary_text),
                    embedding=summary_embedding,
                    attraction_id=attraction.id
                )
                db.add(embedding_record)
                embedding_count += 1
            
            await db.commit()
            print(f"Created {embedding_count} embeddings for {attraction.location}")
            
        except Exception as e:
            print(f"Error creating embeddings for {attraction.location}: {e}")
            await db.rollback()

    async def dedupe_attractions(self, db: AsyncSession) -> int:
        """Delete duplicate attractions keeping the most recently updated.
        - Primary key for uniqueness: place_id (when not null)
        - Fallback: formatted_address (when place_id is null)
        Returns number of deleted rows.
        """
        deleted = 0
        # Delete duplicates by place_id (keep max(last_updated), then max(id) as tiebreaker)
        try:
            # Build a CTE to find ids to delete for duplicated place_id
            result = await db.execute(
                """
                WITH ranked AS (
                  SELECT id, place_id,
                         ROW_NUMBER() OVER (
                           PARTITION BY place_id
                           ORDER BY COALESCE(last_updated, created) DESC, id DESC
                         ) AS rn
                  FROM attraction
                  WHERE place_id IS NOT NULL
                )
                DELETE FROM attraction a
                USING ranked r
                WHERE a.id = r.id AND r.rn > 1
                RETURNING a.id
                """
            )
            deleted += len(result.fetchall())
        except Exception as e:
            print("dedupe (place_id) warning:", e)

        # Delete duplicates by formatted_address when place_id is NULL
        try:
            result2 = await db.execute(
                """
                WITH ranked AS (
                  SELECT id, formatted_address,
                         ROW_NUMBER() OVER (
                           PARTITION BY formatted_address
                           ORDER BY COALESCE(last_updated, created) DESC, id DESC
                         ) AS rn
                  FROM attraction
                  WHERE place_id IS NULL AND formatted_address IS NOT NULL
                )
                DELETE FROM attraction a
                USING ranked r
                WHERE a.id = r.id AND r.rn > 1
                RETURNING a.id
                """
            )
            deleted += len(result2.fetchall())
        except Exception as e:
            print("dedupe (formatted_address) warning:", e)

        # Optionally, clear duplicate embeddings rows per attraction/order/start_end
        try:
            await db.execute(
                """
                DELETE FROM embedding e
                USING (
                  SELECT id,
                         ROW_NUMBER() OVER (
                           PARTITION BY attraction_id, "order", start_ind, end_ind
                           ORDER BY id DESC
                         ) rn
                  FROM embedding
                ) d
                WHERE e.id = d.id AND d.rn > 1
                """
            )
        except Exception as e:
            print("dedupe (embeddings) warning:", e)

        await db.commit()
        return deleted
    
    async def get_all_attractions(self, db: AsyncSession) -> List[Attraction]:
        """Get all attractions from the database"""
        result = await db.execute(select(Attraction))
        return result.scalars().all()
    
    async def search_attractions(self, db: AsyncSession, query: str) -> List[Attraction]:
        """Search attractions in the database by location or description"""
        result = await db.execute(
            select(Attraction).where(
                Attraction.location.ilike(f"%{query}%") |
                Attraction.description.ilike(f"%{query}%")
            )
        )
        return result.scalars().all()
