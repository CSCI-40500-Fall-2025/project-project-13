"""
Multi-Agent Trip Planner - Agent Definitions

Agent 1 (Query Generator Agent): Uses LLM to generate optimized search queries
Agent 2 (Search Agent): Uses embeddings to find attractions via KNN search
Agent 3 (Planner Agent): Uses Google Gemini to generate personalized trip itineraries
"""
import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, AsyncGenerator, Tuple
from dotenv import load_dotenv
from sqlalchemy import select
import google.generativeai as genai

from .embedding import get_similar
from ..db import AsyncSessionLocal
from ..models.atractions import Attraction

load_dotenv()

# Configure Google Generative AI with API key (prefer GOOGLE_API_KEY for Gemini)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Create the Gemini model
model = genai.GenerativeModel('gemini-2.0-flash')


##############################################
## Query Generator Agent - Creates optimized KNN search queries
##############################################

QUERY_GENERATOR_PROMPT = """You are a search query optimizer for a NYC attractions database.

Your task is to take a user's natural language request and generate exactly 2 search phrases that will work well for KNN (K-Nearest Neighbors) embedding similarity search.

IMPORTANT: The database contains NYC attractions with descriptions like:
- "Central Park is a sprawling urban oasis in Manhattan"
- "The Metropolitan Museum of Art houses over 5,000 years of art"
- "Times Square is a major commercial intersection and tourist destination"

Your search phrases will be converted to embeddings and compared against these descriptions using cosine similarity.

OUTPUT FORMAT (you MUST follow this exactly):
QUERY1: [first search phrase]
QUERY2: [second search phrase]

RULES:
1. Keep each phrase short (3-8 words)
2. Use descriptive nouns and adjectives that would appear in attraction descriptions
3. The two queries should cover different aspects of what the user wants
4. Do NOT include any other text, explanations, or formatting

EXAMPLE:
User: "I want to see art and also walk in nature for a few hours"
QUERY1: art museum gallery exhibitions
QUERY2: park nature walking trails outdoor

User: "family fun activities with kids"
QUERY1: family friendly children entertainment
QUERY2: kids activities interactive fun

Now generate queries for the following user request:
"""


def parse_generated_queries(response_text: str) -> Tuple[str, str]:
    """
    Parse the LLM response to extract exactly 2 queries.
    Returns tuple of (query1, query2) or falls back to defaults.
    """
    lines = response_text.strip().split('\n')
    query1 = None
    query2 = None
    
    for line in lines:
        line = line.strip()
        if line.upper().startswith('QUERY1:'):
            query1 = line[7:].strip()
        elif line.upper().startswith('QUERY2:'):
            query2 = line[7:].strip()
    
    return (query1 or "", query2 or "")


async def generate_search_queries(user_query: str) -> List[str]:
    """
    Use LLM to generate 2 optimized search queries for KNN embedding search.
    Returns a list of search phrases.
    """
    print(f"[Query Generator] Optimizing query: {user_query}")
    
    try:
        prompt = QUERY_GENERATOR_PROMPT + f'"{user_query}"'
        response = model.generate_content(prompt)
        
        if response.text:
            query1, query2 = parse_generated_queries(response.text)
            
            # Validate we got actual queries
            queries = []
            if query1:
                queries.append(query1)
                print(f"[Query Generator] Generated QUERY1: {query1}")
            if query2:
                queries.append(query2)
                print(f"[Query Generator] Generated QUERY2: {query2}")
            
            # Fall back to original if parsing failed
            if not queries:
                print(f"[Query Generator] Parsing failed, using original query")
                queries = [user_query]
            
            return queries
    except Exception as e:
        print(f"[Query Generator] Error: {e}, using original query")
        return [user_query]
    
    return [user_query]


##############################################
## Search Agent - Finds attractions via embeddings with multiple queries
##############################################

