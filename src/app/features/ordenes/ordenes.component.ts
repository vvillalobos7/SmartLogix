import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrdenService } from './orden.service';
import { EstadoOrdenService } from './estado.service';
import { Orden, HistorialEntry, HistorialRequest, Estado } from '../../shared/models/models';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ordenes.component.html',
})
export class OrdenesComponent implements OnInit {
  ordenes: Orden[] = [];
  estadosDisponibles: Estado[] = [];
  filtroEstado = '';
  showDetalle = false;
  showHistorialModal = false;
  ordenDetalle: Orden | null = null;
  historialForm!: FormGroup;

  get estadoNombres(): string[] {
    return this.estadosDisponibles.map(e => e.nombre);
  }

  get ordenesFiltradas(): Orden[] {
    return this.filtroEstado
      ? this.ordenes.filter(o => o.estadoActual === this.filtroEstado)
      : this.ordenes;
  }

  countByEstado(estado: string): number {
    return this.ordenes.filter(o => o.estadoActual === estado).length;
  }

  constructor(
    private ordenService: OrdenService,
    private estadoOrdenService: EstadoOrdenService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initHistorialForm();
    this.estadoOrdenService.getAll().subscribe(data => {
      this.estadosDisponibles = data;
    });
    this.ordenService.getAll().subscribe();
    this.ordenService.ordenes$.subscribe(o => {
      this.ordenes = o;
      this.cdr.markForCheck();
    });
  }

  initHistorialForm(): void {
    this.historialForm = this.fb.group({
      estadoId:   ['', Validators.required],
      comentario: [''],
    });
  }

  openDetalle(o: Orden): void {
    this.ordenDetalle = o;
    this.showDetalle = true;
  }

  closeDetalle(): void {
    this.showDetalle = false;
    this.ordenDetalle = null;
  }

  openHistorial(o: Orden): void {
    this.ordenDetalle = o;
    this.initHistorialForm();
    this.showHistorialModal = true;
  }

  closeHistorial(): void {
    this.showHistorialModal = false;
  }

  onSubmitHistorial(): void {
    if (this.historialForm.invalid || !this.ordenDetalle) return;
    const estadoId = this.historialForm.value.estadoId as string;
    const estadoNombre = this.estadosDisponibles.find(e => e.id === estadoId)?.nombre ?? estadoId;
    const dto: HistorialRequest = {
      estadoId,
      estadoNombre,
      comentario: this.historialForm.value.comentario,
    };
    this.ordenService.agregarHistorial(this.ordenDetalle.id, dto).subscribe();
    this.closeHistorial();
  }

  getEstadoBadge(estado?: string): string {
    const map: Record<string, string> = {
      'Pendiente':   'bg-yellow-100 text-yellow-800',
      'Procesando':  'bg-blue-100 text-blue-800',
      'Aprobado':    'bg-indigo-100 text-indigo-800',
      'En tránsito': 'bg-cyan-100 text-cyan-800',
      'Entregado':   'bg-green-100 text-green-800',
      'Cancelado':   'bg-red-100 text-red-800',
    };
    return map[estado ?? ''] ?? 'bg-gray-100 text-gray-600';
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getHistorial(o: Orden): HistorialEntry[] {
    return o.historial ?? [];
  }
}
