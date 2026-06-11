import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
    }

    // Basic URL validation & formatting
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch website content
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch website" }), { status: 400 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract useful information
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim() || '';
    
    // Extract paragraphs to get an idea of the content
    let paragraphs: string[] = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) { // filter out very short, meaningless paragraphs
        paragraphs.push(text);
      }
    });

    // Take top 5 paragraphs max to avoid huge payload
    const mainText = paragraphs.slice(0, 5).join(' ');

    const brandContext = `
      Title: ${title}
      Description: ${description}
      Summary: ${mainText}
    `.trim().substring(0, 1000); // cap length

    return new Response(JSON.stringify({ 
      success: true, 
      context: brandContext 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to analyze website" }), { status: 500 });
  }
};
