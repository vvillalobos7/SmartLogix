import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created and start with empty toasts array', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add a success toast and auto-remove it after 5000ms', () => {
    service.success('Operación Exitosa', 'Registro guardado');
    
    let list = service.toasts();
    expect(list.length).toBe(1);
    expect(list[0]).toEqual({
      id: 0,
      tipo: 'success',
      titulo: 'Operación Exitosa',
      mensaje: 'Registro guardado',
    });

    vi.advanceTimersByTime(5000);
    expect(service.toasts()).toEqual([]);
  });

  it('should support warning, error, and info types', () => {
    service.warning('Alerta');
    service.error('Fallo');
    service.info('Info');

    const list = service.toasts();
    expect(list.length).toBe(3);
    expect(list[0].tipo).toBe('warning');
    expect(list[1].tipo).toBe('error');
    expect(list[2].tipo).toBe('info');
  });

  it('should remove toast manually by id', () => {
    service.success('Uno');
    service.success('Dos');

    let list = service.toasts();
    expect(list.length).toBe(2);

    const firstId = list[0].id;
    service.remove(firstId);

    list = service.toasts();
    expect(list.length).toBe(1);
    expect(list[0].titulo).toBe('Dos');
  });
});
