import googlemaps
import asyncio
import aiohttp
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class GoogleMapsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY not found in environment variables")
        
        self.gmaps = googlemaps.Client(key=self.api_key)
    
    async def search_places_nearby(self, location: str, radius: int = 5000, place_type: str = "tourist_attraction") -> List[Dict]:
        """Search for places near a location using Google Places API"""
        try:
            # Geocode the location to get coordinates
            geocode_result = self.gmaps.geocode(location)
            if not geocode_result:
                return []
            
            lat = geocode_result[0]['geometry']['location']['lat']
            lng = geocode_result[0]['geometry']['location']['lng']
            
            # Search for places nearby
            places_result = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=radius,
                type=place_type
            )
            
            places = []
            for place in places_result.get('results', []):
                place_details = await self.get_place_details(place['place_id'])
                if place_details:
                    places.append(place_details)
            
            return places
            
        except Exception as e:
            print(f"Error searching places: {e}")
            return []
    
    async def get_place_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed information about a specific place"""
        try:
            # Request all available fields from Google Places API
            details = self.gmaps.place(
                place_id=place_id,
                fields=[
                    'name', 'formatted_address', 'rating', 'user_ratings_total', 
                    'photo', 'type', 'website', 'formatted_phone_number', 'international_phone_number',
                    'opening_hours', 'geometry', 'vicinity', 'place_id', 'price_level',
                    'business_status', 'plus_code', 'utc_offset',
                    'reviews', 'editorial_summary'
                ]
            )
            
            place = details.get('result', {})
            
            # Extract coordinates
            geometry = place.get('geometry', {})
            location = geometry.get('location', {})
            latitude = location.get('lat')
            longitude = location.get('lng')
            
            # Extract all photos (up to 20 for comprehensive coverage)
            photos = []
            # The Places Details response uses 'photos' in the payload even though the field selector is 'photo'
            raw_photos = place.get('photos') or place.get('photo') or []
            for photo in raw_photos[:20]:
                ref = photo.get('photo_reference') or photo.get('photoReference')
                if not ref:
                    continue
                photo_url = (
                    f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={ref}&key={self.api_key}"
                )
                photos.append({
                    "url": photo_url,
                    "width": photo.get('width', 800),
                    "height": photo.get('height', 800),
                    "photo_reference": ref,
                    "html_attributions": photo.get('html_attributions', [])
                })
            
            # Extract opening hours
            opening_hours = place.get('opening_hours', {})
            opening_hours_data = {
                "open_now": opening_hours.get('open_now', False),
                "periods": opening_hours.get('periods', []),
                "weekday_text": opening_hours.get('weekday_text', [])
            }
            
            # Extract reviews (up to 5 most recent)
            reviews = []
            if 'reviews' in place:
                for review in place['reviews'][:5]:
                    reviews.append({
                        "author_name": review.get('author_name', ''),
                        "author_url": review.get('author_url', ''),
                        "language": review.get('language', ''),
                        "profile_photo_url": review.get('profile_photo_url', ''),
                        "rating": review.get('rating', 0),
                        "relative_time_description": review.get('relative_time_description', ''),
                        "text": review.get('text', ''),
                        "time": review.get('time', 0)
                    })
            
            return {
                "name": place.get('name', ''),
                "formatted_address": place.get('formatted_address', ''),
                "address": place.get('formatted_address', ''),  # For backward compatibility
                "latitude": latitude,
                "longitude": longitude,
                "place_id": place_id,
                # Some responses use 'types' (array). Field selector uses 'type' (primary type). Capture both.
                "types": place.get('types') or ([] if not place.get('type') else [place.get('type')]),
                "primary_type": (place.get('type') if place.get('type') else (place.get('types', [''])[0] if place.get('types') else '')),
                "rating": place.get('rating', 0.0),
                "user_ratings_total": place.get('user_ratings_total', 0),
                "price_level": place.get('price_level'),
                "website": place.get('website', ''),
                "phone": place.get('formatted_phone_number', ''),
                "international_phone": place.get('international_phone_number', ''),
                "opening_hours": opening_hours_data,
                "business_status": place.get('business_status', ''),
                "vicinity": place.get('vicinity', ''),
                "plus_code": place.get('plus_code', ''),
                "utc_offset": place.get('utc_offset'),
                "photos": photos,
                "reviews": reviews,
                "editorial_summary": place.get('editorial_summary', {}),
                "videos": []  # Google Places API doesn't provide videos
            }
            
        except Exception as e:
            print(f"Error getting place details for {place_id}: {e}")
            return None
    
    async def search_nyc_tourist_spots(self) -> List[Dict]:
        """Search for popular tourist spots in NYC"""
        nyc_locations = [
            "Times Square, New York, NY",
            "Central Park, New York, NY", 
            "Brooklyn Bridge, New York, NY",
            "Statue of Liberty, New York, NY",
            "Empire State Building, New York, NY",
            "High Line, New York, NY",
            "9/11 Memorial, New York, NY",
            "Metropolitan Museum of Art, New York, NY",
            "Broadway, New York, NY",
            "Wall Street, New York, NY"
        ]
        
        all_places = []
        for location in nyc_locations:
            places = await self.search_places_nearby(location, radius=2000, place_type="tourist_attraction")
            all_places.extend(places)
        
        # Remove duplicates based on place_id
        unique_places = {}
        for place in all_places:
            if place['place_id'] not in unique_places:
                unique_places[place['place_id']] = place
        
        return list(unique_places.values())
    
    async def search_by_query(self, query: str, location: str = "New York, NY") -> List[Dict]:
        """Search for places using a text query"""
        try:
            places_result = self.gmaps.places(
                query=query,
                location=location,
                radius=50000  # 50km radius
            )
            
            places = []
            for place in places_result.get('results', []):
                place_details = await self.get_place_details(place['place_id'])
                if place_details:
                    places.append(place_details)
            
            return places
            
        except Exception as e:
            print(f"Error searching by query: {e}")
            return []
