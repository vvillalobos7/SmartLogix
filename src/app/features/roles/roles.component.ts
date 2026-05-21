import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService } from '../usuarios/usuario.service';
import { Rol } from '../../shared/models/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  showModal = false;
  editando: Rol | null = null;
  form!: FormGroup;

  constructor(private rolService: RolService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
    this.rolService.getAll().subscribe();
    this.rolService.roles$.subscribe(r => {
      this.roles = r;
      this.cdr.markForCheck();
    });
  }

  initForm(r?: Rol): void {
    this.form = this.fb.group({
      nombre:      [r?.nombre ?? '',      Validators.required],
      descripcion: [r?.descripcion ?? '', []],
    });
  }

  openNew():        void { this.editando = null; this.initForm();  this.showModal = true; }
  openEdit(r: Rol): void { this.editando = r;    this.initForm(r); this.showModal = true; }
  closeModal():     void { this.showModal = false; this.editando = null; }

  onSubmit(): void {
    if (this.form.invalid) return;
    const dto: Omit<Rol, 'id'> = this.form.value;
    if (this.editando) {
      this.rolService.update(this.editando.id, dto).subscribe();
    } else {
      this.rolService.create(dto).subscribe();
    }
    this.closeModal();
  }

  onDelete(id: string): void {
    if (!confirm('¿Eliminar este rol?')) return;
    this.rolService.delete(id).subscribe();
  }
}
