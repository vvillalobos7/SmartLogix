import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login',     loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)       },
  { path: 'registro',  loadComponent: () => import('./features/registro/registro.component').then(m => m.RegistroComponent) },
  { path: 'recuperar', loadComponent: () => import('./features/recuperar/recuperar.component').then(m => m.RecuperarComponent) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)   },
      { path: 'productos',  loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent)   },
      { path: 'inventario', loadComponent: () => import('./features/inventario/inventario.component').then(m => m.InventarioComponent) },
      { path: 'ordenes',    loadComponent: () => import('./features/ordenes/ordenes.component').then(m => m.OrdenesComponent)         },
      { path: 'envios',     loadComponent: () => import('./features/envios/envios.component').then(m => m.EnviosComponent)           },
      { path: 'estados',    loadComponent: () => import('./features/estados/estados.component').then(m => m.EstadosComponent)         },
      { path: 'usuarios',   loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)      },
      { path: 'roles',      loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent)               },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
