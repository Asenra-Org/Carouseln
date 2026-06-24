import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query } = await request.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }

    const cleanQuery = encodeURIComponent(query.trim().replace(/\s+/g, " "));
    const searchUrl = `https://unsplash.com/napi/search/photos?query=${cleanQuery}&per_page=10`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        const rawUrl = photo.urls?.raw || photo.urls?.regular;
        if (rawUrl) {
          const finalUrl = `${rawUrl.split('?')[0]}?q=80&w=1080&auto=format&fit=crop`;
          return new Response(JSON.stringify({ imageUrl: finalUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    throw new Error("No results found or request failed");
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
