import type { BrandProfile } from '@/types/brand-profile';

interface BrandProfileCardProps {
  profile: BrandProfile;
}

export function BrandProfileCard({ profile }: BrandProfileCardProps) {
  return (
    <div className="space-y-4">
      {/* Voz + Audiencia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold">Voz de marca</h3>
          <p className="text-sm text-muted-foreground">{profile.voice.tone}</p>
          <div className="flex flex-wrap gap-1">
            {profile.voice.personality.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-border px-2 py-0.5 text-xs"
              >
                {trait}
              </span>
            ))}
          </div>
          {profile.voice.avoidWords.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Evitar: {profile.voice.avoidWords.join(', ')}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold">Audiencia</h3>
          <p className="text-xs text-muted-foreground">
            {profile.audience.ageRange} · {profile.audience.location}
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.audience.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-border px-2 py-0.5 text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
          <ul className="space-y-1">
            {profile.audience.painPoints.map((point) => (
              <li key={point} className="text-xs text-muted-foreground">
                · {point}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Content Pillars */}
      <section className="rounded-lg border border-border p-4 space-y-2">
        <h3 className="text-sm font-semibold">Content Pillars</h3>
        <ol className="space-y-1">
          {profile.contentPillars.map((pillar, i) => (
            <li key={pillar} className="text-sm text-muted-foreground">
              {i + 1}. {pillar}
            </li>
          ))}
        </ol>
      </section>

      {/* Visual Kit + Competencia/Objetivos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold">Kit Visual</h3>
          <div className="flex flex-wrap gap-1">
            {[...profile.visualKit.primaryColors, ...profile.visualKit.secondaryColors].map(
              (color) => (
                <span
                  key={color}
                  className="inline-block size-6 rounded border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ),
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {profile.visualKit.fonts.join(', ')}
          </p>
          <p className="text-xs text-muted-foreground">{profile.visualKit.style}</p>
        </section>

        <section className="rounded-lg border border-border p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Competencia</h3>
            <p className="text-xs text-muted-foreground">{profile.competitors.join(', ')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Objetivos</h3>
            <ul className="space-y-0.5">
              {profile.goals.map((goal) => (
                <li key={goal} className="text-xs text-muted-foreground">
                  · {goal}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
