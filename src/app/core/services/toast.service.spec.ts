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

  describe('edge cases', () => {
    it('should handle empty title and message', () => {
      service.success('', '');
      
      const list = service.toasts();
      expect(list.length).toBe(1);
      expect(list[0].titulo).toBe('');
      expect(list[0].mensaje).toBe('');
    });

    it('should add toast with message only (no title)', () => {
      service.success('', 'Solo mensaje');
      
      const list = service.toasts();
      expect(list.length).toBe(1);
      expect(list[0].titulo).toBe('');
      expect(list[0].mensaje).toBe('Solo mensaje');
    });

    it('should handle toast with very long message', () => {
      const longMessage = 'A'.repeat(1000);
      service.info('Title', longMessage);
      
      const list = service.toasts();
      expect(list.length).toBe(1);
      expect(list[0].mensaje).toBe(longMessage);
    });

    it('should handle special characters in title and message', () => {
      service.error('Error: @#$%^&*()', '<script>alert("xss")</script>');
      
      const list = service.toasts();
      expect(list.length).toBe(1);
      expect(list[0].titulo).toContain('@#$%^&*()');
      expect(list[0].mensaje).toContain('<script>');
    });

    it('should remove non-existent toast id without error', () => {
      service.success('Toast');
      const initialLength = service.toasts().length;
      
      service.remove(9999);
      
      expect(service.toasts().length).toBe(initialLength);
    });

    it('should handle multiple remove calls for same id', () => {
      service.success('Toast');
      const id = service.toasts()[0].id;
      
      service.remove(id);
      expect(service.toasts().length).toBe(0);
      
      service.remove(id);
      expect(service.toasts().length).toBe(0);
    });

    it('should preserve toast order', () => {
      service.success('First');
      service.warning('Second');
      service.error('Third');
      service.info('Fourth');
      
      const list = service.toasts();
      expect(list.length).toBe(4);
      expect(list[0].titulo).toBe('First');
      expect(list[1].titulo).toBe('Second');
      expect(list[2].titulo).toBe('Third');
      expect(list[3].titulo).toBe('Fourth');
    });
  });

  describe('auto-removal timing', () => {
    it('should auto-remove toast after exactly 5000ms', () => {
      service.success('Teste');
      
      expect(service.toasts().length).toBe(1);
      
      vi.advanceTimersByTime(4999);
      expect(service.toasts().length).toBe(1);
      
      vi.advanceTimersByTime(1);
      expect(service.toasts().length).toBe(0);
    });

    it('should auto-remove multiple toasts independently', () => {
      service.success('First');
      
      vi.advanceTimersByTime(2500);
      
      service.warning('Second');
      
      vi.advanceTimersByTime(2500);
      expect(service.toasts().length).toBe(1);
      
      vi.advanceTimersByTime(2500);
      expect(service.toasts().length).toBe(0);
    });

    it('should handle manual remove before auto-timeout', () => {
      service.success('Toast');
      const id = service.toasts()[0].id;
      
      vi.advanceTimersByTime(2000);
      service.remove(id);
      expect(service.toasts().length).toBe(0);
      
      vi.advanceTimersByTime(3000);
      expect(service.toasts().length).toBe(0);
    });
  });

  describe('toast types', () => {
    it('should create success toast with correct properties', () => {
      service.success('Success Title', 'Success Message');
      
      const toast = service.toasts()[0];
      expect(toast.tipo).toBe('success');
      expect(toast.titulo).toBe('Success Title');
      expect(toast.mensaje).toBe('Success Message');
    });

    it('should create warning toast with correct properties', () => {
      service.warning('Warning Title', 'Warning Message');
      
      const toast = service.toasts()[0];
      expect(toast.tipo).toBe('warning');
      expect(toast.titulo).toBe('Warning Title');
      expect(toast.mensaje).toBe('Warning Message');
    });

    it('should create error toast with correct properties', () => {
      service.error('Error Title', 'Error Message');
      
      const toast = service.toasts()[0];
      expect(toast.tipo).toBe('error');
      expect(toast.titulo).toBe('Error Title');
      expect(toast.mensaje).toBe('Error Message');
    });

    it('should create info toast with correct properties', () => {
      service.info('Info Title', 'Info Message');
      
      const toast = service.toasts()[0];
      expect(toast.tipo).toBe('info');
      expect(toast.titulo).toBe('Info Title');
      expect(toast.mensaje).toBe('Info Message');
    });
  });

  describe('toast IDs', () => {
    it('should assign incrementing IDs to toasts', () => {
      service.success('First');
      service.success('Second');
      service.success('Third');
      
      const list = service.toasts();
      expect(list[0].id).toBe(0);
      expect(list[1].id).toBe(1);
      expect(list[2].id).toBe(2);
    });

    it('should continue incrementing IDs after removal', () => {
      service.success('First');
      service.success('Second');
      const firstId = service.toasts()[0].id;
      
      service.remove(firstId);
      service.success('Third');
      
      const list = service.toasts();
      expect(list[0].id).toBe(1);
      expect(list[1].id).toBe(2);
    });

    it('should have unique IDs for each toast', () => {
      service.success('A');
      service.warning('B');
      service.error('C');
      service.info('D');
      
      const ids = service.toasts().map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('toasts signal behavior', () => {
    it('should provide read-only toasts signal', () => {
      expect(service.toasts()).toEqual([]);
      
      service.success('Test');
      expect(service.toasts().length).toBe(1);
    });

    it('should return the same array instance (memoized signal value) each time toasts() is called', () => {
      service.success('Toast');
      
      const list1 = service.toasts();
      const list2 = service.toasts();
      
      expect(list1).toEqual(list2);
      expect(list1).toBe(list2);
    });

    it('should be reactive - updates reflect in signal', () => {
      service.success('Initial');
      expect(service.toasts().length).toBe(1);
      
      service.success('Second');
      expect(service.toasts().length).toBe(2);
      
      service.remove(service.toasts()[0].id);
      expect(service.toasts().length).toBe(1);
    });
  });

  describe('message parameter default', () => {
    it('should default message to empty string when not provided', () => {
      service.success('Title');
      
      const toast = service.toasts()[0];
      expect(toast.mensaje).toBe('');
    });

    it('should use provided empty message', () => {
      service.warning('Title', '');
      
      const toast = service.toasts()[0];
      expect(toast.mensaje).toBe('');
    });

    it('should distinguish between undefined and empty message', () => {
      service.success('Title1');
      service.success('Title2', '');
      
      const list = service.toasts();
      expect(list[0].mensaje).toBe('');
      expect(list[1].mensaje).toBe('');
    });
  });
});
