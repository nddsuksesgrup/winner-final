import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();
    
    const WAHA_URL = process.env.NEXT_PUBLIC_WAHA_URL;
    const WAHA_API_KEY = process.env.NEXT_PUBLIC_WAHA_API_KEY;

    console.log("Attempting to contact WAHA at:", `${WAHA_URL}/api/sendText`);

    if (!WAHA_URL) {
      console.error("WAHA_URL is missing in environment variables!");
      return NextResponse.json({ error: 'WAHA_URL is not configured' }, { status: 500 });
    }

    const response = await axios.post(`${WAHA_URL}/api/sendText`, {
      chatId: `${phone}@c.us`,
      text: message,
      session: 'winnerfinal',
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(WAHA_API_KEY && { 'X-Api-Key': WAHA_API_KEY }),
      },
      timeout: 10000, // 10 seconds timeout
    });

    console.log("WAHA Response:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('--- WAHA API ROUTER ERROR ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error Message:', error.message);
    }
    return NextResponse.json({ 
      error: 'Failed to send notification', 
      details: error.response?.data || error.message 
    }, { status: 500 });
  }
}
