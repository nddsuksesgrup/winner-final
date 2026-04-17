import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const action = data.action; // 'start' or 'resume'
    
    const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL;

    if (!AGENT_API_URL) {
      console.error("AGENT_API_URL is missing in environment variables!");
      return NextResponse.json({ error: 'AGENT_API_URL is not configured' }, { status: 500 });
    }

    let response;
    if (action === 'resume') {
      console.log("Resuming Agent at:", `${AGENT_API_URL}/resume-workflow`);
      response = await axios.post(`${AGENT_API_URL}/resume-workflow`, {
        thread_id: data.thread_id,
        action: data.user_action, // "APPROVE" or "REVISE"
        feedback: data.feedback || ""
      }, { timeout: 120000 });
    } else {
      console.log("Starting Agent at:", `${AGENT_API_URL}/start-workflow`);
      response = await axios.post(`${AGENT_API_URL}/start-workflow`, {
        niche: data.niche,
        target_market: data.target_market
      }, { timeout: 120000 });
    }

    console.log("Agent Response:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('--- LANGGRAPH AGENT API ERROR ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error Message:', error.message);
    }
    return NextResponse.json({ 
      error: 'Failed to call LangGraph agent', 
      details: error.response?.data || error.message 
    }, { status: 500 });
  }
}
