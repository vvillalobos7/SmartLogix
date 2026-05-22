import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductoService } from './producto.service';
import { Producto, ProductoRequest, Categoria } from '../../shared/models/models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  filtro = '';
  showModal = false;
  editando: Producto | null = null;
  form!: FormGroup;

  // Imagen
  imagenFile: File | null = null;
  imagenPreview: string | null = null;
  productoImagenId: string | null = null;
  showImagenModal = false;
  subiendoImagen = false;

  get productosFiltrados(): Producto[] {
    const q = this.filtro.toLowerCase();
    return this.productos.filter(p =>
      !q || p.nombre.toLowerCase().includes(q) || (p.categoriaNombre ?? '').toLowerCase().includes(q),
    );
  }

  constructor(private productoService: ProductoService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.productoService.getCategorias().subscribe(c => { this.categorias = c; this.cdr.markForCheck(); });
    this.productoService.getAll().subscribe();
    this.productoService.productos$.subscribe(p => {
      this.productos = p;
      this.cdr.markForCheck();
    });
  }

  initForm(p?: Producto): void {
    this.form = this.fb.group({
      nombre:      [p?.nombre ?? '',      [Validators.required, Validators.maxLength(200)]],
      descripcion: [p?.descripcion ?? '', []],
      precio:      [p?.precio ?? '',       [Validators.required, Validators.min(1)]],
      stock:       [p?.stock ?? 0,        [Validators.required, Validators.min(0)]],
      categoriaId: [p?.categoriaId ?? '', [Validators.required]],
      imagenUrl:   [p?.imagenUrl ?? '',   []],
    });
  }

  openNew(): void              { this.editando = null; this.initForm();  this.showModal = true; }
  openEdit(p: Producto): void  { this.editando = p;    this.initForm(p); this.showModal = true; }
  closeModal(): void           { this.showModal = false; this.editando = null; }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { imagenUrl, ...dto } = this.form.value as ProductoRequest & { imagenUrl?: string };
    if (this.editando) {
      this.productoService.update(this.editando.id, dto as ProductoRequest).subscribe();
    } else {
      this.productoService.create(dto as ProductoRequest).subscribe();
    }
    this.closeModal();
  }

  onDelete(id: string): void {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productoService.delete(id).subscribe();
  }

  toggleActivo(p: Producto): void {
    this.productoService.toggleActivo(p.id).subscribe();
  }

  // Imagen
  abrirImagenModal(p: Producto): void {
    this.productoImagenId = p.id;
    this.imagenFile = null;
    this.imagenPreview = p.imagenUrl ?? null;
    this.showImagenModal = true;
  }

  cerrarImagenModal(): void {
    this.showImagenModal = false;
    this.productoImagenId = null;
    this.imagenFile = null;
    this.imagenPreview = null;
    this.subiendoImagen = false;
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5 MB.');
      return;
    }
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  subirImagen(): void {
    if (!this.imagenFile || !this.productoImagenId) return;
    this.subiendoImagen = true;
    this.productoService.subirImagen(this.productoImagenId, this.imagenFile).subscribe({
      next: () => this.cerrarImagenModal(),
      error: () => { this.subiendoImagen = false; },
    });
  }

  eliminarImagen(id: string): void {
    if (!confirm('¿Eliminar la imagen del producto?')) return;
    this.productoService.eliminarImagen(id).subscribe();
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }
}