async def search_attractions(user_query: str, max_results: int = 10) -> str:
    """
    Search for NYC attractions using semantic similarity search.
    Uses Query Generator Agent to create optimized search phrases.
    Returns formatted information about matching attractions.
    """
    # Step 1: Generate optimized search queries
    search_queries = await generate_search_queries(user_query)
    
    print(f"[Search Agent] Executing {len(search_queries)} KNN queries...")
    
    all_attraction_ids = set()
    
    async with AsyncSessionLocal() as db:
        # Step 2: Run KNN search for each generated query
        for sq in search_queries:
            print(f"[Search Agent] KNN search for: '{sq}'")
            embeddings = await get_similar(sq, db, max_results=max_results // 2 + 2, threshold=0.50)
            
            for emb in embeddings:
                if emb.attraction_id:
                    all_attraction_ids.add(emb.attraction_id)
        
        if not all_attraction_ids:
            return "No attractions found matching the query."
        
        # Step 3: Fetch full attraction details
        result = await db.execute(
            select(Attraction).where(Attraction.id.in_(list(all_attraction_ids)))
        )
        attractions = result.scalars().all()
        
        # Format results for the planner agent
        formatted_results = []
        for a in attractions[:10]:  # Limit to top 10 for context size
            info = f"""
**{a.location}**
- Description: {a.description or 'N/A'}
- Address: {a.formatted_address or a.address or 'N/A'}
- Rating: {a.rating}/5 ({a.user_ratings_total} reviews)
- Type: {', '.join(a.types[:3]) if a.types else 'General attraction'}
"""
            formatted_results.append(info)
        
        return f"Found {len(attractions)} attractions:\n" + "\n---\n".join(formatted_results)


##############################################
## Planner Agent - Creates personalized itineraries with Gemini
##############################################

PLANNER_SYSTEM_PROMPT = """You are an expert NYC trip planner. Based on the user's request and the available attractions data, create a personalized itinerary.

Your responses should:
1. Recommend specific attractions that match what the user wants
2. Explain WHY each place is a good fit for their request  
3. If they mention time constraints, suggest a realistic schedule
4. Consider geographical proximity when ordering recommendations
5. Include practical tips (best times to visit, what to expect, etc.)

Format your response nicely with:
- Clear section headers (use ## for headers)
- Numbered recommendations
- Time estimates where appropriate
- A brief summary at the end

Be enthusiastic and helpful! Make the user excited about their trip.
Keep responses concise but informative."""


async def generate_itinerary(user_query: str, attractions_data: str) -> AsyncGenerator[str, None]:
    """
    Generate a personalized itinerary using Google Gemini.
    Yields tokens as they are generated.
    """
    prompt = f"""{PLANNER_SYSTEM_PROMPT}

Today's date: {datetime.now(timezone.utc).strftime("%Y-%m-%d")}

USER'S REQUEST:
{user_query}

AVAILABLE NYC ATTRACTIONS (from search):
{attractions_data}

Please create a personalized itinerary based on the user's request."""

    try:
        # Generate content with streaming
        response = model.generate_content(prompt, stream=True)
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
                    
    except Exception as e:
        print(f"[Planner Agent] Error: {e}")
        yield f"Sorry, I encountered an error generating your itinerary: {str(e)}"


##############################################
## Combined Trip Planner Flow
##############################################

async def run_trip_planner_flow(user_query: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Run the complete trip planner flow:
    1. Query Generator Agent creates optimized search queries
    2. Search Agent finds relevant attractions via KNN embedding search
    3. Planner Agent generates personalized itinerary
    
    Yields streaming updates for the frontend.
    """
    # Step 1: Search for attractions (includes query generation)
    yield {"type": "status", "message": "🧠 Generating optimized search queries...", "done": False}
    
    try:
        attractions_data = await search_attractions(user_query)
        yield {"type": "status", "message": "✅ Found relevant attractions!", "done": False}
    except Exception as e:
        yield {"type": "error", "message": f"Search failed: {str(e)}", "done": True}
        return
    
    # Step 2: Generate itinerary
    yield {"type": "status", "message": "📝 Creating your personalized itinerary...", "done": False}
    
    try:
        async for token in generate_itinerary(user_query, attractions_data):
            yield {"type": "token", "content": token, "done": False}
    except Exception as e:
        yield {"type": "error", "message": f"Itinerary generation failed: {str(e)}", "done": True}
        return
    
    yield {"type": "complete", "done": True}
