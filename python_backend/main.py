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

from schemas import ResearchReport

load_dotenv()

# --- In-Memory Cache ---
# A simple dictionary to store generated reports by slug
report_cache: Dict[str, ResearchReport] = {}

# --- Pexels Tool ---
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
if PEXELS_API_KEY:
    pexels_api = Pexels(PEXELS_API_KEY)
else:
    pexels_api = None

@tool
def pexels_tool(query: str) -> List[Dict[str, Any]]:
    """Searches for images on Pexels and returns a list of image URLs."""
    if not pexels_api:
        print("--- PEXELS API KEY NOT FOUND ---")
        return []
    try:
        search_photos = pexels_api.search_photos(query, page=1, per_page=5)
        return [{"url": photo['src']['original']} for photo in search_photos['photos']]
    except Exception as e:
        print(f"--- PEXELS API ERROR: {e} ---")
        return []

# --- Examples for Prompts ---
example_for_article = {
    "title": "The Unrelenting Fury of Texas Floods",
    "excerpt": "This report provides a comprehensive overview of the recent and historical flooding events in Texas, highlighting the devastating impact on communities and the ongoing efforts in flood management and response.",
    "content": "Texas has long been battered by severe weather, but the recurring and intensifying floods have become a defining challenge for the state. From the catastrophic deluges of 1998 to the recent deadly events of July 2025, the impact has been immense... The narrative of Texas's struggle with flooding is one of tragedy, resilience, and a constant search for better preparedness.",
    "hero_image_url": "https://images.pexels.com/photos/12345/flood-image.jpg"
}

example_for_executive_summary = {
    "points": [
        "Texas has faced multiple catastrophic flood events, with notable occurrences in 1998, 2018, and 2025, leading to significant loss of life and property.",
        "State agencies like the Texas Division of Emergency Management (TDEM) actively monitor and respond to flood threats, utilizing advanced tools like the TxGIO Flood Viewer.",
        "Despite technological advancements, the unpredictability and severity of these weather events pose ongoing challenges to flood management and community safety."
    ]
}

example_for_timeline_items = [
    {
        "date": "1998-10-17T00:00:00Z",
        "title": "Historic Central Texas Flood",
        "description": "A stalled front causes up to 30 inches of rain, leading to devastating floods along the San Marcos and Guadalupe rivers.",
        "type": "Historical Event",
        "source_label": "TexasFlood.org",
        "source_url": "https://www.texasflood.org/"
    },
    {
        "date": "2025-07-04T00:00:00Z",
        "title": "July Fourth Catastrophe",
        "description": "Thunderstorms stall over Central Texas, causing deadly flash floods, particularly along the Guadalupe River, resulting in over 130 fatalities.",
        "type": "Recent Disaster",
        "source_label": "CNN",
        "source_url": "https://www.cnn.com/2025/07/06/us/victims-texas-flash-flooding-death"
    }
]

example_for_cited_sources = [
    {
        "name": "Texas Division of Emergency Management (TDEM)",
        "type": "Government Agency",
        "description": "Provides official information and updates on disaster response and recovery efforts for major flooding events in Texas.",
        "url": "https://tdem.texas.gov/disasters"
    },
    {
        "name": "Wikipedia: July 2025 Central Texas floods",
        "type": "Encyclopedia",
        "description": "A collaborative article detailing the causes, timeline, and impact of the deadly July 2025 floods.",
        "url": "https://en.wikipedia.org/wiki/July_2025_Central_Texas_floods"
    }
]

example_for_raw_facts = [
    {
        "category": "1998 Flood Statistics",
        "facts": [
            "Up to 30 inches of rain fell in two days.",
            "Historic flooding occurred along the San Marcos, Guadalupe, and San Antonio rivers."
        ]
    },
    {
        "category": "2025 Flood Impact",
        "facts": [
            "Over 130 deaths were reported.",
            "Recovery efforts were launched for approximately 100 missing persons."
        ]
    }
]

example_for_perspectives = [
    {
        "viewpoint": "The Human Cost",
        "description": "Focuses on the tragic loss of life and the personal stories of survivors, emphasizing the emotional and social toll of the floods.",
        "source": "CNN",
        "quote": "Survivors recounted horrific experiences, highlighting the speed and unpredictability of the floodwaters.",
        "color": "yellow",
        "url": "https://www.cnn.com/2025/07/06/us/victims-texas-flash-flooding-death",
        "reasoning": "This perspective underscores the immediate and personal impact of the disaster.",
        "evidence": "Survivor testimonies and reports on fatalities.",
        "conflict_source": "TDEM",
        "conflict_quote": "State emergency response resources were activated in anticipation of increased flood threats.",
        "conflict_url": "https://tdem.texas.gov/"
    }
]

