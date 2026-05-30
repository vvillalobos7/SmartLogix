import { TestBed } from '@angular/core/testing';
import { ProductoService } from './producto.service';
import { Producto } from '../interfaces/models';
import { firstValueFrom } from 'rxjs';

describe('ProductoService', () => {
  let service: ProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductoService],
    });
    service = TestBed.inject(ProductoService);
  });

  it('should be created and return initial products list', async () => {
    expect(service).toBeTruthy();
    const productos = await firstValueFrom(service.getAll());
    expect(productos.length).toBe(6);
  });

  it('should return list of warehouses (bodegas)', () => {
    const bodegas = service.getBodegas();
    expect(bodegas.length).toBe(4);
    expect(bodegas[0].nombre).toBe('Bodega Norte');
  });

  it('should get a product by id', () => {
    const producto = service.getById(1);
    expect(producto).toBeDefined();
    expect(producto?.nombre).toBe('Smartphone Samsung Galaxy A54');
  });

  it('should create a new product and map its bodega property', async () => {
    const newProducto: Omit<Producto, 'id_producto'> = {
      sku: 'SKU-NEW',
      nombre: 'Teclado Mecanico',
      descripcion: 'Teclado RGB switch rojo',
      peso: 1.1,
      id_bodega: 2,
      bodega: '',
      precio: 150000,
      categoria: 'Electrónica'
    };

    service.create(newProducto);

    const productos = await firstValueFrom(service.getAll());
    const created = productos.find(p => p.sku === 'SKU-NEW');
    expect(created).toBeDefined();
    expect(created?.id_producto).toBeGreaterThan(6);
    expect(created?.bodega).toBe('Bodega Sur'); // mapped from id_bodega: 2
  });

  it('should update a product and map updated bodega if id_bodega changes', async () => {
    service.update(1, { nombre: 'Smartphone Modificado', id_bodega: 3 });

    const productos = await firstValueFrom(service.getAll());
    const updated = productos.find(p => p.id_producto === 1);
    expect(updated?.nombre).toBe('Smartphone Modificado');
    expect(updated?.bodega).toBe('Bodega Puerto'); // mapped from id_bodega: 3
  });

  it('should delete a product', async () => {
    service.delete(1);

    const productos = await firstValueFrom(service.getAll());
    const deleted = productos.find(p => p.id_producto === 1);
    expect(deleted).toBeUndefined();
    expect(productos.length).toBe(5);
  });
});
