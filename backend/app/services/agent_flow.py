"""
Multi-Agent Trip Planner - Agent Flow

Simple wrapper that exposes the trip planner flow for the API endpoint.
"""
from typing import AsyncGenerator, Dict, Any
from .agents import run_trip_planner_flow


async def run_trip_planner(user_query: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Run the trip planner and stream results.
    
    Yields streaming updates and final response.
    """
    async for event in run_trip_planner_flow(user_query):
        yield event