examples_map = {
    "article": example_for_article,
    "executive_summary": example_for_executive_summary,
    "timeline_items": example_for_timeline_items,
    "cited_sources": example_for_cited_sources,
    "raw_facts": example_for_raw_facts,
    "perspectives": example_for_perspectives
}


# Define a reducer function for merging dictionaries
def merge_reports(dict1: dict, dict2: dict) -> dict:
    return {**dict1, **dict2}

# 1. Tool Setup
tavily_tool = TavilySearch(max_results=15)

@tool
def scrape_website(url: str) -> str:
    """Scrapes the content of a website."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "lxml")
        text = soup.get_text(separator="\n", strip=True)
        return text[:4000]  # Limit content size
    except requests.RequestException as e:
        return f"Error scraping website: {e}"

tools = [tavily_tool, scrape_website]

# 2. Agent State
class AgentState(TypedDict):
    messages: Annotated[list, lambda x, y: x + y]
    query: str
    scraped_data: list
    research_report: Annotated[Optional[dict], merge_reports]
    image_urls: Optional[dict]
    
# 3. Agent and Graph Definition
llm = ChatOpenAI(model="gpt-4o", temperature=0)

def create_agent(llm, tools, system_prompt):
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )
    return prompt | llm.bind_tools(tools)

def agent_node(state, agent, name):
    result = agent.invoke(state)
    return {"messages": [result]}

# --- Research Agent ---
RESEARCH_PROMPT = """You are a research agent. Your goal is to use the Tavily Search tool to find relevant articles for the user's query.
You must return a list of 15 URLs. Do not scrape them yet."""
research_agent = create_agent(llm, [tavily_tool], RESEARCH_PROMPT)
def research_node(state: AgentState):
    print("--- 🔬 RESEARCHING ---")
    state['messages'] = [HumanMessage(content=state['query'])]
    result = research_agent.invoke(state)
    print("--- ✅ RESEARCH COMPLETE ---")
    return {"messages": [result]}

# --- Scraper Agent ---
def scraper_node(state: AgentState):
    print("---  scraping WEB ---")
    urls = []
    scraped_content = []
    if state['messages'][-1].tool_calls:
        tool_calls = state['messages'][-1].tool_calls
        
        query = ""
        for call in tool_calls:
            if call['name'] == 'tavily_search':
                 query = call['args']['query']
                 break
        
        if query:
            print(f"--- EXECUTING TAVILY SEARCH for: {query} ---")
            tavily_results = tavily_tool.invoke(query)
            
            # The tool now returns a list of dictionaries, so we can iterate directly
            results_list = tavily_results if isinstance(tavily_results, list) else tavily_results.get('results', [])

            for res in results_list[:10]:
                scraped_content.append({"url": res['url'], "content": res['content']})
                urls.append(res['url'])
        else:
             print("--- NO TAVILY SEARCH TOOL CALL FOUND ---")

    print(f"--- SCRAPING {len(urls)} URLS ---")
    # The new TavilySearch tool scrapes content automatically, so we don't need to do it manually here.
    # The 'scraped_content' is already populated from the tavily_results.
        
    print("--- ✅ SCRAPING COMPLETE ---")
    return {"scraped_data": scraped_content, "messages": []}

# --- Image Fetcher Agent ---
IMAGE_FETCHER_PROMPT = """You are an expert image researcher. Your goal is to use the Pexels tool to find relevant images.
For the main article, use the original user query to find a hero image.
For the cited sources, use the title of each source to find a relevant image.
You must return a dictionary where the keys are 'hero_image' and 'source_images' (a list of URLs)."""
image_fetcher_agent = create_agent(llm, [pexels_tool], IMAGE_FETCHER_PROMPT)

def image_fetcher_node(state: AgentState):
    print("--- 🖼️ FETCHING IMAGES ---")
    
    # Fetch hero image
    hero_image_query = state['query']
    hero_image_urls = pexels_tool.invoke(hero_image_query)
    hero_image_url = hero_image_urls[0]['url'] if hero_image_urls else "https://images.pexels.com/photos/12345/flood-image.jpg"

    # Fetch source images
    source_images = []
    research_report = state.get('research_report', {})
    if 'cited_sources' in research_report:
        for source in research_report['cited_sources']:
            source_image_urls = pexels_tool.invoke(source['name'])
            source_image_url = source_image_urls[0]['url'] if source_image_urls else "https://p-cdn.com/generic-source-logo.png"
            source_images.append(source_image_url)
            
    print("--- ✅ IMAGES FETCHED ---")
    return {"image_urls": {"hero_image": hero_image_url, "source_images": source_images}}


# --- Writer Agents ---
def create_writer_agent(section_name: str):
    example = examples_map.get(section_name)
    if not example:
        raise ValueError(f"No example found for section: {section_name}")

    # The example string is embedded in a prompt template, so its curly braces
    # need to be escaped to avoid being interpreted as template variables.
    example_str = json.dumps(example, indent=2).replace("{", "{{").replace("}", "}}")

    prompt = f"""You are an expert writing agent. Your sole purpose is to generate a specific section of a research report based on provided web content.

