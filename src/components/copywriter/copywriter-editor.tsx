'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { CalendarPost } from '@/types/calendar';
import type { PostCopy, CopywritingProject } from '@/types/copywriter';

const VIDEO_FORMATS = new Set(['Reel', 'Video', 'Shorts']);

interface CopywriterEditorProps {
  project: CopywritingProject;
  posts: CalendarPost[];
  onSave: (copies: PostCopy[]) => Promise<void>;
  onCancel: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
}

export function CopywriterEditor({
  project,
  posts,
  onSave,
  onCancel,
}: CopywriterEditorProps) {
  // Sort copies to match posts order using calendarPostId so index-based access is safe
  const [copies, setCopies] = useState<PostCopy[]>(() =>
    posts.map((p) => {
      const found = project.copies.find((c) => c.calendarPostId === p.id);
      return (
        found ?? {
          calendarPostId: p.id,
          channel: p.channel,
          hook: '',
          body: '',
          cta: '',
          hashtags: '',
        }
      );
    }),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const currentPost = posts[selectedIndex];
  const currentCopy = copies[selectedIndex];

  if (!currentPost || !currentCopy) return null;

  function handleField(field: keyof PostCopy, value: string) {
    setCopies((prev) => {
      const next = [...prev];
      next[selectedIndex] = { ...next[selectedIndex]!, [field]: value };
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(copies);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar copy</h1>
          <p className="text-sm text-muted-foreground">
            {copies.length} posts — editá y guardá cuando estés listo para revisar.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            Cancelar
          </button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {/* Post list */}
        <aside
          className="col-span-1 rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <div
            className="p-3 border-b text-xs font-semibold"
            style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface-2)' }}
          >
            Posts ({copies.length})
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {posts.map((post, i) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="w-full text-left px-3 py-2.5 border-b text-xs transition-colors"
                style={{
                  borderColor: 'var(--brand-border)',
                  background:
                    selectedIndex === i
                      ? 'var(--brand-primary-soft)'
                      : undefined,
                  color:
                    selectedIndex === i
                      ? 'var(--brand-primary-dark)'
                      : undefined,
                }}
              >
                <p className="font-medium truncate">{post.channel}</p>
                <p className="text-[11px] opacity-70 truncate">{formatDate(post.date)} · {post.format}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="col-span-3 space-y-4">
          {/* Post context */}
          <div
            className="rounded-xl border p-4 text-xs grid grid-cols-3 gap-3"
            style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface-2)' }}
          >
            <div>
              <p className="font-medium text-muted-foreground">Canal</p>
              <p className="font-semibold mt-0.5">{currentPost.channel}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Formato</p>
              <p className="font-semibold mt-0.5">{currentPost.format}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Tema</p>
              <p className="font-semibold mt-0.5 truncate">{currentPost.theme}</p>
            </div>
          </div>

          <div
            className="rounded-xl border p-5 space-y-5"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            {/* Hook */}
            <div className="space-y-1.5">
              <label htmlFor="copy-hook" className="text-xs font-semibold">Hook (primera línea)</label>
              <input
                id="copy-hook"
                type="text"
                value={currentCopy.hook}
                onChange={(e) => handleField('hook', e.target.value)}
                maxLength={300}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                style={{ borderColor: 'var(--brand-border)' }}
                placeholder="Primera línea que detiene el scroll..."
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {currentCopy.hook.length}/300
              </p>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label htmlFor="copy-body" className="text-xs font-semibold">Body (cuerpo del post)</label>
              <textarea
                id="copy-body"
                value={currentCopy.body}
                onChange={(e) => handleField('body', e.target.value)}
                rows={5}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
                style={{ borderColor: 'var(--brand-border)' }}
                placeholder="Cuerpo del post..."
              />
            </div>

            {/* CTA */}
            <div className="space-y-1.5">
              <label htmlFor="copy-cta" className="text-xs font-semibold">CTA</label>
              <input
                id="copy-cta"
                type="text"
                value={currentCopy.cta}
                onChange={(e) => handleField('cta', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                style={{ borderColor: 'var(--brand-border)' }}
                placeholder="Link en bio | Comentá | Guardá esto..."
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <label htmlFor="copy-hashtags" className="text-xs font-semibold">Hashtags</label>
              <textarea
                id="copy-hashtags"
                value={currentCopy.hashtags}
                onChange={(e) => handleField('hashtags', e.target.value)}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
                style={{ borderColor: 'var(--brand-border)' }}
                placeholder="#hashtag1 #hashtag2 #hashtag3..."
              />
            </div>

            {/* Video script — only for Reel/Video/Shorts */}
            {VIDEO_FORMATS.has(currentPost.format) ? (
              <div className="space-y-1.5">
                <label htmlFor="copy-video-script" className="text-xs font-semibold">Script de video</label>
                <textarea
                  id="copy-video-script"
                  value={currentCopy.videoScript ?? ''}
                  onChange={(e) => handleField('videoScript', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
                  style={{ borderColor: 'var(--brand-border)' }}
                  placeholder="[AUDIO] Hook&#10;[VISUALS] Escena 1&#10;[CTA] Seguinos"
                />
              </div>
            ) : null}
          </div>

          {/* Live preview */}
          <div
            className="rounded-xl border p-5 space-y-2 text-sm"
            style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface-2)' }}
          >
            <p className="text-xs font-semibold text-muted-foreground">Preview</p>
            <p className="font-bold" style={{ color: 'var(--brand-primary)' }}>
              {currentCopy.hook}
            </p>
            <p className="whitespace-pre-wrap text-foreground">{currentCopy.body}</p>
            <p className="text-muted-foreground italic text-xs">{currentCopy.cta}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{currentCopy.hashtags}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
