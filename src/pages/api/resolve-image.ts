import type { APIRoute } from "astro";

export const prerender = false;

const CURATED_PHOTOS: Record<string, string[]> = {
  tech: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1080&auto=format&fit=crop", // code editor
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1080&auto=format&fit=crop", // laptop and coffee
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1080&auto=format&fit=crop", // code on screen
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1080&auto=format&fit=crop", // html tag code
    "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1080&auto=format&fit=crop", // Macbook coding
    "https://images.unsplash.com/photo-1580894732444-8fecef2271ff?q=80&w=1080&auto=format&fit=crop", // coding desk setup
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1080&auto=format&fit=crop", // green matrix code
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1080&auto=format&fit=crop", // programmer coding
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1080&auto=format&fit=crop"  // tech motherboard cyber
  ],
  workspace: [
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1080&auto=format&fit=crop", // clean desk setup
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1080&auto=format&fit=crop", // minimalist conference room
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1080&auto=format&fit=crop", // modern office reception
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1080&auto=format&fit=crop", // coworking space
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1080&auto=format&fit=crop", // office setup
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1080&auto=format&fit=crop", // workspace workstation
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1080&auto=format&fit=crop", // creative group work
    "https://images.unsplash.com/photo-1531535934200-87342993049b?q=80&w=1080&auto=format&fit=crop"  // modern office window desk
  ],
  design: [
    "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=1080&auto=format&fit=crop", // creative colors
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1080&auto=format&fit=crop", // drawing tablet
    "https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=1080&auto=format&fit=crop", // design monitor
    "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1080&auto=format&fit=crop", // UX design sketch
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1080&auto=format&fit=crop", // abstract painting
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1080&auto=format&fit=crop"  // UI elements screen
  ],
  analytics: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1080&auto=format&fit=crop", // financial chart laptop
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1080&auto=format&fit=crop", // charts on tablet
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1080&auto=format&fit=crop", // stock dashboard
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1080&auto=format&fit=crop", // crypto stocks
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1080&auto=format&fit=crop"  // office presentation analytics
  ],
  finance: [
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1080&auto=format&fit=crop", // financial planning
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1080&auto=format&fit=crop", // money coins growth
    "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=1080&auto=format&fit=crop", // financial graphs
    "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=1080&auto=format&fit=crop"  // piggy bank and budget
  ],
  meeting: [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1080&auto=format&fit=crop", // creative meeting
    "https://images.unsplash.com/photo-1531539738883-fb4c7159a2e6?q=80&w=1080&auto=format&fit=crop", // team presentation
    "https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?q=80&w=1080&auto=format&fit=crop", // business meeting
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080&auto=format&fit=crop"  // group collaboration
  ],
  medical: [
    "https://images.unsplash.com/photo-1584515901407-d8f469399991?q=80&w=1080&auto=format&fit=crop", // medical lab test
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1080&auto=format&fit=crop", // stethoscope doctor
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1080&auto=format&fit=crop"  // hospital laboratory
  ],
  education: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1080&auto=format&fit=crop", // library books
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1080&auto=format&fit=crop", // study workspace
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1080&auto=format&fit=crop"  // student workspace
  ],
  abstract: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop", // blue pink abstract
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1080&auto=format&fit=crop", // aesthetic abstract art
    "https://images.unsplash.com/photo-1618005198143-e528346d9a59?q=80&w=1080&auto=format&fit=crop", // gradient waves
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop"  // neon geometry
  ]
};

function getFallbackImage(query: string): string {
  if (!query) {
    const list = CURATED_PHOTOS.abstract;
    return list[Math.floor(Math.random() * list.length)];
  }
  const q = query.toLowerCase();
  if (q.includes("tech") || q.includes("code") || q.includes("developer") || q.includes("program") || q.includes("computer")) {
    return CURATED_PHOTOS.tech[Math.floor(Math.random() * CURATED_PHOTOS.tech.length)];
  }
  if (q.includes("office") || q.includes("workspace") || q.includes("desk")) {
    return CURATED_PHOTOS.workspace[Math.floor(Math.random() * CURATED_PHOTOS.workspace.length)];
  }
  if (q.includes("design") || q.includes("creative") || q.includes("art")) {
    return CURATED_PHOTOS.design[Math.floor(Math.random() * CURATED_PHOTOS.design.length)];
  }
  if (q.includes("analytics") || q.includes("chart") || q.includes("data")) {
    return CURATED_PHOTOS.analytics[Math.floor(Math.random() * CURATED_PHOTOS.analytics.length)];
  }
  if (q.includes("finance") || q.includes("money") || q.includes("business")) {
    return CURATED_PHOTOS.finance[Math.floor(Math.random() * CURATED_PHOTOS.finance.length)];
  }
  if (q.includes("meeting") || q.includes("team") || q.includes("group")) {
    return CURATED_PHOTOS.meeting[Math.floor(Math.random() * CURATED_PHOTOS.meeting.length)];
  }
  if (q.includes("medical") || q.includes("health") || q.includes("doctor")) {
    return CURATED_PHOTOS.medical[Math.floor(Math.random() * CURATED_PHOTOS.medical.length)];
  }
  if (q.includes("education") || q.includes("learn") || q.includes("book")) {
    return CURATED_PHOTOS.education[Math.floor(Math.random() * CURATED_PHOTOS.education.length)];
  }
  
  // Custom queries fall back to dynamic LoremFlickr search instead of abstract wallpapers
  const tags = query.trim().replace(/\s+/g, " ").split(" ").map(encodeURIComponent).join(",");
  const cacheBuster = Math.floor(Math.random() * 1000000);
  return `https://loremflickr.com/1080/1080/${tags}?random=${cacheBuster}`;
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
        const limit = Math.min(data.results.length, 8);
        const randomIndex = Math.floor(Math.random() * limit);
        const photo = data.results[randomIndex];
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
    return new Response(JSON.stringify({ 
      imageUrl: getFallbackImage(query) 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