You MUST generate a valid JSON output that strictly follows the structure and field names of the example below.
Do not add any commentary, explanations, or any text outside of the JSON output.

### EXAMPLE FORMAT ###
```json
{example_str}
```

Now, using the provided web content, generate the '{section_name}' section of the report. Adhere to the example format precisely.
"""
    return create_agent(llm, [], prompt)

writer_agents = {
    "article": create_writer_agent("article"),
    "executive_summary": create_writer_agent("executive_summary"),
    "timeline_items": create_writer_agent("timeline_items"),
    "cited_sources": create_writer_agent("cited_sources"),
    "raw_facts": create_writer_agent("raw_facts"),
    "perspectives": create_writer_agent("perspectives"),
}

def writer_node(state: AgentState, agent_name: str):
    print(f"--- ✍️ WRITING SECTION: {agent_name} ---")
    agent = writer_agents[agent_name]
    
    # Create a message with the scraped data
    content = f"Generate the {agent_name.replace('_', ' ')} based on the following scraped content:\n\n"
    for item in state['scraped_data']:
        content += f"URL: {item['url']}\nContent: {item['content']}\n\n"
    
    messages = [HumanMessage(content=content)]
    
    result = agent.invoke({"messages": messages})
    
    # Log the raw response from the model
    print(f"--- RAW RESPONSE FOR {agent_name} ---")
    print(getattr(result, 'content', str(result)))
    print(f"--- END RAW RESPONSE FOR {agent_name} ---")

    try:
        # The result from the LLM might be a string that needs parsing.
        # It may also be inside the 'content' attribute of an AIMessage
        if hasattr(result, 'content'):
            data_str = result.content
        else:
            data_str = str(result)
            
        # Clean the string if it's wrapped in markdown
        if data_str.strip().startswith("```"):
            match = re.search(r'```(json)?\s*\n(.*?)\n\s*```', data_str, re.DOTALL)
            if match:
                data_str = match.group(2)
            
        parsed_json = json.loads(data_str)
        print(f"--- ✅ SECTION {agent_name} COMPLETE ---")
        return {"research_report": {agent_name: parsed_json}}
    except (json.JSONDecodeError, AttributeError) as e:
        # Handle parsing errors or if the content is not what we expect
        error_message = f"Error processing {agent_name}: {e}"
        print(f"--- ❌ ERROR IN SECTION {agent_name}: {error_message} ---")
        # Return a message to be handled or logged
        return {"messages": [HumanMessage(content=error_message)]}


# --- Aggregator Node ---
def aggregator_node(state: AgentState):
    print("---  aggregating ALL THE DATA ---")
    # This node is a bit of a trick. The writer nodes will update the `research_report` in the state.
    # In a real scenario, we might need a more robust way to merge partial results.
    # For this example, we assume each writer node adds its own key to the research_report dictionary.
    # We will just pass the state through, and the final state will have the complete report.
    # A final validation step could be added here.
    print("--- ✅ AGGREGATION COMPLETE ---")
    return {}

# 4. Graph Construction
workflow = StateGraph(AgentState)
workflow.add_node("researcher", research_node)
workflow.add_node("scraper", scraper_node)
workflow.add_node("image_fetcher", image_fetcher_node)

for name in writer_agents.keys():
    workflow.add_node(name, lambda state, name=name: writer_node(state, name))

workflow.add_node("aggregator", aggregator_node)

workflow.add_edge(START, "researcher")
workflow.add_edge("researcher", "scraper")

# After scraping, run writer agents and image fetcher in parallel
for name in writer_agents.keys():
    workflow.add_edge("scraper", name)
# workflow.add_edge("scraper", "image_fetcher") # Run image fetcher later


# After all writers and the image fetcher are done, go to the aggregator
for name in writer_agents.keys():
    workflow.add_edge(name, "aggregator")
# workflow.add_edge("image_fetcher", "aggregator")

# Run the image fetcher after the cited_sources writer has completed
workflow.add_edge("cited_sources", "image_fetcher")
workflow.add_edge("image_fetcher", "aggregator")

    
workflow.add_edge("aggregator", END)

graph = workflow.compile()

# 5. FastAPI App
app = FastAPI()

class ResearchRequest(BaseModel):
    query: str

@app.post("/api/research")
async def research(request: ResearchRequest):
    print(f"--- 🚀 RECEIVED RESEARCH REQUEST: {request.query} ---")
    initial_state = {"query": request.query, "messages": [], "scraped_data": [], "research_report": {}, "image_urls": {}}
    
    final_report_data = {}
    
    # Using a single execution of the graph
    print("--- 🔄 EXECUTING WORKFLOW ---")
    final_state = graph.invoke(initial_state, {"recursion_limit": 100})
    
    # Extract the research report from the final state
    if final_state and 'research_report' in final_state:
        final_report_data = final_state['research_report']
        
    # Merge image URLs into the final report
    if final_state and 'image_urls' in final_state and final_state['image_urls']:
        if 'article' in final_report_data:
            final_report_data['article']['hero_image_url'] = final_state['image_urls']['hero_image']
        if 'cited_sources' in final_report_data and final_state['image_urls']['source_images']:
            for i, source in enumerate(final_report_data['cited_sources']):
                if i < len(final_state['image_urls']['source_images']):
                    source['image_url'] = final_state['image_urls']['source_images'][i]
                else:
                    source['image_url'] = "https://p-cdn.com/generic-source-logo.png"


    print("--- 📝 ASSEMBLING FINAL REPORT ---")
    article_id = int(uuid.uuid4().int & (1<<31)-1)
    if 'article' in final_report_data:
        # Generate a unique slug for the article
        base_slug = final_report_data['article']['title'].lower().replace(' ', '-').replace('"', '')
        slug = re.sub(r'[^a-z0-9-]', '', base_slug)
        final_report_data['article']['slug'] = slug

        final_report_data['article']['id'] = article_id
        final_report_data['article']['read_time'] = 5
        final_report_data['article']['source_count'] = len(final_state.get('scraped_data', []))
        final_report_data['article']['published_at'] = "2024-01-01T00:00:00Z"
        final_report_data['article']['category'] = "Research"
        final_report_data['article']['author_name'] = "AI Agent"
        final_report_data['article']['author_title'] = "Research Specialist"

    for key in ['executive_summary', 'timeline_items', 'cited_sources', 'raw_facts', 'perspectives']:
        if key in final_report_data:
            if isinstance(final_report_data[key], list):
                for item in final_report_data[key]:
                    item['article_id'] = article_id
            else:
                final_report_data[key]['article_id'] = article_id

    try:
        print("--- VALIDATING FINAL REPORT ---")
        validated_report = ResearchReport.model_validate(final_report_data)
        
        # Store the full report in the cache
        report_slug = validated_report.article.slug
        report_cache[report_slug] = validated_report
        
        print(f"--- ✅ REPORT GENERATED AND CACHED. SLUG: {report_slug} ---")
        
        # Return only the slug to the frontend
        return {"slug": report_slug}
        
    except Exception as e:
        print(f"--- ❌ FAILED TO GENERATE REPORT: {e} ---")
        raise HTTPException(status_code=500, detail=f"Failed to generate valid report: {e}\n\n{final_report_data}")

@app.get("/api/article/{slug}", response_model=ResearchReport)
async def get_article(slug: str):
    print(f"--- 🔎 FETCHING ARTICLE WITH SLUG: {slug} ---")
    report = report_cache.get(slug)
    if not report:
        print(f"--- ❌ ARTICLE NOT FOUND IN CACHE ---")
        raise HTTPException(status_code=404, detail="Article not found")
    
    print("--- ✅ ARTICLE FOUND, RETURNING TO CLIENT ---")
    return report

@app.get("/api/feed")
def get_feed():
    print("--- 📢 /API/FEED ENDPOINT HIT ---")
    return []

@app.get("/")
def read_root():
    return {"message": "Welcome to the Research Agent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 