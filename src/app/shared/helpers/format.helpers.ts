// ──────────────────────────────────────────────────────────────────────────────
// SmartLogix — Shared formatting helpers
// Centralises badge, currency and date formatting previously duplicated
// across dashboard, ordenes, envios, perfil, productos and usuarios.
// ──────────────────────────────────────────────────────────────────────────────

/** CSS badge classes for order states */
const ESTADO_BADGE_MAP: Record<string, string> = {
  'Pendiente':   'bg-yellow-100 text-yellow-800',
  'Procesando':  'bg-blue-100 text-blue-800',
  'Aprobado':    'bg-indigo-100 text-indigo-800',
  'En tránsito': 'bg-cyan-100 text-cyan-800',
  'Entregado':   'bg-green-100 text-green-800',
  'Cancelado':   'bg-red-100 text-red-800',
};

/** CSS badge classes for user roles */
const ROL_BADGE_MAP: Record<string, string> = {
  admin:         'bg-red-100 text-red-800',
  bodeguero:     'bg-blue-100 text-blue-800',
  transportista: 'bg-yellow-100 text-yellow-800',
  cliente:       'bg-green-100 text-green-800',
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-600';

export function getEstadoBadge(estado?: string): string {
  return ESTADO_BADGE_MAP[estado ?? ''] ?? DEFAULT_BADGE;
}

export function getRolBadge(rol?: string): string {
  return ROL_BADGE_MAP[rol ?? ''] ?? DEFAULT_BADGE;
}

export function formatCurrency(
  value: number,
  locale = 'es-CL',
  currency = 'CLP',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(iso?: string, locale = 'es-CL'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
