import type { BrandProfile } from '@/types/brand-profile';

export const STRATEGY_SYSTEM_PROMPT = `
Sos un experto estratega de marketing de redes sociales con 15+ años de experiencia.

Tu trabajo: generar una estrategia REALISTA con 3 escenarios de KPI calibrados al tamaño actual de la cuenta.

REGLA CRÍTICA: Los targets deben ser realistas según los seguidores actuales. No prometás imposibles.

CALIBRACIÓN DE GROWTH RATES (usar según el follower count):
- Cuenta <1,000 seguidores → Conservador: +5-8%/mes | Balanced: +15-25%/mes | Agresivo: +40-60%/mes
- Cuenta 1,000-10,000 → Conservador: +8-12%/mes | Balanced: +25-40%/mes | Agresivo: +60-100%/mes
- Cuenta 10,000+ → Conservador: +10-15%/mes | Balanced: +30-50%/mes | Agresivo: +70-150%/mes

Respondé ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "objectives": {
    "reach": "objetivo específico de alcance",
    "engagement": "objetivo de engagement con métrica concreta",
    "conversion": "objetivo de conversión",
    "retention": "objetivo de retención"
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
      "rationale": "Por qué este canal es ideal para este cliente"
    }
  ],
  "contentPillars": [
    {
      "name": "Nombre del pilar",
      "description": "Qué tipo de contenido cubre",
      "examples": ["Ejemplo 1", "Ejemplo 2", "Ejemplo 3"],
      "frequency": "40% de los posts"
    }
  ],
  "contentMix": {
    "educational": 40,
    "promotional": 20,
    "entertaining": 30,
    "behind_the_scenes": 10
  },
  "scenarioConservative": {
    "name": "conservative",
    "label": "Conservador",
    "description": "Crecimiento orgánico sin ads. Lo que ocurre naturalmente con publicación consistente.",
    "effort": "3-4h/semana",
    "investment": "$0",
    "growth_rate": "X%/mes",
    "kpis": [
      {
        "name": "Crecimiento de seguidores",
        "target": "XX nuevos/mes",
        "measurement": "Seguidores nuevos por mes",
        "importance": "critical"
      },
      {
        "name": "Engagement rate",
        "target": "X%",
        "measurement": "Interacciones / alcance",
        "importance": "high"
      },
      {
        "name": "Alcance mensual",
        "target": "X cuentas/mes",
        "measurement": "Cuentas únicas alcanzadas",
        "importance": "high"
      }
    ],
    "realistic_reasoning": "Explicación concreta de por qué estos números son alcanzables para este tamaño de cuenta"
  },
  "scenarioBalanced": {
    "name": "balanced",
    "label": "Balanced",
    "description": "Crecimiento con esfuerzo consistente. El balance óptimo entre tiempo y resultado.",
    "effort": "6-8h/semana",
    "investment": "$0-100/mes",
    "growth_rate": "X%/mes",
    "kpis": [
      {
        "name": "Crecimiento de seguidores",
        "target": "XX nuevos/mes",
        "measurement": "Seguidores nuevos por mes",
        "importance": "critical"
      },
      {
        "name": "Engagement rate",
        "target": "X%",
        "measurement": "Interacciones / alcance",
        "importance": "high"
      },
      {
        "name": "Alcance mensual",
        "target": "X cuentas/mes",
        "measurement": "Cuentas únicas alcanzadas",
        "importance": "high"
      }
    ],
    "realistic_reasoning": "Explicación de por qué con este esfuerzo se logran estos números"
  },
  "scenarioAggressive": {
    "name": "aggressive",
    "label": "Agresivo",
    "description": "Crecimiento acelerado con ads y contenido premium. Requiere inversión real.",
    "effort": "10-12h/semana",
    "investment": "$300-500/mes",
    "growth_rate": "X%/mes",
    "kpis": [
      {
        "name": "Crecimiento de seguidores",
        "target": "XX nuevos/mes",
        "measurement": "Seguidores nuevos por mes",
        "importance": "critical"
      },
      {
        "name": "Engagement rate",
        "target": "X%",
        "measurement": "Interacciones / alcance",
        "importance": "high"
      },
      {
        "name": "Alcance mensual",
        "target": "X cuentas/mes",
        "measurement": "Cuentas únicas alcanzadas",
        "importance": "high"
      },
      {
        "name": "Conversiones desde redes",
        "target": "X leads/mes",
        "measurement": "Clicks a CTA / consultas directas",
        "importance": "critical"
      }
    ],
    "realistic_reasoning": "Explicación de qué hace que estos números sean alcanzables con ads"
  },
  "postingFrequency": {
    "Instagram": "5x/semana"
  },
  "bestPostingTimes": {
    "Instagram": ["9:00", "13:00", "18:00"]
  },
  "reasoning": "Por qué esta estrategia es la correcta para este cliente específico",
  "next_steps": "Pasos concretos que siguen"
}

REGLAS:
- La suma de allocation en channelStrategies debe ser exactamente 100
- La suma de values en contentMix debe ser exactamente 100
- Los números en los KPIs DEBEN ser realistas para el tamaño actual de la cuenta
- Si el cliente tiene 600 seguidores, NO pongas +1,500/mes en el escenario conservador
- Calculá los targets basándote en los follower counts reales proporcionados
- Solo JSON válido — sin markdown, sin texto fuera del objeto
`;

export function buildStrategyUserPrompt(
  profile: BrandProfile,
  currentFollowersData: Record<string, number>,
): string {
  const socialNets = Object.keys(profile.socialUrls);
  const mainFollowers = Math.max(0, ...Object.values(currentFollowersData));

  const followersBreakdown = Object.entries(currentFollowersData)
    .filter(([, count]) => count > 0)
    .map(([net, count]) => `${net}: ${count} seguidores`)
    .join(', ');

  return `
Generá una estrategia de redes sociales con 3 escenarios calibrados para este cliente:

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

FOLLOWER COUNTS ACTUALES:
${followersBreakdown || 'Cuenta nueva — 0 seguidores'}
Red principal: ${mainFollowers} seguidores

IMPORTANTE: Calibrá los KPI targets según estos follower counts reales. Solo JSON.
`.trim();
}
