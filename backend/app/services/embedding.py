import os
import boto3
import json
from dotenv import load_dotenv
from sqlalchemy import select
from ..models.atractions import Embedding
import numpy as np
from ..__init__ import logger

load_dotenv()

AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_ACCESS_KEY = os.environ["AWS_ACCESS_KEY"]
region = "us-east-2"

bedrock = boto3.client(
    'bedrock-runtime',
    region_name=region,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors, normalized 0..1."""
    a_norm = a / np.linalg.norm(a)
    b_norm = b / np.linalg.norm(b)
    return float(np.dot(a_norm, b_norm))  # 1 = identical, 0 = orthogonal

async def get_similar(text: str, db, max_results: int = 20, threshold: float = 0.2):
        """
        Return attractions from the database similar to the given text.
        Threshold: 0..1, minimum similarity (0.2 means >= 80% similar).
        """
        vector = await get_embedding(text)  # should be a list or numpy array
        # Step 1: order by cosine distance in SQL for index use
        stmt = (
            select(Embedding)
            .order_by(Embedding.embedding.cosine_distance(vector))  # pgvector index
            .limit(max_results)
        )

        # Correct async usage: await scalars() then call .all()
        candidates = await db.scalars(stmt)
        
        results = []
        min_similarity = 1.0 - threshold  # convert distance threshold to similarity
        for r in candidates:
            sim = cosine_similarity(np.array(r.embedding), np.array(vector))
            if sim < min_similarity:
                break  # stop iterating, further items will be less similar
            results.append(r)
    
        logger.debug(f"Found this many results: {len(results)}")

        return results

async def get_embedding(text: str) -> list[float]:
    """Fetches a 256-dimensional embedding from Amazon Bedrock's Titan Text Embeddings V2 model."""

    payload = {
        "inputText": text,
        "dimensions": 256,  
        "embeddingTypes": ["float"]  
    }

    try:
        # Invoke the model
        response = bedrock.invoke_model(
            body=json.dumps(payload),
            contentType='application/json',
            accept='application/json',
            modelId='amazon.titan-embed-text-v2:0'
        )
        
        result = json.loads(response['body'].read())
        embedding = result.get('embedding', None)
        if embedding is None:
            raise ValueError("Embedding not found in the response.")

        return embedding

    except Exception as e:
        logger.critical(f"error getting embedding: {e}")
        raise
    
from chonkie import RecursiveChunker, RecursiveRules, RecursiveLevel

CHAR_CHUNK_SIZE = 1500
rules = RecursiveRules(
    levels=[
        RecursiveLevel(delimiters=["\n\n", "\n", "\r\n"]),
        RecursiveLevel(delimiters=[".?!;:"]),
        RecursiveLevel(),  # fallback
    ]
)
chunker = RecursiveChunker(
    tokenizer_or_token_counter="character",
    chunk_size=CHAR_CHUNK_SIZE,
    rules=rules,
    min_characters_per_chunk=24
)

def chunk_text(text: str):
    """
    Chunk text and return a list of dicts:
    {
        "text": chunk_text,
        "start": start_index,
        "end": end_index
    }
    """
    try:
        chunks = chunker(text)
        start_idx = 0
        chunk_info = []

        for chunk in chunks:
            end_idx = start_idx + len(chunk.text)
            chunk_info.append({
                "text": chunk.text,
                "start": start_idx,
                "end": end_idx
            })
            start_idx = end_idx 

        return chunk_info
    except Exception as e:
        logger.critical(f"Error in chunking text: {e}")

def reconstruct_text(chunks: list[str]) -> str:
    """
    Simply concatenates chunk texts.
    """
    return "".join(chunks)
