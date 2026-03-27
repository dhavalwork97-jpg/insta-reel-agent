import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { frameBase64, template } = await req.json();

    const prompt = `You are an Instagram Reels expert with deep knowledge of trending content in 2025.

A user has uploaded a video and selected the "${template}" editing template.

Analyze this video frame and provide:

1. **VIBE ANALYSIS**: Describe the mood, energy, setting, and subject (2-3 sentences)
2. **MUSIC SUGGESTIONS**: Suggest 5 trending songs that would perfectly match this video. For each song provide:
   - Song title
   - Artist name  
   - Why it fits (1 sentence)
   - Pixabay search keyword (1-3 words to search on Pixabay for similar free music)
   - BPM estimate (slow/medium/fast)
3. **TEMPLATE TIPS**: Give 3 specific editing tips for the "${template}" template with this video
4. **HASHTAG PACK**: 10 trending hashtags for this content

Respond in this EXACT JSON format:
{
  "vibe": "string",
  "energy": "low|medium|high",
  "mood": "string (e.g. cinematic, hype, chill, aesthetic, dramatic)",
  "songs": [
    {
      "title": "string",
      "artist": "string",
      "reason": "string",
      "pixabayKeyword": "string",
      "bpm": "slow|medium|fast"
    }
  ],
  "templateTips": ["string", "string", "string"],
  "hashtags": ["string"]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: frameBase64
            ? [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: frameBase64,
                  },
                },
                { type: "text", text: prompt },
              ]
            : [{ type: "text", text: prompt }],
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
