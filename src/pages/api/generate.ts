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

const FONT_PAIRINGS = [
  {
    name: "Editorial Luxury",
    headingClass: "font-cormorant font-normal italic",
    bodyClass: "font-outfit font-light",
    headingDesc: "Elegant, high-end editorial serif. Headings should feel like a premium print magazine, often with italicized accents.",
    bodyDesc: "Sleek, high-fashion sans-serif."
  },
  {
    name: "Tech Minimalist",
    headingClass: "font-space font-bold tracking-tight",
    bodyClass: "font-outfit font-normal",
    headingDesc: "Modern, clean, geometric sans-serif. High-contrast, precise, and tech-forward.",
    bodyDesc: "Sleek, clean sans-serif."
  },
  {
    name: "Bold Impact",
    headingClass: "font-syne font-extrabold uppercase tracking-tight",
    bodyClass: "font-space font-medium",
    headingDesc: "Wide, heavy, highly expressive display font. Make headings punchy, short, and uppercase.",
    bodyDesc: "Clean geometric sans-serif."
  },
  {
    name: "Trendy Condense",
    headingClass: "font-bricolage font-black tracking-tight",
    bodyClass: "font-outfit font-light",
    headingDesc: "Bold, condensed, high-impact sans-serif with a modern startup/agency aesthetic.",
    bodyDesc: "Clean, light-weight sans-serif."
  }
];

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
      aspectRatio = "4/5"
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
    
    // Borders, badges, separator lines, and cards
    const borderClass = isLightBg ? "border-black/20 bg-black/5 text-black" : "border-white/20 bg-white/5 text-white";
    const cardClass = isLightBg ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/5";
    const lineClass = isLightBg ? "border-black/10" : "border-white/10";

    // Randomly select a font pairing for this generation to ensure diversity
    const fontPairing = FONT_PAIRINGS[Math.floor(Math.random() * FONT_PAIRINGS.length)];
    
    // Randomly choose background style
    const bgStyleOptions = ["solid", "linear-gradient-vertical", "linear-gradient-diagonal", "radial-gradient"];
    const bgStyle = bgStyleOptions[Math.floor(Math.random() * bgStyleOptions.length)];
    
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
We have imported five fonts. To ensure high variety across generations, this specific carousel MUST be designed with the "${fontPairing.name}" visual theme:
- Heading / Title Style: Use classes "${fontPairing.headingClass}".
  Description: ${fontPairing.headingDesc}
- Body / Paragraph Style: Use classes "${fontPairing.bodyClass}".
  Description: ${fontPairing.bodyDesc}

Strictly use the Heading Style for all major headings, slide titles, large callouts, and statistics.
Strictly use the Body/Paragraph Style for all descriptions, bullet points, labels, and small text.
To make headings feel premium, you may wrap key words inside "<span class='text-[var(--color-primary)] font-semibold' style='color: ${colorPrimary}'>...</span>" or add subtle italic touches if using a serif font.

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
   - Every slide has a fixed aspect ratio and must never spill text outside its boundaries.
   - NEVER use "text-5xl", "text-6xl", "text-7xl", or larger for headings.
   - Maximum heading size on any slide is "text-3xl". Use "text-4xl" ONLY on the Hook slide if the title is 1-3 words max.
   - For long titles (4+ words) or titles containing long words (>8 characters like "CONVERTING", "LANDING"), you MUST restrict the heading font size to "text-2xl" or "text-3xl" max.
   - "font-syne" is extremely wide. If you use "font-syne", you MUST use "text-2xl" max for headings to prevent spilling over the slide border.
   - Add the class "break-words" to all heading tags.

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
Return the result STRICTLY as a JSON array of slide objects. Do not include markdown code block formatting (like \`\`\`json).
Example output:
[
  { "type": "hook", "html": "<div class='relative w-full h-full p-8 flex flex-col justify-between overflow-hidden' style='${backgroundCssStyle} color: ${textColor};'>...</div>" }
]

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

    const slides = JSON.parse(cleanJson.trim());

    return new Response(JSON.stringify({ slides }), {
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
