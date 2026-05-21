import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrdenService } from '../ordenes/orden.service';
import { EstadoOrdenService } from '../ordenes/estado.service';
import { Orden, HistorialRequest, Estado } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-envios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './envios.component.html',
})
export class EnviosComponent implements OnInit {
  ordenes: Orden[] = [];
  estadosEnvio: Estado[] = [];
  filtroActivo: 'todos' | 'Aprobado' | 'En tránsito' | 'Entregado' | 'Cancelado' = 'todos';

  showModal = false;
  ordenSeleccionada: Orden | null = null;
  estadoForm!: FormGroup;
  guardando = false;

  private readonly estadosEnvioNombres = ['En tránsito', 'Entregado', 'Cancelado'];

  get esTransportista(): boolean {
    return this.authService.hasRole('transportista');
  }

  get esAdmin(): boolean {
    return this.authService.hasRole('admin', 'bodeguero');
  }

  get puedeActualizar(): boolean {
    return this.authService.hasRole('admin', 'bodeguero', 'transportista');
  }

  get aprobados(): Orden[] {
    return this.ordenes.filter(o => o.estadoActual === 'Aprobado');
  }

  get enTransito(): Orden[] {
    return this.ordenes.filter(o => o.estadoActual === 'En tránsito');
  }

  get entregados(): Orden[] {
    return this.ordenes.filter(o => o.estadoActual === 'Entregado');
  }

  get cancelados(): Orden[] {
    return this.ordenes.filter(o => o.estadoActual === 'Cancelado');
  }

  get ordenesFiltradas(): Orden[] {
    const relevantes = ['Aprobado', 'En tránsito', 'Entregado', 'Cancelado'];
    const base = this.ordenes.filter(o => relevantes.includes(o.estadoActual ?? ''));
    if (this.filtroActivo === 'todos') return base;
    return base.filter(o => o.estadoActual === this.filtroActivo);
  }

  constructor(
    private ordenService: OrdenService,
    private estadoOrdenService: EstadoOrdenService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.estadoOrdenService.getAll().subscribe(data => {
      this.estadosEnvio = data.filter(e => this.estadosEnvioNombres.includes(e.nombre));
    });
    this.ordenService.getAll().subscribe();
    this.ordenService.ordenes$.subscribe(o => {
      this.ordenes = o;
      this.cdr.markForCheck();
    });
  }

  initForm(): void {
    this.estadoForm = this.fb.group({
      estadoId:   ['', Validators.required],
      comentario: [''],
    });
  }

  setFiltro(f: typeof this.filtroActivo): void {
    this.filtroActivo = f;
  }

  abrirModal(o: Orden): void {
    this.ordenSeleccionada = o;
    this.initForm();
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.ordenSeleccionada = null;
    this.guardando = false;
  }

  onSubmit(): void {
    if (this.estadoForm.invalid || !this.ordenSeleccionada) return;
    this.guardando = true;
    const estadoId = this.estadoForm.value.estadoId as string;
    const estadoNombre = this.estadosEnvio.find(e => e.id === estadoId)?.nombre ?? estadoId;
    const dto: HistorialRequest = {
      estadoId,
      estadoNombre,
      comentario: this.estadoForm.value.comentario,
    };
    this.ordenService.agregarHistorial(this.ordenSeleccionada.id, dto).subscribe({
      next: () => this.cerrarModal(),
      error: () => { this.guardando = false; },
    });
  }

  getEstadoBadge(estado?: string): string {
    const map: Record<string, string> = {
      'Aprobado':    'bg-indigo-100 text-indigo-800',
      'En tránsito': 'bg-cyan-100 text-cyan-800',
      'Entregado':   'bg-green-100 text-green-800',
      'Cancelado':   'bg-red-100 text-red-800',
    };
    return map[estado ?? ''] ?? 'bg-gray-100 text-gray-600';
  }

  getEstadoIcono(estado?: string): string {
    const map: Record<string, string> = {
      'Aprobado':    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'En tránsito': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      'Entregado':   'M5 13l4 4L19 7',
      'Cancelado':   'M6 18L18 6M6 6l12 12',
    };
    return map[estado ?? ''] ?? 'M12 8v4m0 4h.01';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }
}
