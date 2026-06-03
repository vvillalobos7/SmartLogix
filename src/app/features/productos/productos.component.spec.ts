import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductoService } from './producto.service';
import { InventarioService } from '../inventario/inventario.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
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

    it('should delete category if confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.deleteCategoria('cat1');
      expect(productoServiceSpy.deleteCategoria).toHaveBeenCalledWith('cat1');
      confirmSpy.mockRestore();
    });

    it('should not delete category if rejected', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteCategoria('cat1');
      expect(productoServiceSpy.deleteCategoria).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should open new and edit category modals', () => {
      component.openNewCategoria();
      expect(component.showCategoriaModal).toBe(true);
      expect(component.categoriaEditando).toBeNull();

      component.closeCategoriaModal();
      expect(component.showCategoriaModal).toBe(false);

      const c: Categoria = { id: 'c1', nombre: 'Cat1', descripcion: 'desc' };
      component.openEditCategoria(c);
      expect(component.showCategoriaModal).toBe(true);
      expect(component.categoriaEditando).toEqual(c);
      expect(component.categoriaForm.value.nombre).toBe('Cat1');
    });

    it('should submit category form', () => {
      component.openNewCategoria();
      component.categoriaForm.patchValue({ nombre: 'NewCat', descripcion: 'NewDesc' });
      component.onSubmitCategoria();
      expect(productoServiceSpy.createCategoria).toHaveBeenCalledWith({ nombre: 'NewCat', descripcion: 'NewDesc' });

      const c: Categoria = { id: 'c1', nombre: 'Cat1' };
      component.openEditCategoria(c);
      component.categoriaForm.patchValue({ nombre: 'Cat1Mod', descripcion: '' });
      component.onSubmitCategoria();
      expect(productoServiceSpy.updateCategoria).toHaveBeenCalledWith('c1', { nombre: 'Cat1Mod', descripcion: undefined });
    });

    it('should not submit category form if invalid', () => {
      component.openNewCategoria();
      component.categoriaForm.patchValue({ nombre: '' }); // required
      component.onSubmitCategoria();
      expect(productoServiceSpy.createCategoria).not.toHaveBeenCalled();
    });
  });

  describe('Location and Dropdowns', () => {
    it('should handle onBodegaChange', () => {
      component.openNew();
      component.form.patchValue({ idBodega: 12 });
      component.onBodegaChange();
      expect(inventarioServiceSpy.getPasillosByBodega).toHaveBeenCalledWith(12);

      component.form.patchValue({ idBodega: null });
      component.onBodegaChange();
      expect(component.pasillosFiltrados).toEqual([]);
    });

    it('should handle onPasilloChange', () => {
      component.openNew();
      component.form.patchValue({ idPasillo: 34 });
      component.onPasilloChange();
      expect(inventarioServiceSpy.getEstantesByPasillo).toHaveBeenCalledWith(34);

      component.form.patchValue({ idPasillo: null });
      component.onPasilloChange();
      expect(component.estantesFiltrados).toEqual([]);
    });

    it('should return location formatting (getUbicacion)', () => {
      component.bodegas = [{ idBodega: 1, nombre: 'Bodega Central', activa: true }];
      component.allPasillos = [{ idPasillo: 10, codigo: 'Pasillo A', idBodega: 1 }];
      component.allEstantes = [{ idEstante: 100, codigo: 'Estante 5' }];

      const p1: Producto = { id: '1', nombre: 'P1', precio: 1, stock: 1, categoriaId: 'c1', activo: true };
      const p2: Producto = { id: '2', nombre: 'P2', precio: 1, stock: 1, categoriaId: 'c1', idBodega: 1, activo: true };
      const p3: Producto = { id: '3', nombre: 'P3', precio: 1, stock: 1, categoriaId: 'c1', idBodega: 1, idPasillo: 10, activo: true };
      const p4: Producto = { id: '4', nombre: 'P4', precio: 1, stock: 1, categoriaId: 'c1', idBodega: 1, idPasillo: 10, idEstante: 100, activo: true };

      expect(component.getUbicacion(p1)).toBe('—');
      expect(component.getUbicacion(p2)).toBe('Bodega Central');
      expect(component.getUbicacion(p3)).toBe('Bodega Central › Pasillo A');
      expect(component.getUbicacion(p4)).toBe('Bodega Central › Pasillo A › Estante 5');

      // Fallback names
      const p5: Producto = { id: '5', nombre: 'P5', precio: 1, stock: 1, categoriaId: 'c1', idBodega: 99, idPasillo: 99, idEstante: 99, activo: true };
      expect(component.getUbicacion(p5)).toBe('B99 › P99 › E99');
    });
  });

  describe('Image Operations', () => {
    it('should open and close image modal', () => {
      const p: Producto = { id: '1', nombre: 'P1', precio: 1, stock: 1, categoriaId: 'c1', imagenUrl: 'img.jpg', activo: true };
      component.abrirImagenModal(p);
      expect(component.productoImagenId).toBe('1');
      expect(component.imagenPreview).toBe('img.jpg');
      expect(component.showImagenModal).toBe(true);

      component.cerrarImagenModal();
      expect(component.showImagenModal).toBe(false);
      expect(component.productoImagenId).toBeNull();
      expect(component.imagenFile).toBeNull();
      expect(component.imagenPreview).toBeNull();
    });

    it('should handle image selection and validations', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Invalid type
      const eventInvalidType = { target: { files: [new File([], 'test.txt', { type: 'text/plain' })] } } as any;
      component.onImagenSeleccionada(eventInvalidType);
      expect(alertSpy).toHaveBeenCalledWith('Solo se permiten archivos de imagen.');

      // Oversized file (6 MB)
      const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'test.png', { type: 'image/png' });
      const eventOversized = { target: { files: [oversizedFile] } } as any;
      component.onImagenSeleccionada(eventOversized);
      expect(alertSpy).toHaveBeenCalledWith('La imagen no puede superar 5 MB.');

      // Valid file
      const validFile = new File([], 'test.png', { type: 'image/png' });
      const eventValid = { target: { files: [validFile] } } as any;
      component.onImagenSeleccionada(eventValid);
      expect(component.imagenFile).toBe(validFile);

      alertSpy.mockRestore();
    });

    it('should upload image successfully', () => {
      const file = new File([], 'img.png');
      component.productoImagenId = '1';
      component.imagenFile = file;
      component.subirImagen();
      expect(component.subiendoImagen).toBe(false);
      expect(component.showImagenModal).toBe(false);
      expect(productoServiceSpy.subirImagen).toHaveBeenCalledWith('1', file);
    });

    it('should handle image upload error', () => {
      productoServiceSpy.subirImagen.mockReturnValue(throwError(() => new Error('Error uploading')));
      component.productoImagenId = '1';
      component.imagenFile = new File([], 'img.png');
      component.subirImagen();
      expect(component.subiendoImagen).toBe(false);
    });

    it('should delete product image if confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.eliminarImagen('1');
      expect(productoServiceSpy.eliminarImagen).toHaveBeenCalledWith('1');
      confirmSpy.mockRestore();
    });

    it('should not delete product image if rejected', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.eliminarImagen('1');
      expect(productoServiceSpy.eliminarImagen).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete product if confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.onDelete('1');
      expect(productoServiceSpy.delete).toHaveBeenCalledWith('1');
      confirmSpy.mockRestore();
    });

    it('should not delete product if rejected', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.onDelete('1');
      expect(productoServiceSpy.delete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  describe('Filters and Helpers', () => {
    it('should get unique sorted list of countries', () => {
      component.productos = [
        { id: '1', nombre: 'P1', precio: 1, stock: 1, categoriaId: 'c1', pais: 'Colombia', activo: true },
        { id: '2', nombre: 'P2', precio: 1, stock: 1, categoriaId: 'c1', pais: 'Argentina', activo: true },
        { id: '3', nombre: 'P3', precio: 1, stock: 1, categoriaId: 'c1', pais: 'Colombia', activo: true },
        { id: '4', nombre: 'P4', precio: 1, stock: 1, categoriaId: 'c1', pais: null as any, activo: true },
      ];
      expect(component.paisesList).toEqual(['Argentina', 'Chile', 'Colombia']); // Chile is fallback for null
    });

    it('should filter by country and bodega', () => {
      component.productos = [
        { id: '1', nombre: 'P1', precio: 1, stock: 1, categoriaId: 'c1', pais: 'Chile', idBodega: 1, activo: true },
        { id: '2', nombre: 'P2', precio: 1, stock: 1, categoriaId: 'c1', pais: 'Colombia', idBodega: 2, activo: true },
      ];

      component.filtroPais = 'Colombia';
      expect(component.productosFiltrados.length).toBe(1);
      expect(component.productosFiltrados[0].id).toBe('2');

      component.filtroPais = '';
      component.filtroBodegaId = 1;
      expect(component.productosFiltrados.length).toBe(1);
      expect(component.productosFiltrados[0].id).toBe('1');
    });

    it('should format currency properly', () => {
      expect(component.formatCurrency(12500)).toContain('12.500');
    });
  });
});
