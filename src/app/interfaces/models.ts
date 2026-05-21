// =============================================
// SmartLogix — Interfaces / Models TypeScript
// =============================================

// --- USUARIOS & ROLES ---

export interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Rol {
  id: string;         // ROL-01, ROL-02, ROL-03
  codigo: string;
  nombre: string;
  descripcion: string;
  permisos: string[]; // nombres de permisos
  color: string;
  totalUsuarios?: number;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  password?: string;
  fec_registro: string;
  id_rol: string;
  rol?: string;
  activo: boolean;
  avatar?: string;
}

export interface UsuarioRol {
  id_usuario: number;
  id_rol: string;
}

export interface RolPermiso {
  id_rol: string;
  id_permiso: string;
}

// --- BODEGAS ---

export interface Bodega {
  id_bodega: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  activa: boolean;
}

// --- PRODUCTOS ---

export interface Producto {
  id_producto: number;
  sku: string;           // VARCHAR 50
  nombre: string;        // VARCHAR 200
  descripcion: string;   // CLOB
  peso: number;          // NUMBER (kg)
  id_bodega: number;     // FK
  bodega?: string;
  precio: number;
  categoria: string;
  imagen?: string;
}

// --- INVENTARIO ---

export interface Stock {
  id_stock: number;
  id_producto: number;
  id_bodega: number;
  producto?: string;
  sku?: string;
  bodega?: string;
  cant_disponible: number;
  cant_minima: number;
  cant_maxima: number;
  estado?: 'normal' | 'bajo' | 'agotado' | 'exceso';
}

export interface MovInventario {
  id_movimiento: number;
  id_producto: number;
  id_bodega: number;
  producto?: string;
  bodega?: string;
  tipo_movimiento: 'entrada' | 'salida' | 'transferencia' | 'ajuste';
  cantidad: number;
  fecha: string;
  referencia: string;
  usuario?: string;
}

// --- ESTADOS ---

export interface EstadoPedido {
  id_estado: number;
  nombre: string;
  descripcion: string;
  color: string;
  orden: number;
}

export interface EstadoEnvio {
  id_estado_envio: number;
  nombre: string;
  descripcion: string;
  color: string;
  orden: number;
}

// --- ÓRDENES / PEDIDOS ---

export interface LineaPedido {
  id_linea: number;
  id_pedido: number;
  id_producto: number;
  producto?: string;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface Pedido {
  id_pedido: number;
  fecha_pedido: string;
  id_estado: number;
  estado?: string;
  estado_color?: string;
  total: number;
  id_cliente: number;
  cliente?: string;
  email_cliente?: string;
  lineas?: LineaPedido[];
  id_estado_envio?: number;
  estado_envio?: string;
}

// --- DASHBOARD ---

export interface MetricaCard {
  titulo: string;
  valor: string | number;
  subtitulo: string;
  icono: string;
  color: string;
  tendencia?: number;
}

export interface MicroservicioStatus {
  nombre: string;
  puerto: number;
  estado: 'activo' | 'inactivo' | 'degradado';
  version: string;
  uptime: string;
}

export interface ActividadReciente {
  id: number;
  descripcion: string;
  modulo: string;
  tiempo: string;
  tipo: 'pedido' | 'inventario' | 'envio' | 'usuario' | 'sistema';
  icono: string;
}
