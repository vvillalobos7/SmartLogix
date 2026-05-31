import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductoService } from './producto.service';
import { InventarioService } from '../inventario/inventario.service';
import { BehaviorSubject, of } from 'rxjs';
import { Producto, Categoria, Bodega, Pasillo, Estante } from '../../shared/models/models';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;

  let productoServiceSpy: any;
  let inventarioServiceSpy: any;

  let productosSubject: BehaviorSubject<Producto[]>;
  let categoriasSubject: BehaviorSubject<Categoria[]>;
  let bodegasSubject: BehaviorSubject<Bodega[]>;
  let pasillosSubject: BehaviorSubject<Pasillo[]>;
  let estantesSubject: BehaviorSubject<Estante[]>;

  beforeEach(async () => {
    productosSubject = new BehaviorSubject<Producto[]>([]);
    categoriasSubject = new BehaviorSubject<Categoria[]>([]);
    bodegasSubject = new BehaviorSubject<Bodega[]>([]);
    pasillosSubject = new BehaviorSubject<Pasillo[]>([]);
    estantesSubject = new BehaviorSubject<Estante[]>([]);

    productoServiceSpy = {
      productos$: productosSubject.asObservable(),
      categorias$: categoriasSubject.asObservable(),
      getCategorias: vi.fn().mockReturnValue(of([])),
      getAll: vi.fn().mockReturnValue(of([])),
      create: vi.fn().mockReturnValue(of({ id: '1' })),
      update: vi.fn().mockReturnValue(of({ id: '1' })),
      delete: vi.fn().mockReturnValue(of({})),
      toggleActivo: vi.fn().mockReturnValue(of({})),
      subirImagen: vi.fn().mockReturnValue(of({})),
      eliminarImagen: vi.fn().mockReturnValue(of({})),
      createCategoria: vi.fn().mockReturnValue(of({})),
      updateCategoria: vi.fn().mockReturnValue(of({})),
      deleteCategoria: vi.fn().mockReturnValue(of({})),
    };

    inventarioServiceSpy = {
      bodegas$: bodegasSubject.asObservable(),
      pasillos$: pasillosSubject.asObservable(),
      estantes$: estantesSubject.asObservable(),
      getBodegas: vi.fn().mockReturnValue(of([])),
      getPasillos: vi.fn().mockReturnValue(of([])),
      getEstantes: vi.fn().mockReturnValue(of([])),
      getPasillosByBodega: vi.fn().mockReturnValue(of([])),
      getEstantesByPasillo: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ProductosComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: ProductoService, useValue: productoServiceSpy },
        { provide: InventarioService, useValue: inventarioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Tabs and Filters', () => {
    it('should switch tabs', () => {
      expect(component.activeTab).toBe('productos');
      component.activeTab = 'categorias';
      expect(component.activeTab).toBe('categorias');
    });

    it('should filter products by name or category', () => {
      const mockProducts: Producto[] = [
        { id: '1', nombre: 'Laptop', precio: 100, stock: 10, categoriaId: 'c1', categoriaNombre: 'Electronica', activo: true },
        { id: '2', nombre: 'Silla', precio: 50, stock: 5, categoriaId: 'c2', categoriaNombre: 'Muebles', activo: true },
      ];
      productosSubject.next(mockProducts);

      component.filtro = 'Lap';
      expect(component.productosFiltrados.length).toBe(1);
      expect(component.productosFiltrados[0].nombre).toBe('Laptop');

      component.filtro = 'Muebles';
      expect(component.productosFiltrados.length).toBe(1);
      expect(component.productosFiltrados[0].nombre).toBe('Silla');
    });
  });

  describe('CRUD Operations for Products', () => {
    it('should initialize form on openNew', () => {
      component.openNew();
      expect(component.showModal).toBe(true);
      expect(component.editando).toBeNull();
      expect(component.form.valid).toBe(false); // empty forms are invalid
    });

    it('should initialize form with product details on openEdit', () => {
      const p: Producto = { id: '1', nombre: 'Laptop', precio: 100, stock: 10, categoriaId: 'c1', categoriaNombre: 'Electronica', idBodega: 1, activo: true };
      
      component.openEdit(p);
      
      expect(component.showModal).toBe(true);
      expect(component.editando).toEqual(p);
      expect(component.form.get('nombre')?.value).toBe('Laptop');
      expect(inventarioServiceSpy.getPasillosByBodega).toHaveBeenCalledWith(1);
    });

    it('should call create when submitting a new product', () => {
      component.openNew();
      component.form.patchValue({
        nombre: 'Nuevo Prod',
        precio: 1000,
        stock: 5,
        categoriaId: 'cat1',
        pais: 'Chile'
      });

      component.onSubmit();

      expect(productoServiceSpy.create).toHaveBeenCalled();
      expect(component.showModal).toBe(false);
    });

    it('should call update when submitting an edited product', () => {
      const p: Producto = { id: '1', nombre: 'Laptop', precio: 100, stock: 10, categoriaId: 'c1', categoriaNombre: 'Electronica', activo: true };
      component.openEdit(p);
      component.form.patchValue({
        nombre: 'Laptop Modificada'
      });

      component.onSubmit();

      expect(productoServiceSpy.update).toHaveBeenCalledWith('1', expect.any(Object));
      expect(component.showModal).toBe(false);
    });

    it('should toggle active state', () => {
      const p: Producto = { id: '1', nombre: 'Laptop', precio: 100, stock: 10, categoriaId: 'c1', categoriaNombre: 'Electronica', activo: true };
      component.toggleActivo(p);
      expect(productoServiceSpy.toggleActivo).toHaveBeenCalledWith('1');
    });
  });

  describe('Categories', () => {
    it('should count products by category', () => {
      const mockProducts: Producto[] = [
        { id: '1', nombre: 'P1', precio: 10, stock: 10, categoriaId: 'cat1', activo: true },
        { id: '2', nombre: 'P2', precio: 10, stock: 10, categoriaId: 'cat2', activo: true },
        { id: '3', nombre: 'P3', precio: 10, stock: 10, categoriaId: 'cat1', activo: true },
      ];
      productosSubject.next(mockProducts);

      expect(component.countProductosByCategoria('cat1')).toBe(2);
      expect(component.countProductosByCategoria('cat2')).toBe(1);
      expect(component.countProductosByCategoria('cat_empty')).toBe(0);
    });
  });
});
