import { TestBed } from '@angular/core/testing';
import { ProductoService } from './producto.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Producto, Categoria } from '../../shared/models/models';
import { firstValueFrom } from 'rxjs';

describe('ProductoService (Feature)', () => {
  let service: ProductoService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProductoService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Products', () => {
    it('should retrieve all products and update behavior subject', async () => {
      const mockProducts: Producto[] = [
        { id: '1', nombre: 'P1', precio: 10, stock: 5 },
        { id: '2', nombre: 'P2', precio: 20, stock: 10 },
      ];

      const promise = firstValueFrom(service.getAll());
      const req = httpTestingController.expectOne(environment.services.productos);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);

      const products = await promise;
      expect(products).toEqual(mockProducts);
      expect(service.getSnapshot()).toEqual(mockProducts);
    });

    it('should fallback to empty array on getAll fail', async () => {
      const promise = firstValueFrom(service.getAll());
      const req = httpTestingController.expectOne(environment.services.productos);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const products = await promise;
      expect(products).toEqual([]);
    });

    it('should retrieve product by id', async () => {
      const mockProduct: Producto = { id: '1', nombre: 'P1', precio: 10, stock: 5 };

      const promise = firstValueFrom(service.getById('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);

      const product = await promise;
      expect(product).toEqual(mockProduct);
    });

    it('should throw error on getById fail', async () => {
      const promise = firstValueFrom(service.getById('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toThrow('Producto no encontrado');
    });

    it('should create product', async () => {
      const mockProduct: Producto = { id: '1', nombre: 'P1', precio: 10, stock: 5 };
      const dto = { nombre: 'P1', precio: 10, stock: 5, categoriaId: 'c1' };

      const promise = firstValueFrom(service.create(dto));
      const req = httpTestingController.expectOne(environment.services.productos);
      expect(req.request.method).toBe('POST');
      req.flush(mockProduct);

      const product = await promise;
      expect(product).toEqual(mockProduct);
    });

    it('should return null on create fail', async () => {
      const dto = { nombre: 'P1', precio: 10, stock: 5, categoriaId: 'c1' };

      const promise = firstValueFrom(service.create(dto));
      const req = httpTestingController.expectOne(environment.services.productos);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const product = await promise;
      expect(product).toBeNull();
    });

    it('should update product', async () => {
      const mockProduct: Producto = { id: '1', nombre: 'P1-updated', precio: 15, stock: 5 };
      const dto = { nombre: 'P1-updated', precio: 15, stock: 5, categoriaId: 'c1' };

      const promise = firstValueFrom(service.update('1', dto));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockProduct);

      const product = await promise;
      expect(product).toEqual(mockProduct);
    });

    it('should return null on update fail', async () => {
      const dto = { nombre: 'P1-updated', precio: 15, stock: 5, categoriaId: 'c1' };

      const promise = firstValueFrom(service.update('1', dto));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const product = await promise;
      expect(product).toBeNull();
    });

    it('should delete product', async () => {
      const promise = firstValueFrom(service.delete('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promise;
    });

    it('should handle delete fail gracefully', async () => {
      const promise = firstValueFrom(service.delete('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1`);
      req.flush('Error', { status: 500, statusText: 'Error' });

      await promise;
    });

    it('should toggle active status', async () => {
      const mockProduct: Producto = { id: '1', nombre: 'P1', precio: 10, stock: 5, activo: false };

      const promise = firstValueFrom(service.toggleActivo('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/toggle-activo`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockProduct);

      const product = await promise;
      expect(product).toEqual(mockProduct);
    });

    it('should return null on toggle fail', async () => {
      const promise = firstValueFrom(service.toggleActivo('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/toggle-activo`);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const product = await promise;
      expect(product).toBeNull();
    });

    it('should upload product image', async () => {
      const mockProduct: Producto = { id: '1', nombre: 'P1', precio: 10, stock: 5, imagenUrl: 'http://img.com' };
      const file = new File([''], 'filename.png', { type: 'image/png' });

      const promise = firstValueFrom(service.subirImagen('1', file));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/foto`);
      expect(req.request.method).toBe('POST');
      req.flush(mockProduct);

      const product = await promise;
      expect(product?.imagenUrl).toBe('http://img.com');
    });

    it('should return null on upload image fail', async () => {
      const file = new File([''], 'filename.png', { type: 'image/png' });

      const promise = firstValueFrom(service.subirImagen('1', file));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/foto`);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const product = await promise;
      expect(product).toBeNull();
    });

    it('should delete product image', async () => {
      const promise = firstValueFrom(service.eliminarImagen('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/foto`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promise;
    });

    it('should handle delete image fail gracefully', async () => {
      const promise = firstValueFrom(service.eliminarImagen('1'));
      const req = httpTestingController.expectOne(`${environment.services.productos}/1/foto`);
      req.flush('Error', { status: 500, statusText: 'Error' });

      await promise;
    });
  });

  describe('Categories', () => {
    it('should retrieve all categories', async () => {
      const mockCategories: Categoria[] = [
        { id: '1', nombre: 'C1' },
        { id: '2', nombre: 'C2' },
      ];

      const promise = firstValueFrom(service.getCategorias());
      const req = httpTestingController.expectOne(environment.services.categorias);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);

      const categories = await promise;
      expect(categories).toEqual(mockCategories);
    });

    it('should fallback to empty array on getCategorias fail', async () => {
      const promise = firstValueFrom(service.getCategorias());
      const req = httpTestingController.expectOne(environment.services.categorias);
      req.flush('Error', { status: 500, statusText: 'Error' });

      const categories = await promise;
      expect(categories).toEqual([]);
    });

    it('should create category', async () => {
      const mockCategory: Categoria = { id: 'c1', nombre: 'C1' };

      const promise = firstValueFrom(service.createCategoria({ nombre: 'C1' }));
      const req = httpTestingController.expectOne(environment.services.categorias);
      expect(req.request.method).toBe('POST');
      req.flush(mockCategory);

      const category = await promise;
      expect(category).toEqual(mockCategory);
    });

    it('should update category', async () => {
      const mockCategory: Categoria = { id: 'c1', nombre: 'C1-Updated' };

      const promise = firstValueFrom(service.updateCategoria('c1', { nombre: 'C1-Updated' }));
      const req = httpTestingController.expectOne(`${environment.services.categorias}/c1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockCategory);

      const category = await promise;
      expect(category).toEqual(mockCategory);
    });

    it('should delete category', async () => {
      const promise = firstValueFrom(service.deleteCategoria('c1'));
      const req = httpTestingController.expectOne(`${environment.services.categorias}/c1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promise;
    });
  });
});
