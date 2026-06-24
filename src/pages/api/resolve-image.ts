import type { APIRoute } from "astro";

export const prerender = false;

const FALLBACK_IMAGES: Record<string, string> = {
  tech: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1080&auto=format&fit=crop",
  workspace: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1080&auto=format&fit=crop",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1080&auto=format&fit=crop",
  design: "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=1080&auto=format&fit=crop",
  analytics: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1080&auto=format&fit=crop",
  finance: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1080&auto=format&fit=crop",
  meeting: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1080&auto=format&fit=crop",
  medical: "https://images.unsplash.com/photo-1584515901407-d8f469399991?q=80&w=1080&auto=format&fit=crop",
  education: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1080&auto=format&fit=crop",
  abstract: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop",
};

function getFlickrTag(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("tech") || q.includes("code") || q.includes("developer") || q.includes("program") || q.includes("computer") || q.includes("web")) {
    return "coding";
  }
  if (q.includes("office") || q.includes("workspace") || q.includes("desk")) {
    return "workspace";
  }
  if (q.includes("design") || q.includes("creative") || q.includes("art")) {
    return "design";
  }
  if (q.includes("finance") || q.includes("money") || q.includes("business") || q.includes("analytics")) {
    return "office";
  }
  if (q.includes("medical") || q.includes("health") || q.includes("doctor")) {
    return "healthcare";
  }
  if (q.includes("education") || q.includes("learn") || q.includes("book")) {
    return "education";
  }
  return "minimalist";
}

function getStaticFallback(query: string): string {
  if (!query) return FALLBACK_IMAGES.abstract;
  const q = query.toLowerCase();
  if (q.includes("tech") || q.includes("code") || q.includes("developer") || q.includes("program") || q.includes("computer")) {
    return FALLBACK_IMAGES.tech;
  }
  if (q.includes("office") || q.includes("workspace") || q.includes("desk")) {
    return FALLBACK_IMAGES.workspace;
  }
  if (q.includes("design") || q.includes("creative") || q.includes("art")) {
    return FALLBACK_IMAGES.design;
  }
  if (q.includes("analytics") || q.includes("chart") || q.includes("data")) {
    return FALLBACK_IMAGES.analytics;
  }
  if (q.includes("finance") || q.includes("money") || q.includes("business")) {
    return FALLBACK_IMAGES.finance;
  }
  if (q.includes("meeting") || q.includes("team") || q.includes("group")) {
    return FALLBACK_IMAGES.meeting;
  }
  if (q.includes("medical") || q.includes("health") || q.includes("doctor")) {
    return FALLBACK_IMAGES.medical;
  }
  if (q.includes("education") || q.includes("learn") || q.includes("book")) {
    return FALLBACK_IMAGES.education;
  }
  return FALLBACK_IMAGES.abstract;
}

async function fetchFlickrImage(query: string): Promise<string | null> {
  try {
    const cleanTag = getFlickrTag(query);
    const url = `https://www.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(cleanTag)}&format=json&nojsoncallback=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const randomItem = data.items[Math.floor(Math.random() * Math.min(5, data.items.length))];
        const mUrl = randomItem.media?.m;
        if (mUrl) {
          return mUrl.replace("_m.jpg", "_b.jpg");
        }
      }
    }
  } catch (e) {
    console.error("Flickr failed:", e);
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  let query = "";
  try {
    const body = await request.json();
    query = body.query;
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }

    let finalQuery = query.trim().replace(/\s+/g, " ");
    const lowerQuery = finalQuery.toLowerCase();
    if (lowerQuery.includes("tech agency") || lowerQuery === "tech" || lowerQuery.includes("agency") || lowerQuery === "webs" || lowerQuery === "website") {
      finalQuery = "tech workspace laptop coding";
    } else if (lowerQuery.includes("coding") || lowerQuery.includes("programming") || lowerQuery.includes("developer")) {
      finalQuery = "developer coding workspace";
    }

    const cleanQuery = encodeURIComponent(finalQuery);
    const searchUrl = `https://unsplash.com/napi/search/photos?query=${cleanQuery}&per_page=15&orientation=landscape`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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
    console.error("Resolve image error, trying Flickr fallback:", err);
    
    const flickrUrl = await fetchFlickrImage(query);
    if (flickrUrl) {
      return new Response(JSON.stringify({ imageUrl: flickrUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      imageUrl: getStaticFallback(query) 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
