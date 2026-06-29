import type { APIRoute } from "astro";

export const prerender = false;

const CURATED_PHOTOS: Record<string, string[]> = {
  tech: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580894732444-8fecef2271ff?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1080&auto=format&fit=crop"
  ],
  workspace: [
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531535934200-87342993049b?q=80&w=1080&auto=format&fit=crop"
  ],
  design: [
    "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1080&auto=format&fit=crop"
  ],
  analytics: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1080&auto=format&fit=crop"
  ],
  finance: [
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=1080&auto=format&fit=crop"
  ],
  meeting: [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531539738883-fb4c7159a2e6?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080&auto=format&fit=crop"
  ],
  medical: [
    "https://images.unsplash.com/photo-1584515901407-d8f469399991?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1080&auto=format&fit=crop"
  ],
  education: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1080&auto=format&fit=crop"
  ],
  abstract: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618005198143-e528346d9a59?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop"
  ]
};

function getCuratedCategoryList(query: string): string[] {
  const q = query.toLowerCase();
  if (q.includes("tech") || q.includes("code") || q.includes("developer") || q.includes("program") || q.includes("computer")) {
    return CURATED_PHOTOS.tech;
  }
  if (q.includes("office") || q.includes("workspace") || q.includes("desk")) {
    return CURATED_PHOTOS.workspace;
  }
  if (q.includes("design") || q.includes("creative") || q.includes("art")) {
    return CURATED_PHOTOS.design;
  }
  if (q.includes("analytics") || q.includes("chart") || q.includes("data")) {
    return CURATED_PHOTOS.analytics;
  }
  if (q.includes("finance") || q.includes("money") || q.includes("business")) {
    return CURATED_PHOTOS.finance;
  }
  if (q.includes("meeting") || q.includes("team") || q.includes("group")) {
    return CURATED_PHOTOS.meeting;
  }
  if (q.includes("medical") || q.includes("health") || q.includes("doctor")) {
    return CURATED_PHOTOS.medical;
  }
  if (q.includes("education") || q.includes("learn") || q.includes("book")) {
    return CURATED_PHOTOS.education;
  }
  return CURATED_PHOTOS.abstract;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const query = (body.query || "").trim();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }

    // Try Unsplash NAPI first
    try {
      const cleanQuery = encodeURIComponent(query);
      const searchUrl = `https://unsplash.com/napi/search/photos?query=${cleanQuery}&per_page=20&orientation=landscape`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const results = data.results.map((r: any) => ({
            id: r.id,
            thumb: r.urls.small || r.urls.regular,
            full: `${r.urls.raw.split('?')[0]}?q=80&w=1080&auto=format&fit=crop`,
            author: r.user.name,
            authorUrl: `https://unsplash.com/@${r.user.username}?utm_source=carouseln&utm_medium=referral`
          }));
          return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    } catch (err) {
      console.warn("Unsplash NAPI search failed, trying Flickr feed fallback:", err);
    }

    // Fallback to Flickr public feed
    try {
      const tags = query.replace(/\s+/g, " ").split(" ").map(encodeURIComponent).join(",");
      const flickrUrl = `https://www.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&nojsoncallback=1`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(flickrUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.items && data.items.length > 0) {
          const results = data.items.map((item: any, idx: number) => {
            const thumb = item.media.m;
            // Flickr URL replacement: convert _m (medium 240px) to _b (large 1024px) for background image quality
            const full = thumb.includes("_m.jpg") ? thumb.replace("_m.jpg", "_b.jpg") : thumb;
            const authorMatch = item.author.match(/\("([^"]+)"\)/);
            const authorName = authorMatch ? authorMatch[1] : "Flickr Creator";
            return {
              id: `flickr-${idx}-${Date.now()}`,
              thumb: thumb,
              full: full,
              author: authorName,
              authorUrl: item.link
            };
          });
          return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    } catch (err) {
      console.warn("Flickr feed fallback search failed, returning curated category list:", err);
    }

    // Ultimate fallback: Curated static category images
    const list = getCuratedCategoryList(query);
    const results = list.map((url, idx) => ({
      id: `curated-${idx}`,
      thumb: url,
      full: url,
      author: "Curated Collection",
      authorUrl: "https://unsplash.com"
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("General search-images error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to search images" }), { status: 500 });
  }
};
