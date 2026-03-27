import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "upbeat";

  try {
    const url = `https://pixabay.com/api/music/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=5`;
    const res = await fetch(url);
    const data = await res.json();

    const tracks = (data.hits || []).map(
      (hit: {
        id: number;
        tags: string;
        user: string;
        duration: number;
        audio: string;
        pageURL: string;
      }) => ({
        id: hit.id,
        title: hit.tags?.split(",")[0]?.trim() || "Untitled",
        artist: hit.user,
        duration: hit.duration,
        audioUrl: hit.audio,
        pageUrl: hit.pageURL,
      })
    );

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ tracks: [] }, { status: 500 });
  }
}
