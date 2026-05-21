import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  trackById(_: number, t: Toast): number { return t.id; }

  colorClass(tipo: Toast['tipo']): string {
    return {
      success: 'bg-white border-l-4 border-green-500',
      warning: 'bg-white border-l-4 border-yellow-500',
      error:   'bg-white border-l-4 border-red-500',
      info:    'bg-white border-l-4 border-blue-500',
    }[tipo];
  }

  iconClass(tipo: Toast['tipo']): string {
    return {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error:   'text-red-500',
      info:    'text-blue-500',
    }[tipo];
  }

  iconPath(tipo: Toast['tipo']): string {
    return {
      success: 'M5 13l4 4L19 7',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      error:   'M6 18L18 6M6 6l12 12',
      info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }[tipo];
  }
}
