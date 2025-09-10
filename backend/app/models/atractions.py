from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, ARRAY, Table, Text, Float
from sqlalchemy.orm import relationship
import datetime
from typing import Optional
from .__init__ import Base

# Try to import Vector from pgvector, fallback to JSON if not available
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
except ImportError:
    VECTOR_AVAILABLE = False
    print("Warning: pgvector not available, using JSON for embeddings")

# Number of dimensions for embeddings
N_DIM = 256

class Attraction(Base):
    __tablename__ = "attraction"
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic information
    location = Column(String, nullable = False)
    description = Column(Text, nullable = False)
    address = Column(String, nullable = True)
    latitude = Column(Float, nullable = True)
    longitude = Column(Float, nullable = True)
    
    # Google Places data
    place_id = Column(String, nullable = True, unique = True)  # Google Place ID for uniqueness
    types = Column(ARRAY(String), nullable = True)  # All Google Places types
    primary_type = Column(String, nullable = True)  # Main type (first in types array)
    
    # Ratings and reviews
    rating = Column(Float, nullable = True)
    user_ratings_total = Column(Integer, nullable = True)
    price_level = Column(Integer, nullable = True)  # 0-4 price level
    
    # Contact information
    website = Column(String, nullable = True)
    phone = Column(String, nullable = True)
    international_phone = Column(String, nullable = True)
    
    # Business hours
    opening_hours = Column(JSON, nullable = True)  # Store opening hours as JSON
    business_status = Column(String, nullable = True)  # OPERATIONAL, CLOSED_TEMPORARILY, etc.
    
    # Location details
    vicinity = Column(String, nullable = True)  # Neighborhood/area
    plus_code = Column(JSON, nullable = True)  # Google Plus Code (can be an object)
    formatted_address = Column(String, nullable = True)  # Full formatted address
    
    # Media
    photos = Column(ARRAY(JSON), nullable = True)  # All photos with metadata
    videos = Column(ARRAY(JSON), nullable = True)
    
    # Additional Google Places data
    utc_offset = Column(Integer, nullable = True)  # UTC offset in minutes
    
    # Timestamps
    created = Column(String, nullable = True)
    last_updated = Column(String, nullable = True)
    
    # Legacy fields for backward compatibility
    type = Column(String, nullable = True)  # Keep for backward compatibility
    tags = Column(ARRAY(String), nullable = True)  # Keep for backward compatibility
    images = Column(ARRAY(JSON), nullable = True)  # Keep for backward compatibility
    
    # Unique constraint on place_id to prevent duplicates
    __table_args__ = (
        {'extend_existing': True}
    )

    # One-to-many relationship with Embedding
    embeddings = relationship(
        "Embedding",
        back_populates="attraction",
        cascade="all, delete-orphan",
        lazy="select"
    )

    def __json__(self):
        return {
            "id": self.id,
            "location": self.location,
            "description": self.description,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "place_id": self.place_id,
            "types": self.types,
            "primary_type": self.primary_type,
            "rating": self.rating,
            "user_ratings_total": self.user_ratings_total,
            "price_level": self.price_level,
            "website": self.website,
            "phone": self.phone,
            "international_phone": self.international_phone,
            "opening_hours": self.opening_hours,
            "business_status": self.business_status,
            "vicinity": self.vicinity,
            "plus_code": self.plus_code,
            "formatted_address": self.formatted_address,
            "photos": self.photos,
            "videos": self.videos,
            "utc_offset": self.utc_offset,
            "created": self.created,
            "last_updated": self.last_updated,
            # Legacy fields for backward compatibility
            "type": self.type,
            "tags": self.tags,
            "images": self.images,
        }

class Embedding(Base):
    __tablename__ = "embedding"

    id = Column(Integer, primary_key=True, autoincrement=True)
   
    order = Column(Integer, nullable=False) #-1 if a tag, represents the order of the embedded text to reconstruct the description content.

    # start and end index of the embedded text
    start_ind = Column(Integer, nullable=False)
    end_ind = Column(Integer, nullable=False)
    
    embedding = Column(Vector(N_DIM), nullable=False) if VECTOR_AVAILABLE else Column(JSON, nullable=False)

    attraction_id = Column(Integer, ForeignKey("attraction.id", ondelete="CASCADE"), nullable=False)

    attraction = relationship(
        "Attraction",
        back_populates="embeddings",
        lazy="selectin"
    )

