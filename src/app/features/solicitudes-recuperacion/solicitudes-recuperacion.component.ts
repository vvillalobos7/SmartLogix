import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SolicitudRecuperacion } from '../../shared/models/models';

@Component({
  selector: 'app-solicitudes-recuperacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-recuperacion.component.html',
})
export class SolicitudesRecuperacionComponent implements OnInit {
  solicitudes: SolicitudRecuperacion[] = [];
  filtroEstado = '';
  cargando = false;
  procesando: string | null = null;
  motivoRechazo = '';
  showRechazarModal = false;
  solicitudArechazar: SolicitudRecuperacion | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.authService.getSolicitudesRecuperacion(this.filtroEstado || undefined).subscribe(data => {
      this.solicitudes = data;
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  aprobar(s: SolicitudRecuperacion): void {
    if (!confirm(`¿Aprobar la solicitud de recuperación de ${s.correo}?`)) return;
    this.procesando = s.id;
    this.authService.resolverSolicitud(s.id, 'aprobar').subscribe({
      next: () => {
        this.toast.success('Solicitud aprobada', `Se aprobó la recuperación para ${s.correo}.`);
        this.procesando = null;
        this.cargar();
      },
      error: () => {
        this.toast.error('Error', 'No se pudo aprobar la solicitud.');
        this.procesando = null;
        this.cdr.detectChanges();
      },
    });
  }

  abrirRechazar(s: SolicitudRecuperacion): void {
    this.solicitudArechazar = s;
    this.motivoRechazo = '';
    this.showRechazarModal = true;
  }

  confirmarRechazo(): void {
    if (!this.solicitudArechazar) return;
    const s = this.solicitudArechazar;
    this.procesando = s.id;
    this.showRechazarModal = false;
    this.authService.resolverSolicitud(s.id, 'rechazar', this.motivoRechazo || undefined).subscribe({
      next: () => {
        this.toast.success('Solicitud rechazada', `Se rechazó la solicitud de ${s.correo}.`);
        this.procesando = null;
        this.solicitudArechazar = null;
        this.cargar();
      },
      error: () => {
        this.toast.error('Error', 'No se pudo rechazar la solicitud.');
        this.procesando = null;
        this.cdr.detectChanges();
      },
    });
  }

  getEstadoBadge(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada:  'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
