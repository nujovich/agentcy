import type { BrandProfile } from '@/types/brand-profile';
import type { Strategy } from '@/types/strategy';

export const CALENDAR_SYSTEM_PROMPT = `
Sos un experto en gestión de redes sociales y planificación de contenido editorial.

Tu trabajo: generar exactamente 30 posts para un mes calendario como un objeto JSON.

REGLAS CRÍTICAS:
1. Generá EXACTAMENTE 30 posts — ni uno más, ni uno menos.
2. Distribuí los posts según las frecuencias de cada canal en channelStrategies.
3. Respetá los porcentajes de content mix (educational, promotional, entertaining, behind_the_scenes).
4. Usá los bestPostingTimes de cada canal para asignar los horarios.
5. Alternátes los formatos — nunca pongas 5 o más posts del mismo formato seguidos.
6. Alternátes los pilares a lo largo del mes — no agrupes todos los posts del mismo pilar.
7. Los headlines deben ser hooks reales y específicos — NADA genérico como "Tips de marketing" o "Contenido educativo".
8. Nunca pongas dos posts del mismo canal a la misma hora en el mismo día.
9. Las fechas deben estar dentro del mes solicitado (formato YYYY-MM-DD).
10. Los horarios en formato HH:MM (ej: "09:00", "13:30").

ESTRUCTURA DE CADA POST:
- date: string YYYY-MM-DD (dentro del mes solicitado)
- time: string HH:MM
- channel: uno de ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook']
- format: uno de ['Carousel', 'Reel', 'Story', 'Post', 'Video', 'Shorts']
- pillar: nombre del pilar de contenido (usar los pilares del cliente)
- theme: tema específico del post (2-6 palabras)
- contentType: uno de ['image', 'video', 'text', 'mixed']
- headline: hook real y específico (máx 80 caracteres, no genérico)
- description: descripción del contenido (2-3 oraciones)
- hashtagsHint: 3-5 hashtags relevantes separados por espacio
- cta: llamada a la acción concreta

DISTRIBUCIÓN DE FORMATOS POR CANAL:
- Instagram: Carousel, Reel, Story, Post
- TikTok: Video, Reel
- LinkedIn: Post, Carousel, Video
- YouTube: Video, Shorts
- Facebook: Post, Video, Carousel

RESPONDÉ ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "channel": "Instagram",
      "format": "Carousel",
      "pillar": "Nombre del pilar",
      "theme": "Tema específico",
      "contentType": "image",
      "headline": "Hook específico y atractivo que detiene el scroll",
      "description": "Descripción del contenido. Qué va a mostrar este post. Por qué le importa a la audiencia.",
      "hashtagsHint": "#hashtag1 #hashtag2 #hashtag3",
      "cta": "Acción concreta que queremos que tome el usuario"
    }
  ]
}

SOLO JSON VÁLIDO — sin markdown, sin texto fuera del objeto JSON.
`;

export function buildCalendarUserPrompt(
  profile: BrandProfile,
  strategy: Strategy,
  month: string,
  year: number,
): string {
  const channelLines = strategy.channelStrategies
    .map((ch) => `  - ${ch.name}: ${ch.frequency} (asignación: ${ch.allocation}%)`)
    .join('\n');

  const contentMixLines = [
    `  - Educativo: ${strategy.contentMix.educational}%`,
    `  - Promocional: ${strategy.contentMix.promotional}%`,
    `  - Entretenimiento: ${strategy.contentMix.entertaining}%`,
    `  - Behind the scenes: ${strategy.contentMix.behind_the_scenes}%`,
  ].join('\n');

  const pillarLines = strategy.contentPillars
    .map((p) => `  - ${p.name}: ${p.description}`)
    .join('\n');

  const bestTimesLines = Object.entries(strategy.bestPostingTimes)
    .map(([channel, times]) => `  - ${channel}: ${times.join(', ')}`)
    .join('\n');

  const goalsLine =
    profile.goals.length > 0 ? `\nObjetivos del cliente: ${profile.goals.join(', ')}` : '';

  const competitorsLine =
    profile.competitors.length > 0
      ? `\nCompetidores a diferenciarse: ${profile.competitors.join(', ')}`
      : '';

  const scenarioLine = strategy.selectedScenario
    ? `\nEscenario seleccionado: ${strategy.selectedScenario}`
    : '';

  return `
Generá exactamente 30 posts para el calendario editorial de ${month} (año ${year}).

CLIENTE:
- Nombre: ${profile.clientName}
- Industria: ${profile.industry}
- Tono de voz: ${profile.voice.tone}
${profile.voice.personality.length > 0 ? `- Personalidad: ${profile.voice.personality.join(', ')}` : ''}
- Audiencia: ${profile.audience.ageRange}${profile.audience.location ? `, ${profile.audience.location}` : ''}
- Intereses de la audiencia: ${profile.audience.interests.join(', ')}${goalsLine}${competitorsLine}${scenarioLine}

ESTRATEGIA DE CANALES (distribuír los 30 posts según estas frecuencias):
${channelLines}

MIX DE CONTENIDO (respetálo en el total de posts):
${contentMixLines}

PILARES DE CONTENIDO (alternárlos a lo largo del mes):
${pillarLines}

MEJORES HORARIOS POR CANAL (usárlos para asignar el time de cada post):
${bestTimesLines}

MES OBJETIVO: ${month}
AÑO: ${year}

IMPORTANTE:
- Todos los posts deben tener fechas dentro de ${month} (del ${month}-01 al ${month}-${new Date(year, parseInt(month.split('-')[1], 10), 0).getDate()})
- Distribuí los posts uniformemente a lo largo del mes
- Los headlines deben ser hooks reales y específicos para ${profile.clientName} — nada genérico
- Solo JSON válido, sin markdown.
`.trim();
}
