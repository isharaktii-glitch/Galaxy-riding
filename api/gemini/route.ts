import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helper for a ride and logistics sharing app. Extract JSON data from this user text: "${prompt}". 
      Return JSON format: {"startLocation": "", "endLocation": "", "vehicleType": "", "price": ""}`,
    });

    return NextResponse.json({ result: response.text });
  } catch (error) {
    return NextResponse.json({ error: 'AI Processing Failed' }, { status: 500 });
  }
}
