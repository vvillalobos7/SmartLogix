import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AppTheme {
  id: string;
  label: string;
  swatch: string;
  sidebar: {
    bg: string;
    border: string;
    hover: string;
    active: string;
    text: string;
    subtext: string;
    accent: string;
    accentText: string;
  };
}

export const THEMES: AppTheme[] = [
  {
    id: 'esmeralda',
    label: 'Esmeralda',
    swatch: '#14532d',
    sidebar: {
      bg:         '#14532d',
      border:     '#166534',
      hover:      '#166534',
      active:     '#15803d',
      text:       '#bbf7d0',
      subtext:    '#4ade80',
      accent:     '#4ade80',
      accentText: '#14532d',
    },
  },
  {
    id: 'pizarra',
    label: 'Pizarra',
    swatch: '#1e293b',
    sidebar: {
      bg:         '#1e293b',
      border:     '#334155',
      hover:      '#334155',
      active:     '#475569',
      text:       '#cbd5e1',
      subtext:    '#94a3b8',
      accent:     '#38bdf8',
      accentText: '#0c4a6e',
    },
  },
  {
    id: 'indigo',
    label: 'Índigo',
    swatch: '#1e1b4b',
    sidebar: {
      bg:         '#1e1b4b',
      border:     '#312e81',
      hover:      '#312e81',
      active:     '#4338ca',
      text:       '#c7d2fe',
      subtext:    '#818cf8',
      accent:     '#818cf8',
      accentText: '#1e1b4b',
    },
  },
  {
    id: 'oceano',
    label: 'Océano',
    swatch: '#0c4a6e',
    sidebar: {
      bg:         '#0c4a6e',
      border:     '#075985',
      hover:      '#075985',
      active:     '#0284c7',
      text:       '#bae6fd',
      subtext:    '#38bdf8',
      accent:     '#38bdf8',
      accentText: '#0c4a6e',
    },
  },
  {
    id: 'violeta',
    label: 'Violeta',
    swatch: '#2e1065',
    sidebar: {
      bg:         '#2e1065',
      border:     '#4c1d95',
      hover:      '#4c1d95',
      active:     '#7c3aed',
      text:       '#ddd6fe',
      subtext:    '#a78bfa',
      accent:     '#a78bfa',
      accentText: '#2e1065',
    },
  },
  {
    id: 'carmesi',
    label: 'Carmesí',
    swatch: '#4c0519',
    sidebar: {
      bg:         '#4c0519',
      border:     '#881337',
      hover:      '#881337',
      active:     '#be123c',
      text:       '#fecdd3',
      subtext:    '#fb7185',
      accent:     '#fb7185',
      accentText: '#4c0519',
    },
  },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _current: AppTheme = THEMES[0];
  private readonly STORAGE_KEY = 'smartlogix-theme';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      const found = THEMES.find(t => t.id === saved);
      if (found) this._current = found;
    }
  }

  get current(): AppTheme { return this._current; }
  get themes(): AppTheme[] { return THEMES; }

  apply(theme: AppTheme): void {
    this._current = theme;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme.id);
    }
  }

  sidebarStyles(): Record<string, string> {
    const s = this._current.sidebar;
    return {
      'background-color': s.bg,
      'border-color':     s.border,
    };
  }

  sidebarBorderStyles(): Record<string, string> {
    return { 'border-color': this._current.sidebar.border };
  }

  navItemStyles(): Record<string, string> {
    return { 'color': this._current.sidebar.text };
  }

  navItemHoverStyles(): string {
    return this._current.sidebar.hover;
  }

  accentStyles(): Record<string, string> {
    return {
      'background-color': this._current.sidebar.accent,
      'color':            this._current.sidebar.accentText,
    };
  }

  subtextColor(): string { return this._current.sidebar.subtext; }
  activeColor(): string  { return this._current.sidebar.active; }
  accentColor(): string  { return this._current.sidebar.accent; }
  bgColor(): string      { return this._current.sidebar.bg; }
}
