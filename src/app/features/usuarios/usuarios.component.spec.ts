import { TestBed, ComponentFixture } from '@angular/core/testing';
import { UsuariosComponent } from './usuarios.component';
import { ReactiveFormsModule } from '@angular/forms';
import { UsuarioService, RolService } from './usuario.service';
import { BehaviorSubject, of } from 'rxjs';
import { Usuario, Rol } from '../../shared/models/models';

describe('UsuariosComponent', () => {
  let component: UsuariosComponent;
  let fixture: ComponentFixture<UsuariosComponent>;

  let usuarioServiceSpy: any;
  let rolServiceSpy: any;

  let usuariosSubject: BehaviorSubject<Usuario[]>;
  let rolesSubject: BehaviorSubject<Rol[]>;

  beforeEach(async () => {
    usuariosSubject = new BehaviorSubject<Usuario[]>([]);
    rolesSubject = new BehaviorSubject<Rol[]>([]);

    usuarioServiceSpy = {
      usuarios$: usuariosSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
      delete: vi.fn().mockReturnValue(of({})),
      toggleActivo: vi.fn().mockReturnValue(of({})),
      asignarRol: vi.fn().mockReturnValue(of({})),
      getInitials: vi.fn().mockReturnValue('U'),
    };

    rolServiceSpy = {
      roles$: rolesSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [UsuariosComponent, ReactiveFormsModule],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: RolService, useValue: rolServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list active and inactive users count', () => {
    const mockUsers: Usuario[] = [
      { id: '1', nombre: 'U1', correo: 'u1@test.com', activo: true },
      { id: '2', nombre: 'U2', correo: 'u2@test.com', activo: false },
      { id: '3', nombre: 'U3', correo: 'u3@test.com', activo: true },
    ];
    usuariosSubject.next(mockUsers);

    expect(component.activos).toBe(2);
    expect(component.inactivos).toBe(1);
  });

  it('should suggest correct role based on email', () => {
    expect(component.sugerirRol('bodeguero@smartlogix.cl')).toBe('bodeguero');
    expect(component.sugerirRol('transportista@test.com')).toBe('transportista');
    expect(component.sugerirRol('random@domain.com')).toBe('cliente');
  });

  it('should open edit modal', () => {
    const u: Usuario = { id: '1', nombre: 'User', correo: 'user@test.com', rolNombre: 'cliente', activo: true };
    component.openEdit(u);

    expect(component.showModal).toBe(true);
    expect(component.editando).toEqual(u);
    expect(component.form.get('rolNombre')?.value).toBe('cliente');
  });

  it('should assign role on submit', () => {
    const u: Usuario = { id: '1', nombre: 'User', correo: 'user@test.com', rolNombre: 'cliente', activo: true };
    component.openEdit(u);
    component.roles = [
      { id: 'rol-1', nombre: 'bodeguero', descripcion: 'Bodeguero' },
    ];
    component.form.patchValue({ rolNombre: 'bodeguero' });

    component.onSubmit();

    expect(usuarioServiceSpy.asignarRol).toHaveBeenCalledWith('1', 'rol-1', 'bodeguero');
    expect(component.showModal).toBe(false);
  });

  it('should delete user', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('1');
    expect(usuarioServiceSpy.delete).toHaveBeenCalledWith('1');
  });

  it('should toggle active status', () => {
    const u: Usuario = { id: '1', nombre: 'User', correo: 'user@test.com', activo: true };
    component.toggleActivo(u);
    expect(usuarioServiceSpy.toggleActivo).toHaveBeenCalledWith('1');
  });

  it('should return correct badge color and initials', () => {
    expect(component.getInitials('John Doe')).toBe('U'); // calls service spy
    expect(component.getRolBadge('admin')).toBe('bg-red-100 text-red-800');
    expect(component.getRolBadge('bodeguero')).toBe('bg-blue-100 text-blue-800');
    expect(component.getRolBadge('unknown')).toBe('bg-gray-100 text-gray-600');
    expect(component.getAvatarColor('John')).toBeDefined();
  });
});
