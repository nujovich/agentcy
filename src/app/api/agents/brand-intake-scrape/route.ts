import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import { z } from 'zod';

import { createProvider } from '@/agents/provider-registry';
import { createClient } from '@/lib/supabase/server';
import type { SimpleBrandProfile } from '@/types/brand-intake';

const bodySchema = z.object({
  url: z.string().url(),
});

const SCRAPE_SYSTEM_PROMPT = `
Sos un experto en análisis de marcas y sitios web.
Analizás el contenido HTML de un sitio web y extraés información para construir un perfil de marca.

Respondé ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "clientName": "nombre de la empresa",
  "industry": "industria o sector",
  "mainServices": "descripción de servicios principales en 1-2 líneas",
  "toneOfVoice": "tono de comunicación (formal/casual/técnico/creativo/inspirador)",
  "targetAudience": "descripción de la audiencia principal",
  "contentPillars": ["pilar1", "pilar2", "pilar3"]
}

Si no podés inferir un campo con confianza, usá string vacío o array vacío.
No incluyas explicaciones, solo el JSON.
`;

function extractSocialLinks(html: string): Record<string, string> {
  const $ = load(html);
  const socialLinks: Record<string, string> = {};

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.includes('instagram.com') && !socialLinks.instagram) {
      socialLinks.instagram = href;
    } else if (href.includes('linkedin.com') && !socialLinks.linkedin) {
      socialLinks.linkedin = href;
    } else if ((href.includes('twitter.com') || href.includes('x.com')) && !socialLinks.twitter) {
      socialLinks.twitter = href;
    } else if (href.includes('tiktok.com') && !socialLinks.tiktok) {
      socialLinks.tiktok = href;
    } else if (href.includes('facebook.com') && !socialLinks.facebook) {
      socialLinks.facebook = href;
    } else if (href.includes('youtube.com') && !socialLinks.youtube) {
      socialLinks.youtube = href;
    }
  });

  return socialLinks;
}

function extractMetaContent(html: string): { title: string; description: string } {
  const $ = load(html);
  const title =
    $('meta[property="og:title"]').attr('content') ??
    $('title').first().text() ??
    '';
  const description =
    $('meta[name="description"]').attr('content') ??
    $('meta[property="og:description"]').attr('content') ??
    '';
  return { title: title.trim(), description: description.trim() };
}

function extractBodyText(html: string, maxChars = 3000): string {
  const $ = load(html);
  // Remove script/style/nav/footer noise
  $('script, style, nav, footer, header').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text.substring(0, maxChars);
}

function stripCodeFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { url } = parsed.data;

  // SSRF protection
  const urlObj = new URL(url);
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
  }
  const blockedHostnames = ['localhost', '127.0.0.1', '0.0.0.0'];
  if (
    blockedHostnames.includes(urlObj.hostname) ||
    /^10\./.test(urlObj.hostname) ||
    /^192\.168\./.test(urlObj.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(urlObj.hostname)
  ) {
    return NextResponse.json({ error: 'Private/internal URLs are not allowed' }, { status: 400 });
  }

  try {
    // 1. Fetch HTML
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AgentcyBot/1.0; +https://agentcy.app)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchResponse.statusText}` },
        { status: 422 },
      );
    }

    const html = await fetchResponse.text();

    // 2. Extract data with cheerio
    const socialLinks = extractSocialLinks(html);
    const { title, description } = extractMetaContent(html);
    const bodyText = extractBodyText(html);

    // 3. Build prompt for Claude
    const userPrompt = `
Sitio web: ${url}
Título: ${title}
Meta description: ${description}

Contenido de la página:
${bodyText}

Redes sociales encontradas: ${JSON.stringify(socialLinks)}

Extraé el perfil de marca en JSON.
`;

    // 4. Call Claude via provider registry
    const provider = createProvider('anthropic', 'claude-sonnet-4-6');
    const { text } = await provider.generateText({
      system: SCRAPE_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 800,
      temperature: 0.2,
    });

    // 5. Parse response
    const cleaned = stripCodeFences(text);

    const llmResponseSchema = z.object({
      clientName: z.string().optional().default(''),
      industry: z.string().optional().default(''),
      mainServices: z.string().optional().default(''),
      toneOfVoice: z.string().optional().default(''),
      targetAudience: z.string().optional().default(''),
      contentPillars: z.array(z.string()).optional().default([]),
    });

    let extracted: z.infer<typeof llmResponseSchema>;
    try {
      extracted = llmResponseSchema.parse(JSON.parse(cleaned));
    } catch (err) {
      throw err;
    }

    const profile: SimpleBrandProfile = {
      clientName: extracted.clientName ?? title,
      industry: extracted.industry ?? '',
      website: url,
      toneOfVoice: extracted.toneOfVoice ?? '',
      targetAudience: extracted.targetAudience ?? '',
      mainServices: extracted.mainServices ?? '',
      socialMedia: {
        instagram: socialLinks.instagram,
        linkedin: socialLinks.linkedin,
        tiktok: socialLinks.tiktok,
        twitter: socialLinks.twitter,
        facebook: socialLinks.facebook,
        youtube: socialLinks.youtube,
      },
      contentPillars: extracted.contentPillars ?? [],
    };

    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Scraping failed: ${message}` }, { status: 500 });
  }
}
