import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventarioService } from './inventario.service';
import {
  Bodega, BodegaRequest,
  Pasillo, PasilloRequest,
  Estante, EstanteRequest,
  EstPasi,
} from '../../shared/models/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
})
export class InventarioComponent implements OnInit {
  bodegas:     Bodega[]  = [];
  pasillos:    Pasillo[] = [];
  estantes:    Estante[] = [];
  estPasiList: EstPasi[] = [];

  expandedBodegas  = new Set<number>();
  expandedPasillos = new Set<number>();

  showModal = false;
  modalTipo: 'bodega' | 'pasillo' | 'estante' = 'bodega';

  bodegaForm!:  FormGroup;
  pasilloForm!: FormGroup;
  estanteForm!: FormGroup;

  constructor(
    private readonly inventarioService: InventarioService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.inventarioService.getBodegas().subscribe();
    this.inventarioService.getPasillos().subscribe();
    this.inventarioService.getEstantes().subscribe();
    this.inventarioService.getEstPasi().subscribe();

    this.inventarioService.bodegas$.subscribe(b => {
      this.bodegas = b;
      b.forEach(bodega => { if (bodega.idBodega != null) this.expandedBodegas.add(bodega.idBodega); });
      this.cdr.detectChanges();
    });
    this.inventarioService.pasillos$.subscribe(p => {
      this.pasillos = p;
      p.forEach(pasillo => { if (pasillo.idPasillo != null) this.expandedPasillos.add(pasillo.idPasillo); });
      this.cdr.detectChanges();
    });
    this.inventarioService.estantes$.subscribe(e  => { this.estantes     = e;  this.cdr.detectChanges(); });
    this.inventarioService.estPasi$.subscribe(ep  => { this.estPasiList  = ep; this.cdr.detectChanges(); });
  }

  initForms(): void {
    this.bodegaForm = this.fb.group({
      nombre:         ['', Validators.required],
      direccion:      [''],
      ciudad:         [''],
      pais:           ['Chile'],
      capacidadTotal: [0, Validators.min(0)],
    });
    this.pasilloForm = this.fb.group({
      codigo:      ['', Validators.required],
      descripcion: [''],
      numeroOrden: [1, Validators.min(1)],
      idBodega:    [null, Validators.required],
    });
    this.estanteForm = this.fb.group({
      codigo:            ['', Validators.required],
      descripcion:       [''],
      numNiveles:        [1, [Validators.required, Validators.min(1)]],
      capacidadPorNivel: [0, Validators.min(0)],
      idPasillo:         [null, Validators.required],
    });
  }

  openNewBodega(): void {
    this.modalTipo = 'bodega';
    this.bodegaForm.reset({ pais: 'Chile', capacidadTotal: 0 });
    this.showModal = true;
  }

  openNewPasillo(idBodega?: number): void {
    this.modalTipo = 'pasillo';
    this.pasilloForm.reset({ numeroOrden: 1, idBodega: idBodega ?? null });
    this.showModal = true;
  }

  openNewEstante(idPasillo?: number): void {
    this.modalTipo = 'estante';
    this.estanteForm.reset({ numNiveles: 1, capacidadPorNivel: 0, idPasillo: idPasillo ?? null });
    this.showModal = true;
  }

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
    this.inventarioService.createEstante(rest).subscribe({
      next: created => {
        if (idPasillo && created?.idEstante) {
          this.inventarioService.createEstPasiLink(created.idEstante, idPasillo).subscribe();
        }
        this.closeModal();
      },
      error: () => this.closeModal(),
    });
  }

  deleteBodega(id: number): void {
    if (confirm('¿Eliminar esta bodega?')) { this.inventarioService.deleteBodega(id).subscribe(); }
  }
  deletePasillo(id: number): void {
    if (confirm('¿Eliminar este pasillo?')) { this.inventarioService.deletePasillo(id).subscribe(); }
  }
  deleteEstPasi(id: number): void {
    if (confirm('¿Quitar este estante del pasillo?')) { this.inventarioService.deleteEstPasi(id).subscribe(); }
  }

  toggleBodega(b: Bodega): void {
    if (b.idBodega == null) return;
    this.inventarioService.toggleBodega(b.idBodega).subscribe();
  }

  toggleBodegaExpand(id: number): void {
    if (this.expandedBodegas.has(id)) {
      this.expandedBodegas.delete(id);
    } else {
      this.expandedBodegas.add(id);
    }
  }

  togglePasilloExpand(id: number): void {
    if (this.expandedPasillos.has(id)) {
      this.expandedPasillos.delete(id);
    } else {
      this.expandedPasillos.add(id);
    }
  }

  isBodegaExpanded(id: number):  boolean { return this.expandedBodegas.has(id); }
  isPasilloExpanded(id: number): boolean { return this.expandedPasillos.has(id); }

  getPasillosDeBodega(idBodega: number): Pasillo[] {
    return this.pasillos.filter(p => p.idBodega === idBodega);
  }

  getEstantesEnPasillo(idPasillo: number): EstPasi[] {
    return this.estPasiList.filter(ep => ep.idPasillo === idPasillo);
  }

  getOcupacionColor(pct?: number): string {
    if (pct == null) return 'text-gray-400';
    if (pct >= 80)   return 'text-red-600';
    if (pct >= 50)   return 'text-yellow-600';
    return 'text-green-600';
  }
}
