import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Usuario, Region, Comuna } from '../../shared/models/models';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create and fetch initial data', () => {
    fixture.detectChanges();

    const reqRegions = httpTestingController.expectOne(environment.services.regiones);
    expect(reqRegions.request.method).toBe('GET');
    reqRegions.flush([{ id: 'reg1', nombre: 'Metropolitana' }]);

    const reqUser = httpTestingController.expectOne(`${environment.services.usuarios}/me`);
    expect(reqUser.request.method).toBe('GET');
    reqUser.flush({ id: '1', nombre: 'John', apellido: 'Doe', correo: 'john@doe.com', rolNombre: 'cliente' });

    expect(component).toBeTruthy();
    expect(component.regiones.length).toBe(1);
    expect(component.usuario?.nombre).toBe('John');
  });

  it('should fetch comunas on region change', () => {
    fixture.detectChanges();
    
    // flush init requests
    httpTestingController.expectOne(environment.services.regiones).flush([]);
    httpTestingController.expectOne(`${environment.services.usuarios}/me`).flush({ id: '1', nombre: 'John' });

    component.form.patchValue({ regionId: 'reg1' });
    component.onRegionChange();

    const reqComunas = httpTestingController.expectOne(`${environment.services.comunas}/por-region/reg1`);
    expect(reqComunas.request.method).toBe('GET');
    reqComunas.flush([{ id: 'com1', nombre: 'Santiago' }]);

    expect(component.comunas.length).toBe(1);
    expect(component.comunas[0].nombre).toBe('Santiago');
  });

  it('should save address and update user on submit', () => {
    fixture.detectChanges();
    httpTestingController.expectOne(environment.services.regiones).flush([]);
    httpTestingController.expectOne(`${environment.services.usuarios}/me`).flush({ id: '1', nombre: 'John' });

    component.form.setValue({
      regionId: 'reg1',
      comunaId: 'com1',
      calle: 'Av. Libertador',
      numero: '123',
      codigoPostal: '90000'
    });

    component.onSubmit();

    const reqPostDir = httpTestingController.expectOne(environment.services.direcciones);
    expect(reqPostDir.request.method).toBe('POST');
    reqPostDir.flush({ id: 'dir123' });

    const reqPutUser = httpTestingController.expectOne(`${environment.services.usuarios}/me`);
    expect(reqPutUser.request.method).toBe('PUT');
    expect(reqPutUser.request.body).toEqual({ direccionId: 'dir123' });
    reqPutUser.flush({ id: '1', nombre: 'John', direccion: { id: 'dir123', calle: 'Av. Libertador', numero: '123' } });

    expect(component.usuario?.direccion?.id).toBe('dir123');
    expect(component.guardadoExitoso).toBe(true);
  });

  it('should format address text correctly', () => {
    const u: Usuario = {
      id: '1', nombre: 'John', correo: 'a@a.com',
      direccion: {
        calle: 'Libertad', numero: '45',
        comuna: { id: '1', nombre: 'Providencia', region: { id: '1', nombre: 'RM' } }
      }
    };
    component.usuario = u;
    expect(component.getDireccionTexto()).toBe('Libertad, N°45, Providencia, RM');
  });

  it('should get initials and role badges', () => {
    expect(component.getIniciales({ nombre: 'John', apellido: 'Doe', id: '1', correo: 'a' })).toBe('JD');
    expect(component.getRolBadge('admin')).toBe('bg-red-100 text-red-800');
    expect(component.getRolBadge('unknown')).toBe('bg-gray-100 text-gray-600');
  });
});
