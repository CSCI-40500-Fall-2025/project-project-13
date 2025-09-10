import asyncio
from typing import List, Tuple
from .embedding import get_embedding, chunk_text

class EmbeddingService:
    def __init__(self):
        self.dimensions = 256  # Match N_DIM in your model
    
    async def create_embedding(self, text: str) -> list[float]:
        """Create an embedding for a single text using AWS Bedrock"""
        try:
            embedding = await get_embedding(text)
            return embedding
        except Exception as e:
            print(f"Error creating embedding: {e}")
            return [0.0] * self.dimensions  # Return zero vector on error
    
    async def create_embeddings_for_description(self, description: str) -> list[tuple[str, list[float], int, int]]:
        """Create embeddings for a description using your chunking strategy"""
        try:
            # Use your chunking function
            chunks = chunk_text(description)
            embeddings: list[tuple[str, list[float], int, int]] = []
            
            for chunk in chunks:
                embedding = await self.create_embedding(chunk["text"])
                embeddings.append((
                    chunk["text"], 
                    embedding, 
                    chunk["start"], 
                    chunk["end"]
                ))
            
            return embeddings
        except Exception as e:
            print(f"Error creating description embeddings: {e}")
            return []
    
    async def create_embeddings_for_tags(self, tags: list[str]) -> list[tuple[str, list[float], int, int]]:
        """Create embeddings for tags"""
        embeddings: list[tuple[str, list[float], int, int]] = []
        for tag in tags:
            if tag and tag.strip():
                try:
                    embedding = await self.create_embedding(tag.strip())
                    embeddings.append((tag.strip(), embedding, -1, -1))  # -1 indicates it's a tag
                except Exception as e:
                    print(f"Error creating embedding for tag '{tag}': {e}")
                    continue
        return embeddings
    
    async def create_embeddings_for_reviews(self, reviews: list[dict]) -> list[tuple[str, list[float], int, int]]:
        """Create embeddings for reviews"""
        embeddings: list[tuple[str, list[float], int, int]] = []
        for i, review in enumerate(reviews):
            if review.get('text', '').strip():
                try:
                    # Combine review text with rating for better context
                    review_text = f"Rating {review.get('rating', 0)}: {review.get('text', '')}"
                    embedding = await self.create_embedding(review_text)
                    embeddings.append((review_text, embedding, i, i))  # Use review index
                except Exception as e:
                    print(f"Error creating embedding for review {i}: {e}")
                    continue
        return embeddings
