import os
import re
import json
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, TypedDict, Annotated
from langchain_tavily import TavilySearch
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from pexelsapi.pexels import Pexels

load_dotenv()



# Typed Dict is a python hint statement



# Writing out hte state definition
class HotTopicState(TypedDict): 
    messages: Annotated[list, lambda x, y: x+ y] # Stores conversation history between workflow nodes & hase x + y merge message funciton
    trending_events : List[Dict[str, Any]] # stores raw trending notes from various sources, list of dictionary where each dictionary returns one news event
    hot_topics: Annotated[Optional[dict, merge_reports]] # Stores the final generated hot topics, has a merge reports funciton that stores multiple topics
    image_urls: Optional[dict] # Has optional parameters and stores image URLs for each hot topics
    generated_at: # TimeStamp of when hot topics were generated


''' Example of State: 
    state = {
    "messages": [],
    "trending_events": [],
    "hot_topics": None,
    "image_urls": None,
    "generated_at": "2024-01-15T10:30:00Z"



    This serves as a log to keep track of the state of multiple components
}'''


# Now we must define the tools - the functions that your AI agents can call to perform specific tasks

# Fetches current trending news from various sources
@tool
def get_trending_neews() -> List[Dict[str,Any]]:
 # Could fetch from:
    # - RSS feeds (CNN, BBC, Reuters)
    # - News APIs (NewsAPI, GNews)
    # - Social media trends
    # - Google Trends
    
    return [
        {
            "title": "Trump announces new economic policy",
            "url": "https://example.com/article1",
            "source": "CNN",
            "published_at": "2024-01-15T10:00:00Z",
            "summary": "President Trump unveiled..."
        },
        {
            "title": "AI breakthrough in medical diagnosis",
            "url": "https://example.com/article2", 
            "source": "Reuters",
            "published_at": "2024-01-15T09:30:00Z",
            "summary": "Researchers developed..."
        }
    ]




# This tools takes raw news and filters out for what is truly news worthy
@tool # Tells Langchain that this function can be called by AI Agent # Tools can be functions
def filter_relevant_events(events: list[Dict[str,any]] -> List[Dict[str,Any]]:
                           
    relevant_events = []
   
    for event in events:
        # Filter criteria:
        # - Is it recent (last 24 hours)?
        # - Does it have broad impact?
        # - Is it from reliable sources?
        # - Is it not duplicate content?
        
        if is_newsworthy(event):
            relevant_events.append(event)
    
    return relevant_events[:10]  # Return top 10 most relevant                  



@tool
def categorize_event(event: Dict[str, Any]) -> str:
    """Categorizes an event into Politics, Technology, etc."""
    pass
    


# Next we would have to make our System Prompt


# Hot Topic Generator Agent
HOT_TOPIC_PROMPT = """You are a hot topic generator. Your job is to:
1. Take trending events and create compelling headlines
2. Write 2-sentence descriptions that capture the essence
3. Ensure topics are newsworthy and current
4. Make headlines engaging but factual

Format each hot topic as:
{
  "headline": "Compelling headline",
  "description": "Two sentence description that explains the event and its significance.",
  "category": "Politics/Technology/Business/etc",
  "source_url": "URL of the original news source"
}
"""

# Event Filter Agent
EVENT_FILTER_PROMPT = """You are an event filter. Your job is to:
1. Identify which events are truly newsworthy
2. Filter out duplicate or similar stories
3. Prioritize events with broad impact
4. Ensure diversity in topics and sources
"""

# Category Classifier Agent
CATEGORY_PROMPT = """You are a category classifier. Classify each event into:
- Politics
- Technology  
- Business
- Health
- Environment
- International
- Sports
- Entertainment
"""


class create_hot_topic()