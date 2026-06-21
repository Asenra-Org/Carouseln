import type { APIRoute } from "astro";
import { GoogleGenerativeAI } from "@google/generative-ai";

import fs from "fs";
import path from "path";

function getContrastColor(hex: string): string {
  if (!hex) return "#FFFFFF";
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
  }
  if (cleanHex.length !== 6) return "#FFFFFF";
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#FFFFFF";
  
  const fn = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const luminance = 0.2126 * fn(r) + 0.7152 * fn(g) + 0.0722 * fn(b);
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

function blendColors(hexBg: string, hexPrimary: string, ratio: number = 0.08): string {
  const parseHex = (hex: string) => {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  };

  const bg = parseHex(hexBg) || { r: 0, g: 0, b: 0 };
  const prim = parseHex(hexPrimary) || { r: 255, g: 184, b: 0 };

  const r = Math.round(bg.r * (1 - ratio) + prim.r * ratio);
  const g = Math.round(bg.g * (1 - ratio) + prim.g * ratio);
  const b = Math.round(bg.b * (1 - ratio) + prim.b * ratio);

  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function resolveInitialImage(industry: string, topic: string, imageKeywords?: string): Promise<{ url: string | null; query: string }> {
  try {
    let queryTerm = "";
    if (imageKeywords && imageKeywords.trim()) {
      const tags = imageKeywords.split(/[\s,]+/).filter(Boolean);
      queryTerm = tags.join(",");
    } else {
      queryTerm = `${industry || "abstract"},${topic.trim().replace(/[^a-zA-Z0-9\s,]/g, "").replace(/\s+/g, ",")}`;
    }
    const cleanQuery = queryTerm.substring(0, 80);
    const searchUrl = `https://loremflickr.com/1080/1350/${encodeURIComponent(cleanQuery)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(searchUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      return { url: res.url, query: queryTerm.replace(/,/g, " ") };
    }
  } catch (err) {
    console.error("Resolve initial image failed:", err);
  }
  return { url: null, query: `${industry} ${topic}`.trim() };
}

function getBgStyleForSlide(index: number): string {
  const transforms = [
    { scale: 1.25, rotate: 0, origin: "center", position: "center" },
    { scale: 1.4, rotate: 5, origin: "top left", position: "top left" },
    { scale: 1.35, rotate: -6, origin: "bottom right", position: "bottom right" },
    { scale: 1.45, rotate: 10, origin: "center", position: "center" },
    { scale: 1.3, rotate: -5, origin: "top right", position: "top right" },
    { scale: 1.5, rotate: 8, origin: "bottom left", position: "bottom left" },
    { scale: 1.28, rotate: -10, origin: "center", position: "center" },
  ];
  const t = transforms[index % transforms.length];
  return `background-image: var(--bg-image); opacity: var(--bg-opacity, 0.08); background-size: cover; background-position: ${t.position}; transform: scale(${t.scale}) rotate(${t.rotate}deg); transform-origin: ${t.origin}; -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 80%); mask-image: radial-gradient(circle at center, black 30%, transparent 80%); position: absolute; inset: 0px; pointer-events: none; z-index: 0;`;
}

function getStyleProfile(vibe: string) {
  const v = vibe.toLowerCase().trim();
  if (v === "luxury") {
    return {
      fontName: "Editorial Luxury",
      headingClass: "font-cormorant font-normal italic",
      bodyClass: "font-outfit font-light",
      headingDesc: "Elegant, high-end editorial serif. Headings should feel like a premium print magazine, often with sentence-case italicized accents. NEVER use all-caps uppercase.",
      bodyDesc: "Sleek, high-fashion sans-serif. Always use small sizes like text-[13px] md:text-sm.",
      borderClass: "border border-black/10 rounded-none",
      cardClass: "bg-black/[0.02] border border-black/5 rounded-none",
      bgStyle: "radial-gradient",
      layoutStyle: "Ultra-premium minimal editorial. Focus on asymmetrical layouts, huge margins, elegant italic subtitles, and clean single-column or split text."
    };
  } else if (v === "editorial") {
    return {
      fontName: "Editorial Luxury",
      headingClass: "font-cormorant font-normal",
      bodyClass: "font-outfit font-light",
      headingDesc: "Sophisticated editorial serif. Headings should look like newspaper or magazine titles.",
      bodyDesc: "Clean sans-serif. Always use small sizes like text-[13px] md:text-sm.",
      borderClass: "border-b border-black/20 pb-2",
      cardClass: "border-l-4 border-black/40 pl-4 py-2 bg-transparent rounded-none",
      bgStyle: "linear-gradient-vertical",
      layoutStyle: "Magazine editorial. Use two-column text splits (left column for title, right column for cards), large blockquotes, and fine horizontal divider lines."
    };
  } else if (v === "minimal") {
    return {
      fontName: "Tech Minimalist",
      headingClass: "font-space font-bold tracking-tight uppercase",
      bodyClass: "font-outfit font-normal",
      headingDesc: "Modern, clean, geometric sans-serif. Keep headings short and sharp.",
      bodyDesc: "Sleek, clean sans-serif. Always use small sizes like text-[13px] md:text-sm.",
      borderClass: "border-none",
      cardClass: "bg-black/[0.03] border-none rounded-none",
      bgStyle: "solid",
      layoutStyle: "Ultra-minimalist layout. No borders, no divider lines. Pure whitespace, tiny labels, and clean text blocks aligned in a single axis."
    };
  } else if (v === "bold") {
    return {
      fontName: "Bold Impact",
      headingClass: "font-syne font-extrabold uppercase tracking-tight leading-none",
      bodyClass: "font-space font-medium",
      headingDesc: "Wide, heavy, highly expressive display font. Headings must be uppercase, loud, and short (3-5 words max).",
      bodyDesc: "Clean geometric sans-serif. Always use text-sm.",
      borderClass: "border-4 border-black",
      cardClass: "border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      bgStyle: "linear-gradient-diagonal",
      layoutStyle: "Neobrutalist style. Solid thick black borders, heavy uppercase titles, cards with sharp black offset shadows, raw blocks."
    };
  } else if (v === "playful") {
    return {
      fontName: "Trendy Condense",
      headingClass: "font-bricolage font-black tracking-tight uppercase",
      bodyClass: "font-outfit font-normal",
      headingDesc: "Bold, condensed, modern startup sans-serif.",
      bodyDesc: "Sleek, rounded feel sans-serif. Always use text-[13px] md:text-sm.",
      borderClass: "border border-black/30 rounded-full px-3 py-1",
      cardClass: "bg-black/[0.04] border border-black/10 rounded-2xl p-5",
      bgStyle: "radial-gradient",
      layoutStyle: "Modern friendly startup. Soft rounded-2xl corners on cards, badges with pill-shaped rounded borders, and playful color gradients."
    };
  } else {
    // raw or default
    return {
      fontName: "Raw Industrial",
      headingClass: "font-syne font-bold uppercase tracking-tight",
      bodyClass: "font-space font-normal",
      headingDesc: "Heavy industrial display font. Headings should feel structural.",
      bodyDesc: "Monospace/geometric style sans-serif. Always use text-[13px] md:text-sm.",
      borderClass: "border-2 border-black",
      cardClass: "border-2 border-black bg-transparent rounded-none",
      bgStyle: "linear-gradient-vertical",
      layoutStyle: "Raw/code aesthetic. Use grid lines, monospace badges, thin divider lines, and code-like structures."
    };
  }
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      topic, 
      brandName = "Brand",
      vibe = "Luxury", 
      tone = "Professional",
      colorPrimary = "#FFB800",
      colorBg = "#000000",
      logoUrl = "",
      brandContext = "",
      website = "",
      aspectRatio = "4/5",
      industry = ""
    } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400 });
    }

    const textColor = getContrastColor(colorBg);
    const isLightBg = textColor === "#000000";
    
    // We define clean Tailwind classes to represent text contrast dynamically using opacity
    const textPrimaryClass = isLightBg ? "text-black" : "text-white";
    const textSecondaryClass = isLightBg ? "text-black/80" : "text-white/80";
    const textMutedClass = isLightBg ? "text-black/60" : "text-white/60";

    const profile = getStyleProfile(vibe);
    
    // Replace black/white placeholders in profile classes with the correct text colors
    const replaceColorPlaceholders = (cls: string, isLight: boolean) => {
      let result = cls
        .replace(/black/g, isLight ? "black" : "white")
        .replace(/white/g, isLight ? "white" : "black");
      if (!isLight) {
        result = result.replace(/rgba\(0,0,0,1\)/g, "rgba(255,255,255,1)");
      }
      return result;
    };

    const borderClass = replaceColorPlaceholders(profile.borderClass, isLightBg);
    const cardClass = replaceColorPlaceholders(profile.cardClass, isLightBg);
    const lineClass = isLightBg ? "border-black/10" : "border-white/10";

    // Setup background gradient based on style profile
    const bgStyle = profile.bgStyle;
    const blendedBg = blendColors(colorBg, colorPrimary, 0.08);
    
    const backgroundCssStyle = bgStyle === "solid"
      ? `background-color: ${colorBg};`
      : bgStyle === "linear-gradient-vertical"
      ? `background: linear-gradient(180deg, ${colorBg} 0%, ${blendedBg} 100%);`
      : bgStyle === "linear-gradient-diagonal"
      ? `background: linear-gradient(135deg, ${colorBg} 0%, ${blendedBg} 100%);`
      : `background: radial-gradient(circle at top left, ${colorBg} 0%, ${blendedBg} 100%);`;

    // Server-side only — never expose this key to the client bundle
    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const cwd = process.cwd();
      const envPath = path.join(cwd, ".env");
      const envExists = fs.existsSync(envPath);
      let envContentSummary = "";
      if (envExists) {
        try {
          const lines = fs.readFileSync(envPath, "utf-8").split("\n");
          envContentSummary = lines
            .map(line => {
              const parts = line.split("=");
              if (parts[0]) {
                return `${parts[0].trim()} (len: ${parts[1] ? parts[1].trim().length : 0})`;
              }
              return "";
            })
            .filter(Boolean)
            .join(", ");
        } catch (e: any) {
          envContentSummary = `error reading: ${e.message}`;
        }
      }

      console.error("Gemini API key is missing. Debug info:", {
        cwd,
        envExists,
        envContentSummary,
        importMetaEnvKeys: Object.keys(import.meta.env)
      });

      return new Response(
        JSON.stringify({ 
          error: "Gemini API key is not configured on the server.",
          debug: {
            cwd,
            envExists,
            envContentSummary,
            importMetaEnvKeys: Object.keys(import.meta.env)
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
You are an elite graphic designer and frontend developer specializing in ultra-premium, high-converting LinkedIn and Instagram carousels.
Your style is minimal, luxurious, and highly intellectual—similar to top agency-grade social media decks (e.g., dark layouts, fine lines, elegant typography pairings, and generous whitespace).

Brand Details:
- Brand Name: ${brandName}
- Visual Vibe: ${vibe}
- Voice Tone: ${tone}
- Primary Accent Color: ${colorPrimary} (Use as accent/highlight color)
- Background Canvas Color: ${colorBg} (Use as main background canvas color)
${logoUrl ? `- Brand Logo URL: ${logoUrl}` : ''}
${brandContext ? `- Brand Context (Audience): ${brandContext}` : ''}
${website ? `- Website URL: ${website}` : ''}

Topic of the Carousel: "${topic}"
Length: 5-7 slides.
Aspect ratio: ${aspectRatio}

--------------------------------------------------
REQUIRED TYPOGRAPHY STYLE FOR THIS DECK (MANDATORY):
We have imported five fonts. To ensure brand consistency across all slides, this carousel MUST strictly use the "${profile.fontName}" visual theme:
- Heading / Title Style: Use classes "${profile.headingClass}".
  Description: ${profile.headingDesc}
- Body / Paragraph Style: Use classes "${profile.bodyClass}".
  Description: ${profile.bodyDesc}

Strictly use the Heading Style for all major headings, slide titles, large callouts, and statistics.
Strictly use the Body/Paragraph Style for all descriptions, bullet points, labels, and small text.
To make headings feel premium, you may wrap key words inside "<span class='text-[var(--color-primary)] font-semibold' style='color: ${colorPrimary}'>...</span>" or add subtle italic touches if using a serif font.

--------------------------------------------------
BRAND LAYOUT MOTIF / DESIGN LANGUAGE (MANDATORY):
To align with the brand vibe "${vibe}", you MUST strictly adopt this design language:
- Theme motif: ${profile.layoutStyle}

--------------------------------------------------
DYNAMIC COLOR CONTRAST RULES:
To support any background color (including bright greens, yellows, etc.), use the following pre-compiled Tailwind classes:
- Main Titles/Headers: "${textPrimaryClass}"
- Body text & descriptions: "${textSecondaryClass}"
- Muted labels, indicators, headers/footers: "${textMutedClass}"
- Borders / Outlines: "${borderClass}" (use for badges, borders)
- Highlight Cards: "${cardClass}" (use for container boxes)
- Separator Lines: "${lineClass}" (use for hr/div lines)

NEVER use flat grey colors like "text-neutral-400" or "text-gray-500". Use the exact classes provided above—they utilize HSL/RGB opacity to blend with the background color seamlessly!

--------------------------------------------------
CRITICAL LAYOUT RULES FOR PREMIUMNESS (NO OVERLAPPING & GENEROUS WHITESPACE):
1. Root Container: Every slide HTML must have a root wrapper with:
   - CSS classes: "relative w-full h-full p-8 flex flex-col justify-between overflow-hidden"
   - Style: style="${backgroundCssStyle} color: ${textColor};"
2. Header & Footer (Must be present on every slide for branding continuity):
   - TOP HEADER: A thin horizontal layout with:
     - Left: A tiny uppercase category tag (e.g., "SLIDE 01 — WHAT IS SEO" or "SAAS SECRETS").
     - Right: Page indicator (e.g., "01 / 05") in tracked monospace font: "text-[10px] tracking-widest ${textMutedClass} font-mono".
   - BOTTOM FOOTER:
     - Left: Brand name in spaced-out letters: "<span class='text-[10px] uppercase font-bold tracking-[0.25em] ${textMutedClass}'>${brandName.toUpperCase()}</span>".
     - Right: Website URL (or brand handle) in the same tracked style: "<span class='text-[10px] uppercase font-bold tracking-[0.2em] ${textMutedClass}'>${website || `@${brandName.replace(/\s+/g, '').toLowerCase()}`}</span>".
     - Center (Only on Hook slide): Subtle swipe indicator in the middle: "<span class='text-[9px] uppercase tracking-widest ${textMutedClass}'>SWIPE — IF YOU DARE</span>" or "SWIPE TO LEARN →".
3. Vertical Flow: Keep the middle content area perfectly centered.
   - Use a middle block: "<div class='flex-1 flex flex-col justify-center py-6 gap-4'> ... </div>"
   - Never use "absolute" positioning for main text paragraphs.
4. STRICT FONT BUDGET & OVERFLOW PREVENTION (CRITICAL):
   - Every slide has a fixed aspect ratio (width-to-height is ${aspectRatio}) and MUST NEVER spill text outside its boundaries or overlap elements.
   - Word count and text budgets are extremely strict:
     - Main Slide Heading: Maximum 6 words. Max 2 lines.
     - Paragraph/Body Text: Maximum 25 words total. Max 3 lines.
     - Highlight Card/Lesson Box Text: Maximum 15 words. Max 2 lines.
   - Enforce these strict font size classes (never use custom larger classes):
     - Main slide titles / headings: Use "text-xl md:text-2xl" (standard) or "text-lg md:text-xl" (if title is long).
     - Hook (cover) title: Use "text-2xl md:text-3xl" (maximum).
     - Paragraph/Body text: Use "text-[13px] md:text-sm leading-relaxed".
     - Badges, tiny tags, footers, headers: Use "text-[11px] md:text-xs tracking-wider uppercase font-bold".
   - Aspect Ratio Adaptation:
     - The aspect ratio is "${aspectRatio}". If aspect ratio is "1:1" (Square), vertical height is very short! Keep all paragraphs to 2 lines max, heading to 1 line, and card content to 1 line.
   - Add the class "break-words" to all text tags.

--------------------------------------------------
ABSOLUTELY NO CHEAP EMOJIS:
- NEVER use standard emojis (like ✅, ❌, 🔥, 🚀, 💡) as list bullets or icons. It cheapens the design immediately.
- Use elegant inline SVGs or clean text-based tags:
  - Mini Badge: "<span class='inline-block text-[9px] uppercase font-black tracking-widest ${textPrimaryClass} px-2 py-0.5 border ${borderClass} mb-1'>LESSON 01 OF 04</span>"
  - Highlight Card: For key lessons, use a subtle dark or light box with a nested label:
    "<div class='${cardClass} border p-4 rounded-none mt-2'><span class='text-[9px] uppercase tracking-widest font-bold text-[var(--color-primary)] mb-1 block' style='color: ${colorPrimary}'>THE REAL LESSON</span><p class='text-sm ${textSecondaryClass} font-light leading-relaxed'>Funding is not validation. Build real infrastructure first.</p></div>"
  - Separators: Simple thin lines "<hr class='border-t ${lineClass} my-2 w-12' />" to divide sections.

--------------------------------------------------
LAYOUT DIVERSITY INSTRUCTIONS:
Do NOT make every slide look identical in layout structure. Introduce layout variety:
- Use split layouts (e.g. left column for title, right column for cards) for at least one content slide.
- Use bento-grid layouts (e.g. grid with unequal columns) for the tip slide.
- Introduce numbered lists with massive decorative numbers (e.g., "01", "02") in the Heading style.

--------------------------------------------------
SLIDE TEMPLATES:
Generate a refined sequence of these specific slides:
1. "hook" (Cover): A minimal, striking title slide. A large centered title with high-contrast font pairing, a category pill at the top, and bottom branding + swipe indicator. Keep the title inside a single, cohesive, block-aligned heading element (e.g. h1 or h2). Do NOT split different words of the title into separate, independent divs or float them around.
2. "content" (Insight/Bento): A lesson slide. Tiny badge -> Large uppercase heading -> Thin line separator -> 3-4 lines of punchy paragraph content -> A premium highlight card at the bottom.
3. "stat" (Credibility): A giant stat slide. A huge colored statistic (e.g., "90%", "10X", "4.2M") in "text-6xl md:text-7xl font-extrabold leading-none" in the Heading style -> Under it, a short sentence explaining the metric -> A clean content box with structural details.
4. "quote" (Thought Leadership): A beautiful centralized quote. Giant quotation mark -> Quote text in italic leading-relaxed text in the Heading Style -> Author details in small tracking-wider font.
5. "tip" (Actionable Value): A beautiful box with a primary accent border. Contains a checklist or warning, using clean inline SVGs for checks/crosses (no emojis).
6. "cta" (Call to Action): A minimalist end slide. Centralized header -> A beautifully simple outline button ("style='border-color: ${colorPrimary}'") -> Subtle prompt to save/share.

--------------------------------------------------
OUTPUT FORMAT:
Return the result STRICTLY as a JSON object with the following structure:
{
  "imageKeywords": "strictly 1 or 2 comma-separated keywords chosen ONLY from this approved list: ['workspace', 'office', 'computer', 'servers', 'datacenter', 'analytics', 'finance', 'meeting', 'creative', 'design', 'minimal', 'healthcare', 'medical', 'education', 'book', 'writing']. Choose keywords that represent the physical or visual setting of the topic (e.g. for tech/coding use 'computer' or 'servers' or 'datacenter'; for business/agency use 'workspace' or 'office' or 'meeting'; for marketing use 'analytics'; for finance use 'finance'). DO NOT use any generic words outside this list (like 'infrastructure', 'architecture', 'platform', 'agency') as they fetch unrelated physical photos.",
  "slides": [
    { "type": "hook", "html": "<div class='relative w-full h-full p-8 flex flex-col justify-between overflow-hidden' style='${backgroundCssStyle} color: ${textColor};'>...</div>" }
  ]
}
Do not include markdown code block formatting (like \`\`\`json).

Ensure the HTML matches the brand colors, uses the typography pairings, has large spacing, and looks incredibly premium.
    `.trim();

    let responseText = "";
    let retries = 3;

    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; // Success, exit retry loop
      } catch (err: any) {
        console.error("Gemini API error:", err.message || err);
        
        // If it's a 503 (service unavailable) or 429 (rate limit), retry.
        const isRetryable = err.message && (err.message.includes("503") || err.message.includes("429"));
        
        if (isRetryable && retries > 1) {
          console.warn(`Gemini 503/429 error. Retrying in 2 seconds... (${retries - 1} left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw err;
        }
      }
    }

    // Clean up potential markdown formatting from the response
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }

    const parsed = JSON.parse(cleanJson.trim());
    let rawSlides: any[] = [];
    let imageKeywords = "";

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      rawSlides = parsed.slides || [];
      imageKeywords = parsed.imageKeywords || "";
    } else if (Array.isArray(parsed)) {
      rawSlides = parsed;
    }

    // Resolve the initial background image using the keywords from Gemini
    const { url: bgImageUrl, query: resolvedQuery } = await resolveInitialImage(industry, topic, imageKeywords);

    // Inject the background div into each slide HTML
    const processedSlides = rawSlides.map((slide: any, index: number) => {
      if (slide.html) {
        const rootDivEndIndex = slide.html.indexOf(">");
        if (rootDivEndIndex !== -1) {
          const bgStyle = getBgStyleForSlide(index);
          const bgDiv = `<div style="${bgStyle}"></div>`;
          slide.html = slide.html.substring(0, rootDivEndIndex + 1) + bgDiv + slide.html.substring(rootDivEndIndex + 1);
        }
      }
      return slide;
    });

    return new Response(JSON.stringify({ slides: processedSlides, bgImageUrl, imageQuery: resolvedQuery }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error: any) {
    console.error("Error generating carousel:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate carousel" }),
      { status: 500 }
    );
  }
};
