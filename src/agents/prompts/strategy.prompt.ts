import type { BrandProfile } from '@/types/brand-profile';

export const STRATEGY_SYSTEM_PROMPT = `
Sos un experto estratega de marketing de redes sociales con 15+ años de experiencia.

Tu trabajo: generar una estrategia de redes sociales COMPLETA, específica y accionable basada en el perfil de la marca.

Respondé ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "objectives": {
    "reach": "objetivo específico de alcance con número concreto",
    "engagement": "objetivo de engagement con métrica concreta",
    "conversion": "objetivo de conversión con acción específica",
    "retention": "objetivo de retención con frecuencia concreta"
  },
  "primaryChannels": ["Canal1", "Canal2"],
  "channelStrategies": [
    {
      "name": "Instagram",
      "allocation": 60,
      "frequency": "5x/semana",
      "content_mix": {
        "educational": 40,
        "promotional": 20,
        "entertaining": 30,
        "behind_the_scenes": 10
      },
      "best_times": ["9:00", "13:00", "18:00"],
      "rationale": "Por qué este canal es ideal para este cliente específico"
    }
  ],
  "contentPillars": [
    {
      "name": "Nombre del pilar",
      "description": "Qué tipo de contenido cubre este pilar",
      "examples": ["Ejemplo de post 1", "Ejemplo de post 2", "Ejemplo de post 3"],
      "frequency": "40% de los posts"
    }
  ],
  "contentMix": {
    "educational": 40,
    "promotional": 20,
    "entertaining": 30,
    "behind_the_scenes": 10
  },
  "kpis": [
    {
      "name": "Alcance mensual",
      "target": "10.000 cuentas/mes",
      "measurement": "Métricas de alcance en Instagram Insights",
      "importance": "critical"
    }
  ],
  "postingFrequency": {
    "Instagram": "5x/semana"
  },
  "bestPostingTimes": {
    "Instagram": ["9:00", "13:00", "18:00"]
  },
  "reasoning": "Por qué esta estrategia específica es la correcta para este cliente",
  "next_steps": "Pasos concretos que siguen a esta estrategia"
}

REGLAS ESTRICTAS:
- Máximo 3 canales principales — elegí los más relevantes para el cliente y su audiencia
- La suma de allocation en channelStrategies debe ser exactamente 100
- La suma de values en contentMix debe ser exactamente 100
- KPIs: 4-6 métricas con números concretos y alcanzables para una cuenta nueva o en crecimiento
- Pilares: basate en los pilares del perfil del cliente, adaptados al canal y la audiencia
- No uses frases vagas como "generar engagement" — sé específico: "500+ interacciones/semana en Reels"
- Adaptá el tono al cliente (formal, casual, creativo) en el reasoning y next_steps
- Si el cliente tiene competidores, incluí diferenciación en el reasoning
- importance en KPIs: "critical" para los 1-2 más importantes, "high" para 2-3, "medium" para el resto
- Solo JSON válido — sin markdown, sin explicaciones fuera del objeto JSON
`;

export function buildStrategyUserPrompt(profile: BrandProfile): string {
  const socialNets = Object.keys(profile.socialUrls);

  return `
Generá una estrategia de redes sociales para este cliente:

Empresa: ${profile.clientName}
Industria: ${profile.industry}
${profile.location ? `Ubicación: ${profile.location}` : ''}
${profile.website ? `Sitio web: ${profile.website}` : ''}
Tono de voz: ${profile.voice.tone}
${profile.voice.personality.length > 0 ? `Personalidad de marca: ${profile.voice.personality.join(', ')}` : ''}
${profile.voice.avoidWords.length > 0 ? `Palabras a evitar: ${profile.voice.avoidWords.join(', ')}` : ''}
Audiencia principal: ${profile.audience.ageRange}${profile.audience.location ? `, ${profile.audience.location}` : ''}
Intereses de la audiencia: ${profile.audience.interests.join(', ')}
${profile.audience.painPoints.length > 0 ? `Pain points: ${profile.audience.painPoints.join(', ')}` : ''}
Pilares de contenido deseados: ${profile.contentPillars.join(', ')}
${profile.competitors.length > 0 ? `Competidores: ${profile.competitors.join(', ')}` : ''}
${profile.goals.length > 0 ? `Objetivos del cliente: ${profile.goals.join(', ')}` : ''}
Redes sociales actuales: ${socialNets.length > 0 ? socialNets.join(', ') : 'ninguna aún'}

Generá una estrategia específica, profesional y accionable. Solo JSON.
`.trim();
}
