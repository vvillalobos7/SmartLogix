import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EstadosComponent } from './estados.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

describe('EstadosComponent', () => {
  let component: EstadosComponent;
  let fixture: ComponentFixture<EstadosComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadosComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadosComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create and fetch initial data', () => {
    fixture.detectChanges();

    const reqTipos = httpTestingController.expectOne(environment.services.tiposEstado);
    expect(reqTipos.request.method).toBe('GET');
    reqTipos.flush([]);

    const reqEstados = httpTestingController.expectOne(environment.services.estados);
    expect(reqEstados.request.method).toBe('GET');
    reqEstados.flush([]);

    expect(component).toBeTruthy();
    expect(component.tiposDeEstado.length).toBe(0);
    expect(component.estados.length).toBe(0);
  });

  it('should handle tab change', () => {
    fixture.detectChanges();
    httpTestingController.expectOne(environment.services.tiposEstado).flush([]);
    httpTestingController.expectOne(environment.services.estados).flush([]);

    expect(component.activeTab).toBe('estados');
    component.activeTab = 'tipos';
    expect(component.activeTab).toBe('tipos');
  });

  it('should submit form and add new status', () => {
    fixture.detectChanges();
    httpTestingController.expectOne(environment.services.tiposEstado).flush([]);
    httpTestingController.expectOne(environment.services.estados).flush([]);

    component.openNew();
    component.form.setValue({
      nombre: 'Nuevo Estado',
      descripcion: 'Desc',
      tipoId: 'tipo-1'
    });

    component.onSubmit();

    const reqPost = httpTestingController.expectOne(environment.services.estados);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({ id: 'est-new', nombre: 'Nuevo Estado', descripcion: 'Desc', tipoDeEstado: { id: 'tipo-1', nombre: 'Usuario' } });

    expect(component.estados.length).toBe(1);
    expect(component.estados[0].id).toBe('est-new');
  });
});
