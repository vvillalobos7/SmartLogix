import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventarioService } from './inventario.service';
import { Bodega, BodegaRequest, Pasillo, PasilloRequest, Estante, EstanteRequest } from '../../shared/models/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
})
export class InventarioComponent implements OnInit {
  activeTab: 'bodegas' | 'pasillos' | 'estantes' = 'bodegas';

  bodegas: Bodega[] = [];
  pasillos: Pasillo[] = [];
  estantes: Estante[] = [];

  showModal = false;
  modalTipo: 'bodega' | 'pasillo' | 'estante' = 'bodega';
  bodegaForm!: FormGroup;
  pasilloForm!: FormGroup;
  estanteForm!: FormGroup;

  constructor(
    private inventarioService: InventarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.inventarioService.getBodegas().subscribe();
    this.inventarioService.getPasillos().subscribe();
    this.inventarioService.getEstantes().subscribe();
    this.inventarioService.bodegas$.subscribe(b  => { this.bodegas  = b; this.cdr.markForCheck(); });
    this.inventarioService.pasillos$.subscribe(p => { this.pasillos = p; this.cdr.markForCheck(); });
    this.inventarioService.estantes$.subscribe(e => { this.estantes = e; this.cdr.markForCheck(); });
  }

  initForms(): void {
    this.bodegaForm = this.fb.group({
      nombre:        ['', Validators.required],
      direccion:     [''],
      ciudad:        [''],
      pais:          ['Colombia'],
      capacidadTotal:[0, Validators.min(0)],
    });
    this.pasilloForm = this.fb.group({
      codigo:       ['', Validators.required],
      descripcion:  [''],
      numeroOrden:  [1, Validators.min(1)],
      idBodega:     [null, Validators.required],
    });
    this.estanteForm = this.fb.group({
      codigo:            ['', Validators.required],
      descripcion:       [''],
      numNiveles:        [1, [Validators.required, Validators.min(1)]],
      capacidadPorNivel: [0, Validators.min(0)],
      idPasillo:         [null, Validators.required],
    });
  }

  openNewBodega():   void { this.modalTipo = 'bodega';   this.bodegaForm.reset({ pais: 'Colombia', capacidadTotal: 0 }); this.showModal = true; }
  openNewPasillo():  void { this.modalTipo = 'pasillo';  this.pasilloForm.reset({ numeroOrden: 1 });                     this.showModal = true; }
  openNewEstante():  void { this.modalTipo = 'estante';  this.estanteForm.reset({ numNiveles: 1, capacidadPorNivel: 0 }); this.showModal = true; }
  closeModal(): void { this.showModal = false; }

  onSubmitBodega(): void {
    if (this.bodegaForm.invalid) return;
    const dto: BodegaRequest = this.bodegaForm.value;
    this.inventarioService.createBodega(dto).subscribe();
    this.closeModal();
  }

  onSubmitPasillo(): void {
    if (this.pasilloForm.invalid) return;
    const dto: PasilloRequest = this.pasilloForm.value;
    this.inventarioService.createPasillo(dto).subscribe();
    this.closeModal();
  }

  onSubmitEstante(): void {
    if (this.estanteForm.invalid) return;
    const { idPasillo, ...rest } = this.estanteForm.value as { idPasillo: number } & EstanteRequest;
    const dto: EstanteRequest = rest;
    this.inventarioService.createEstante(dto).subscribe({
      next: created => {
        if (idPasillo && created.idEstante) {
          this.inventarioService.createEstPasiLink(created.idEstante, idPasillo).subscribe();
        }
        this.closeModal();
      },
      error: () => this.closeModal(),
    });
  }

  deleteBodega(id: number): void {
    if (!confirm('¿Eliminar esta bodega?')) return;
    this.inventarioService.deleteBodega(id).subscribe();
  }

  deletePasillo(id: number): void {
    if (!confirm('¿Eliminar este pasillo?')) return;
    this.inventarioService.deletePasillo(id).subscribe();
  }

  deleteEstante(id: number): void {
    if (!confirm('¿Eliminar este estante?')) return;
    this.inventarioService.deleteEstante(id).subscribe();
  }

  toggleBodega(b: Bodega): void {
    if (b.idBodega == null) return;
    this.inventarioService.toggleBodega(b.idBodega).subscribe();
  }

  getPasillosDeBodega(idBodega: number): Pasillo[] {
    return this.pasillos.filter(p => p.idBodega === idBodega);
  }
}
