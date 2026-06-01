import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { OrdenService } from '../ordenes/orden.service';
import { InventarioService } from '../inventario/inventario.service';
import { ProductoService } from '../productos/producto.service';
import { UsuarioService } from '../usuarios/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { Orden, Bodega, Producto, Usuario } from '../../shared/models/models';
import { getEstadoBadge, formatCurrency, formatDate } from '../../shared/helpers/format.helpers';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  ordenes: Orden[] = [];
  bodegas: Bodega[] = [];
  productos: Producto[] = [];
  usuarios: Usuario[] = [];

  cargando = true;
  private readonly destroyRef = inject(DestroyRef);

  get ordenesHoy(): number {
    const hoy = new Date().toISOString().split('T')[0];
    return this.ordenes.filter(o => o.fechaOrden?.startsWith(hoy)).length;
  }

  get ordenesPendientes(): Orden[] {
    return this.filterByEstado('Pendiente');
  }

  get ordenesEnTransito(): Orden[] {
    return this.filterByEstado('En tránsito');
  }

  get ordenesEntregadas(): Orden[] {
    return this.filterByEstado('Entregado');
  }

  get bodegasActivas(): Bodega[] {
    return this.bodegas.filter(b => b.activa);
  }

  get productosActivos(): Producto[] {
    return this.productos.filter(p => p.activo);
  }

  get productosStockBajo(): Producto[] {
    return this.productos.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10);
  }

  get productosAgotados(): Producto[] {
    return this.productos.filter(p => (p.stock ?? 0) === 0);
  }

  get ordenesRecientes(): Orden[] {
    return [...this.ordenes]
      .sort((a, b) => new Date(b.fechaOrden ?? 0).getTime() - new Date(a.fechaOrden ?? 0).getTime())
      .slice(0, 6);
  }

  get resumenEstados(): { estado: string; cantidad: number; badge: string }[] {
    const estados = ['Pendiente', 'Procesando', 'Aprobado', 'En tránsito', 'Entregado', 'Cancelado'];
    return estados
      .map(e => ({ estado: e, cantidad: this.filterByEstado(e).length, badge: this.getEstadoBadge(e) }))
      .filter(e => e.cantidad > 0);
  }

  constructor(
    private ordenService: OrdenService,
    private inventarioService: InventarioService,
    private productoService: ProductoService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  private filterByEstado(estado: string): Orden[] {
    return this.ordenes.filter(o => o.estadoActual === estado);
  }

  get esCliente(): boolean {
    return this.authService.hasRole('cliente');
  }

  get esTransportista(): boolean {
    return this.authService.hasRole('transportista');
  }

  get esAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  get enviosAprobados(): Orden[] {
    return this.filterByEstado('Aprobado');
  }

  get enviosCancelados(): Orden[] {
    return this.filterByEstado('Cancelado');
  }

  get enviosRecientes(): Orden[] {
    return [...this.ordenes]
      .filter(o => ['Aprobado', 'En tránsito', 'Entregado', 'Cancelado'].includes(o.estadoActual ?? ''))
      .sort((a, b) => new Date(b.fechaOrden ?? 0).getTime() - new Date(a.fechaOrden ?? 0).getTime())
      .slice(0, 6);
  }

  ngOnInit(): void {
    if (this.esCliente) {
      this.ordenService.getMisOrdenes().subscribe();
    } else if (this.esTransportista) {
      this.ordenService.getAll().subscribe();
    } else {
      this.ordenService.getAll().subscribe();
      this.inventarioService.getBodegas().subscribe();
      this.productoService.getAll().subscribe();
      this.usuarioService.getAll().subscribe();

      this.inventarioService.bodegas$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => { this.bodegas = b; this.cdr.detectChanges(); });
      this.productoService.productos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => { this.productos = p; this.cdr.detectChanges(); });
      this.usuarioService.usuarios$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => { this.usuarios = u; this.cdr.detectChanges(); });
    }

    this.ordenService.ordenes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(o => { this.ordenes = o; this.cargando = false; this.cdr.detectChanges(); });
  }

  getEstadoBadge(estado?: string): string {
    return getEstadoBadge(estado);
  }

  formatCurrency(v: number): string {
    return formatCurrency(v);
  }

  formatDate(iso?: string): string {
    return formatDate(iso);
  }

  getTotalOrdenes(): number {
    return this.ordenes.reduce((sum, o) => sum + (o.total ?? 0), 0);
  }
}
