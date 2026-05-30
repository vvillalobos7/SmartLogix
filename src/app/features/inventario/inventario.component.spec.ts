import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InventarioComponent } from './inventario.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InventarioService } from './inventario.service';
import { BehaviorSubject, of } from 'rxjs';
import { Bodega, Pasillo, Estante, EstPasi } from '../../shared/models/models';

describe('InventarioComponent', () => {
  let component: InventarioComponent;
  let fixture: ComponentFixture<InventarioComponent>;
  let inventarioServiceSpy: any;

  let bodegasSubject: BehaviorSubject<Bodega[]>;
  let pasillosSubject: BehaviorSubject<Pasillo[]>;
  let estantesSubject: BehaviorSubject<Estante[]>;
  let estPasiSubject: BehaviorSubject<EstPasi[]>;

  beforeEach(async () => {
    bodegasSubject = new BehaviorSubject<Bodega[]>([]);
    pasillosSubject = new BehaviorSubject<Pasillo[]>([]);
    estantesSubject = new BehaviorSubject<Estante[]>([]);
    estPasiSubject = new BehaviorSubject<EstPasi[]>([]);

    inventarioServiceSpy = {
      bodegas$: bodegasSubject.asObservable(),
      pasillos$: pasillosSubject.asObservable(),
      estantes$: estantesSubject.asObservable(),
      estPasi$: estPasiSubject.asObservable(),

      getBodegas: vi.fn().mockReturnValue(of([])),
      getPasillos: vi.fn().mockReturnValue(of([])),
      getEstantes: vi.fn().mockReturnValue(of([])),
      getEstPasi: vi.fn().mockReturnValue(of([])),

      createBodega: vi.fn().mockReturnValue(of({})),
      createPasillo: vi.fn().mockReturnValue(of({})),
      createEstante: vi.fn().mockReturnValue(of({ idEstante: 123 })),
      createEstPasiLink: vi.fn().mockReturnValue(of({})),

      deleteBodega: vi.fn().mockReturnValue(of({})),
      deletePasillo: vi.fn().mockReturnValue(of({})),
      deleteEstPasi: vi.fn().mockReturnValue(of({})),

      updatePasillo: vi.fn().mockReturnValue(of({})),
      updateEstPasi: vi.fn().mockReturnValue(of({})),
      toggleBodega: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [InventarioComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: InventarioService, useValue: inventarioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventarioComponent);
    component = fixture.componentInstance;
  });

  it('should create and load data', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(inventarioServiceSpy.getBodegas).toHaveBeenCalled();
    expect(inventarioServiceSpy.getPasillos).toHaveBeenCalled();
  });

  describe('Expansions and Lists', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should expand and collapse bodegas', () => {
      component.toggleBodegaExpand(1);
      expect(component.isBodegaExpanded(1)).toBe(true);

      component.toggleBodegaExpand(1);
      expect(component.isBodegaExpanded(1)).toBe(false);
    });

    it('should expand and collapse pasillos', () => {
      component.togglePasilloExpand(10);
      expect(component.isPasilloExpanded(10)).toBe(true);

      component.togglePasilloExpand(10);
      expect(component.isPasilloExpanded(10)).toBe(false);
    });

    it('should filter pasillos by bodega and estantes by pasillo', () => {
      component.pasillos = [
        { idPasillo: 1, codigo: 'P1', idBodega: 5 },
        { idPasillo: 2, codigo: 'P2', idBodega: 6 },
      ];
      component.estPasiList = [
        { idEstPasi: 1, idPasillo: 1, idEstante: 100 },
        { idEstPasi: 2, idPasillo: 2, idEstante: 200 },
      ];

      expect(component.getPasillosDeBodega(5).length).toBe(1);
      expect(component.getPasillosDeBodega(5)[0].codigo).toBe('P1');
      expect(component.getEstantesEnPasillo(1).length).toBe(1);
    });

    it('should return correct occupancy color class', () => {
      expect(component.getOcupacionColor(90)).toBe('text-red-600');
      expect(component.getOcupacionColor(60)).toBe('text-yellow-600');
      expect(component.getOcupacionColor(30)).toBe('text-green-600');
      expect(component.getOcupacionColor()).toBe('text-gray-400');
    });
  });

  describe('Form Submissions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should submit bodega form', () => {
      component.openNewBodega();
      component.bodegaForm.patchValue({ nombre: 'Bodega 1', pais: 'Chile', capacidadTotal: 100 });
      component.onSubmitBodega();

      expect(inventarioServiceSpy.createBodega).toHaveBeenCalledWith({
        nombre: 'Bodega 1',
        direccion: null,
        ciudad: null,
        pais: 'Chile',
        capacidadTotal: 100
      });
      expect(component.showModal).toBe(false);
    });

    it('should submit pasillo form', () => {
      component.openNewPasillo(1);
      component.pasilloForm.patchValue({ codigo: 'P1', numeroOrden: 2, idBodega: 1 });
      component.onSubmitPasillo();

      expect(inventarioServiceSpy.createPasillo).toHaveBeenCalled();
    });

    it('should submit estante form and link to pasillo', () => {
      component.openNewEstante(5);
      component.estanteForm.patchValue({ codigo: 'E1', numNiveles: 3, capacidadPorNivel: 10, idPasillo: 5 });
      component.onSubmitEstante();

      expect(inventarioServiceSpy.createEstante).toHaveBeenCalled();
      expect(inventarioServiceSpy.createEstPasiLink).toHaveBeenCalledWith(123, 5);
    });
  });
});
