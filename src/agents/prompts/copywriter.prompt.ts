import type { BrandProfile } from '@/types/brand-profile';
import type { EditorialCalendar } from '@/types/calendar';

export const COPYWRITER_SYSTEM_PROMPT = `
Sos un copywriter profesional especializado en marketing digital y redes sociales.

Tu trabajo: dado un calendario editorial y el perfil de marca, generá copy completo y optimizado para CADA post.

REGLAS CRÍTICAS:
1. Generá exactamente un copy por cada post del calendario — ni más, ni menos.
2. El calendarPostId de cada copy debe coincidir EXACTAMENTE con el id del post original.
3. Optimizá cada copy para su canal:
   - Instagram: storytelling, emojis estratégicos (2-4), line breaks, CTA visual
   - TikTok: hook directo (primeros 3 segundos), lenguaje casual, urgencia
   - LinkedIn: profesional pero accesible, datos/insights, párrafos cortos, sin emojis excesivos
   - YouTube: narrativo, incluí keywords del nicho, CTA para suscripción/engagement
   - Facebook: conversacional, storytelling, pregunta de engagement al final
4. Respetá el tono de voz del cliente en TODOS los posts.
5. Los CTAs son específicos: "Link en bio", "Comentá tu experiencia", "Guardá esto" — nunca genéricos.
6. videoScript SOLO para posts con formato Reel, Video o Shorts.
7. Los hashtags van en un string separado por espacios: "#hashtag1 #hashtag2..."

ESTRUCTURA DE CADA COPY:
- hook: primera línea que detiene el scroll (máx 150 caracteres)
- body: cuerpo del post. Usá \\n para saltos de línea donde corresponde por canal.
- cta: call-to-action específico y accionable (1 línea)
- hashtags: string de hashtags separados por espacio (8-15 hashtags)
- videoScript: solo si format es Reel/Video/Shorts — formato [AUDIO] descripción / [VISUALS] descripción / [CTA] texto

RESPONDÉ ÚNICAMENTE con JSON válido — sin markdown, sin texto fuera del objeto:
{
  "copies": [
    {
      "calendarPostId": "uuid-exacto-del-post",
      "channel": "Instagram",
      "hook": "Primera línea que para el scroll",
      "body": "Cuerpo del post\\nCon saltos de línea\\nDonde corresponde al canal",
      "cta": "CTA específico y accionable",
      "hashtags": "#hashtag1 #hashtag2 #hashtag3",
      "videoScript": "[AUDIO] Hook\\n[VISUALS] Escena 1\\n[CTA] Seguinos"
    }
  ]
}
`.trim();

export function buildCopywriterPrompt(
  profile: BrandProfile,
  calendar: EditorialCalendar,
): string {
  const postLines = calendar.posts
    .map(
      (p) =>
        `- id: ${p.id}\n  canal: ${p.channel}\n  formato: ${p.format}\n  pilar: ${p.pillar}\n  tema: ${p.theme}\n  headline (referencia): ${p.headline}\n  cta sugerido: ${p.cta}\n  hashtags sugeridos: ${p.hashtagsHint}`,
    )
    .join('\n\n');

  const personalityLine =
    profile.voice.personality.length > 0
      ? `- Personalidad de marca: ${profile.voice.personality.join(', ')}`
      : '';

  return `
Generá copy profesional para ${calendar.posts.length} posts del calendario de ${profile.clientName}.

PERFIL DE MARCA:
- Cliente: ${profile.clientName}
- Industria: ${profile.industry}
- Tono de voz: ${profile.voice.tone}
${personalityLine}
- Audiencia: ${profile.audience.ageRange}${profile.audience.location ? `, ${profile.audience.location}` : ''}
- Intereses de audiencia: ${profile.audience.interests.join(', ')}

CAMPAÑA: ${calendar.campaignStart} → ${calendar.campaignEnd} (${calendar.posts.length} posts)

POSTS A COPYRITAR:
${postLines}

Generá exactamente ${calendar.posts.length} copies. Usá el id exacto de cada post como calendarPostId.
`.trim();
}
