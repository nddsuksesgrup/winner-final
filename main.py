import os
from typing import TypedDict, List, Annotated, Dict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from supabase import create_client, Client
import requests
import json

load_dotenv()

# --- CONFIGURATION ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
WAHA_URL = os.getenv("NEXT_PUBLIC_WAHA_URL")
WAHA_PHONE = os.getenv("NEXT_PUBLIC_NOTIFICATION_PHONE")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
llm = ChatOpenAI(
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    model="google/gemini-2.0-flash-001"
)

class AgentState(TypedDict):
    niche: str
    target_market: str
    results: Dict
    current_step: str
    status: str

def send_waha_notification(message: str):
    if WAHA_URL and WAHA_PHONE:
        try:
            requests.post(f"{WAHA_URL}/api/sendText", json={
                "chatId": f"{WAHA_PHONE}@c.us",
                "text": message,
                "session": "default"
            })
        except Exception as e:
            print(f"WAHA Error: {e}")

def keyword_agent(state: AgentState):
    prompt = f"Cari keyword potensial leads untuk Niche: {state['niche']} dan Target Market: {state['target_market']}. Berikan output JSON sesuai format PDF."
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {"keyword": res.content}, "current_step": "strategy"}

def strategy_agent(state: AgentState):
    prompt = f"Buat strategi konten berdasarkan keyword: {state['results']['keyword']}. Fokus pada Goal, Pain Points, dan Struktur."
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {**state['results'], "strategy": res.content}, "current_step": "writing"}

def writing_agent(state: AgentState):
    prompt = f"Tulis artikel lengkap berdasarkan strategi: {state['results']['strategy']}. Gunakan bahasa natural, paragraf pendek (max 3 baris)."
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {**state['results'], "writing": res.content}, "current_step": "image"}

def image_agent(state: AgentState):
    prompt = f"Buat prompt gambar dan SEO filename/alt text untuk artikel: {state['results']['writing']}"
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {**state['results'], "image": res.content}, "current_step": "revision"}

def revision_agent(state: AgentState):
    prompt = f"Review artikel dan gambar berikut. Apakah sudah natural? Status: LULUS atau REVISI. Data: {state['results']['writing']}"
    res = llm.invoke([HumanMessage(content=prompt)])
    status = "LULUS" if "LULUS" in res.content.upper() else "REVISI"
    return {"status": status, "results": {**state['results'], "revision": res.content}, "current_step": "seo" if status == "LULUS" else "writing"}

def seo_agent(state: AgentState):
    prompt = f"Optimasi SEO untuk artikel final. Meta title, desc, slug, dan internal links."
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {**state['results'], "seo": res.content}, "current_step": "publish"}

def publish_agent(state: AgentState):
    send_waha_notification(f"✅ Artikel Berhasil Dipublish!")
    return {"results": {**state['results'], "publish": {"status": "Published"}}, "current_step": "rating"}

def rating_agent(state: AgentState):
    prompt = f"Berikan skor (0-100) untuk SEO, Readability, dan Conversion."
    res = llm.invoke([HumanMessage(content=prompt)])
    return {"results": {**state['results'], "rating": res.content}, "current_step": "end"}

workflow = StateGraph(AgentState)
workflow.add_node("keyword", keyword_agent)
workflow.add_node("strategy", strategy_agent)
workflow.add_node("writing", writing_agent)
workflow.add_node("image", image_agent)
workflow.add_node("revision", revision_agent)
workflow.add_node("seo", seo_agent)
workflow.add_node("publish", publish_agent)
workflow.add_node("rating", rating_agent)

workflow.set_entry_point("keyword")
workflow.add_edge("keyword", "strategy")
workflow.add_edge("strategy", "writing")
workflow.add_edge("writing", "image")
workflow.add_edge("image", "revision")

workflow.add_conditional_edges(
    "revision",
    lambda x: x["status"],
    {
        "LULUS": "seo",
        "REVISI": "writing"
    }
)

workflow.add_edge("seo", "publish")
workflow.add_edge("publish", "rating")
workflow.add_edge("rating", END)

from langgraph.checkpoint.memory import MemorySaver
from fastapi import FastAPI
from pydantic import BaseModel
import uuid

# Tambahkan checkpointer agar LangGraph punya memori (bisa di-pause)
memory = MemorySaver()

# Kita atur agar graph PAUSE setelah node 'writing' dan 'revision'
app_graph = workflow.compile(checkpointer=memory, interrupt_after=["writing", "revision"])

app = FastAPI()

class StartRequest(BaseModel):
    niche: str
    target_market: str

class ResumeRequest(BaseModel):
    thread_id: str
    action: str # "APPROVE" atau "REVISE"
    feedback: str = ""

@app.post("/start-workflow")
async def start_workflow(req: StartRequest):
    # Buat ID unik untuk artikel ini
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = {
        "niche": req.niche,
        "target_market": req.target_market,
        "results": {},
        "current_step": "keyword",
        "status": ""
    }
    
    # Jalankan graph sampai titik pause pertama (writing)
    for event in app_graph.stream(initial_state, config=config):
        pass
        
    current_state = app_graph.get_state(config)
    
    return {
        "thread_id": thread_id,
        "is_paused": len(current_state.next) > 0,
        "next_nodes": current_state.next,
        "state": current_state.values
    }

@app.post("/resume-workflow")
async def resume_workflow(req: ResumeRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    # Jika user meminta revisi, kita update state LangGraph
    if req.action == "REVISE":
        app_graph.update_state(config, {"status": "REVISI"})
        # Kita bisa menambahkan feedback ke state jika ada
    else:
        app_graph.update_state(config, {"status": "LULUS"})
        
    # Lanjutkan graph dari titik pause
    for event in app_graph.stream(None, config=config):
        pass
        
    current_state = app_graph.get_state(config)
    
    return {
        "thread_id": req.thread_id,
        "is_paused": len(current_state.next) > 0,
        "next_nodes": current_state.next,
        "state": current_state.values
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

