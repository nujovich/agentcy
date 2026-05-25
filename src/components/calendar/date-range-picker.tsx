'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  onGenerate: () => void;
  loading?: boolean;
}

export function DateRangePicker({ startDate, endDate, onChange, onGenerate, loading }: DateRangePickerProps) {
  const [mode, setMode] = useState<'week' | 'month' | 'custom'>('month');

  const presets = [
    { label: 'Esta semana', mode: 'week' as const, get: () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(now); mon.setDate(now.getDate() + diff);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
    }},
    { label: 'Este mes', mode: 'month' as const, get: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
    }},
    { label: 'Próximo mes', mode: 'custom' as const, get: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
    }},
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    const [s, e] = preset.get();
    onChange(s, e);
    setMode(preset.mode);
  };

  const totalDays = startDate && endDate
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Rango del calendario</h3>
        <div className="flex gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === p.mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-[10px] text-muted-foreground mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
        <span className="text-muted-foreground mt-5">→</span>
        <div className="flex-1">
          <label className="block text-[10px] text-muted-foreground mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
        <div className="flex flex-col items-center justify-end">
          <span className="text-[10px] text-muted-foreground">{totalDays} días</span>
          <button
            onClick={onGenerate}
            disabled={loading || !startDate || !endDate}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generando...' : '🎯 Generar calendario'}
          </button>
        </div>
      </div>
    </div>
  );
}