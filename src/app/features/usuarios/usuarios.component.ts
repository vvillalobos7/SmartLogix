import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService, RolService } from './usuario.service';
import { Usuario, UsuarioRequest, Rol } from '../../shared/models/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  showModal = false;
  editando: Usuario | null = null;
  form!: FormGroup;

  get activos(): number   { return this.usuarios.filter(u => u.activo).length; }
  get inactivos(): number { return this.usuarios.filter(u => !u.activo).length; }

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.usuarioService.getAll().subscribe();
    this.rolService.getAll().subscribe();
    this.usuarioService.usuarios$.subscribe(u => { this.usuarios = u; this.cdr.markForCheck(); });
    this.rolService.roles$.subscribe(r => { this.roles = r; this.cdr.markForCheck(); });
  }

  initForm(u?: Usuario): void {
    this.form = this.fb.group({
      nombre:    [u?.nombre    ?? '', [Validators.required, Validators.minLength(2)]],
      apellido:  [u?.apellido  ?? ''],
      correo:    [u?.correo    ?? '', [Validators.required, Validators.email]],
      rut:       [u?.rut       ?? ''],
      cargo:     [u?.cargo     ?? ''],
      rolNombre: [u?.rolNombre ?? '', Validators.required],
    });
  }

  openNew():            void { this.editando = null; this.initForm(); this.showModal = true; }
  openEdit(u: Usuario): void { this.editando = u; this.initForm(u); this.showModal = true; }
  closeModal():         void { this.showModal = false; this.editando = null; }

  onSubmit(): void {
    if (this.form.invalid) return;
    const dto: UsuarioRequest = this.form.value;
    if (this.editando) {
      this.usuarioService.update(this.editando.id, dto).subscribe();
    } else {
      this.usuarioService.create(dto).subscribe();
    }
    this.closeModal();
  }

  onDelete(id: string): void {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.usuarioService.delete(id).subscribe();
  }

  toggleActivo(u: Usuario): void {
    this.usuarioService.toggleActivo(u.id).subscribe();
  }

  getInitials(nombre: string): string { return this.usuarioService.getInitials(nombre); }

  getAvatarColor(nombre: string): string {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
    return colors[nombre.charCodeAt(0) % colors.length];
  }

  getRolBadge(rolNombre?: string): string {
    const map: Record<string, string> = {
      admin:         'bg-red-100 text-red-800',
      bodeguero:     'bg-blue-100 text-blue-800',
      transportista: 'bg-yellow-100 text-yellow-800',
      cliente:       'bg-green-100 text-green-800',
    };
    return map[rolNombre ?? ''] ?? 'bg-gray-100 text-gray-600';
  }
}
