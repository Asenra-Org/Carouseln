import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query } = await request.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }

    // Clean query and search loremflickr.com
    const cleanQuery = query.trim().replace(/[^a-zA-Z0-9\s,]/g, "").replace(/\s+/g, ",");
    const searchUrl = `https://loremflickr.com/1080/1350/${encodeURIComponent(cleanQuery)}`;

    // Resolve redirect URL with a 6 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(searchUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      return new Response(JSON.stringify({ imageUrl: res.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    throw new Error("Failed to search image");
  } catch (err: any) {
    console.error("Resolve image error:", err);
    // Fall back to a premium static abstract image url
    return new Response(JSON.stringify({ 
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
