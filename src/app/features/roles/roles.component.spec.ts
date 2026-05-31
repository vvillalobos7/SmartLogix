import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RolesComponent } from './roles.component';
import { RolService } from '../usuarios/usuario.service';
import { BehaviorSubject, of } from 'rxjs';
import { Rol } from '../../shared/models/models';

describe('RolesComponent', () => {
  let component: RolesComponent;
  let fixture: ComponentFixture<RolesComponent>;
  let rolServiceSpy: any;
  let rolesSubject: BehaviorSubject<Rol[]>;

  beforeEach(async () => {
    rolesSubject = new BehaviorSubject<Rol[]>([]);
    rolServiceSpy = {
      roles$: rolesSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [
        { provide: RolService, useValue: rolServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
  });

  it('should create and load roles', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(rolServiceSpy.getAll).toHaveBeenCalled();
  });
});
