import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  titulo: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(titulo: string, mensaje = '') { this.add('success', titulo, mensaje); }
  warning(titulo: string, mensaje = '') { this.add('warning', titulo, mensaje); }
  error(titulo: string, mensaje = '')   { this.add('error',   titulo, mensaje); }
  info(titulo: string, mensaje = '')    { this.add('info',    titulo, mensaje); }

  remove(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(tipo: ToastTipo, titulo: string, mensaje: string): void {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, tipo, titulo, mensaje }]);
    setTimeout(() => this.remove(id), 5000);
  }
}
