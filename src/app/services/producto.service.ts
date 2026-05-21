import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto, Bodega } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {

  private bodegas: Bodega[] = [
    { id_bodega: 1, nombre: 'Bodega Norte',  direccion: 'Calle 80 # 45-12', ciudad: 'Bogotá',   activa: true },
    { id_bodega: 2, nombre: 'Bodega Sur',    direccion: 'Av. 68 # 12-34',   ciudad: 'Bogotá',   activa: true },
    { id_bodega: 3, nombre: 'Bodega Puerto', direccion: 'Zona Franca Lote 5',ciudad: 'Barranquilla', activa: true },
    { id_bodega: 4, nombre: 'Bodega Eje Cafetero', direccion: 'Carrera 23 # 19-01', ciudad: 'Manizales', activa: true },
  ];

  private mockData: Producto[] = [
    {
      id_producto: 1,
      sku: 'SKU-1001',
      nombre: 'Smartphone Samsung Galaxy A54',
      descripcion: 'Teléfono inteligente 256GB con pantalla AMOLED 6.4", cámara triple y batería de 5000mAh.',
      peso: 0.202,
      id_bodega: 1,
      bodega: 'Bodega Norte',
      precio: 1250000,
      categoria: 'Electrónica',
    },
    {
      id_producto: 2,
      sku: 'SKU-1002',
      nombre: 'Audífonos Sony WH-1000XM5',
      descripcion: 'Audífonos inalámbricos con cancelación de ruido, Bluetooth 5.2, autonomía 30 horas.',
      peso: 0.250,
      id_bodega: 1,
      bodega: 'Bodega Norte',
      precio: 980000,
      categoria: 'Electrónica',
    },
    {
      id_producto: 3,
      sku: 'SKU-2001',
      nombre: 'Silla Ergonómica Premium',
      descripcion: 'Silla de oficina ergonómica con soporte lumbar ajustable, reposabrazos 4D y malla transpirable.',
      peso: 14.5,
      id_bodega: 2,
      bodega: 'Bodega Sur',
      precio: 850000,
      categoria: 'Mobiliario',
    },
    {
      id_producto: 4,
      sku: 'SKU-2002',
      nombre: 'Monitor LG UltraWide 34"',
      descripcion: 'Monitor curvo ultrawide 3440x1440 IPS, 160Hz, compatible con AMD FreeSync.',
      peso: 7.2,
      id_bodega: 2,
      bodega: 'Bodega Sur',
      precio: 2100000,
      categoria: 'Electrónica',
    },
    {
      id_producto: 5,
      sku: 'SKU-3001',
      nombre: 'Caja de embalaje reforzada L',
      descripcion: 'Caja de cartón doble pared 60x40x30cm, resistencia 40kg, ideal para envíos nacionales.',
      peso: 0.8,
      id_bodega: 3,
      bodega: 'Bodega Puerto',
      precio: 8500,
      categoria: 'Embalaje',
    },
    {
      id_producto: 6,
      sku: 'SKU-4001',
      nombre: 'Termo Stanley Adventure 1L',
      descripcion: 'Termo de acero inoxidable 1000ml, mantiene temperatura 24h frío / 12h calor.',
      peso: 0.540,
      id_bodega: 4,
      bodega: 'Bodega Eje Cafetero',
      precio: 185000,
      categoria: 'Hogar',
    },
  ];

  private productosSubject = new BehaviorSubject<Producto[]>(this.mockData);
  productos$ = this.productosSubject.asObservable();

  getBodegas(): Bodega[] {
    return this.bodegas;
  }

  getAll(): Observable<Producto[]> {
    return this.productos$;
  }

  getById(id: number): Producto | undefined {
    return this.productosSubject.value.find(p => p.id_producto === id);
  }

  create(producto: Omit<Producto, 'id_producto'>): void {
    const current = this.productosSubject.value;
    const newId = Math.max(...current.map(p => p.id_producto), 0) + 1;
    const bodega = this.bodegas.find(b => b.id_bodega === +producto.id_bodega);
    const newProducto: Producto = {
      ...producto,
      id_producto: newId,
      bodega: bodega?.nombre ?? '',
    };
    this.productosSubject.next([...current, newProducto]);
  }

  update(id: number, changes: Partial<Producto>): void {
    const current = this.productosSubject.value;
    const bodega = changes.id_bodega
      ? this.bodegas.find(b => b.id_bodega === +changes.id_bodega!)
      : undefined;
    const updated = current.map(p =>
      p.id_producto === id
        ? { ...p, ...changes, bodega: bodega?.nombre ?? p.bodega }
        : p
    );
    this.productosSubject.next(updated);
  }

  delete(id: number): void {
    this.productosSubject.next(
      this.productosSubject.value.filter(p => p.id_producto !== id)
    );
  }
}
