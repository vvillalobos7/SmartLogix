# SmartLogix — Frontend Angular

Aplicación web de gestión logística. SPA construida con Angular 21 y Tailwind CSS, conectada al backend a través del API Gateway (BFF).

## Stack técnico

| Componente | Versión |
|---|---|
| Angular | 21 |
| TypeScript | 5.x |
| Tailwind CSS | 3.x |
| RxJS | 7.x |

## Estructura de módulos

```
src/app/
├── core/
│   ├── guards/          → authGuard, roleGuard
│   ├── interceptors/    → authInterceptor (JWT), errorInterceptor
│   └── services/        → AuthService, ToastService
├── features/
│   ├── login/           → Inicio de sesión
│   ├── registro/        → Registro de clientes
│   ├── recuperar/       → Recuperación de contraseña
│   ├── dashboard/       → KPIs diferenciados por rol
│   ├── productos/       → Catálogo, CRUD, filtros país/bodega, imágenes
│   ├── inventario/      → Bodegas, pasillos, estantes, est_pasi
│   ├── ordenes/         → Órdenes, historial de estados, nuevo pedido
│   ├── envios/          → Seguimiento de envíos
│   ├── usuarios/        → Gestión de usuarios y asignación de roles
│   └── perfil/          → Mi Perfil: dirección de entrega (solo cliente)
└── shared/
    ├── models/          → models.ts — interfaces TypeScript del dominio
    └── components/      → ToastComponent
```

## Rutas y roles

| Ruta | Roles permitidos |
|---|---|
| `/dashboard` | admin, bodeguero, transportista, cliente |
| `/productos` | admin, bodeguero |
| `/inventario` | admin, bodeguero |
| `/ordenes` | admin, bodeguero, transportista, cliente |
| `/envios` | admin, bodeguero, transportista |
| `/usuarios` | admin |
| `/perfil` | cliente |

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | admin@smartlogix.cl | admin123 |
| Bodeguero | bodeguero@smartlogix.cl | bodega123 |
| Transportista | transportista@smartlogix.cl | trans123 |
| Cliente | cliente@smartlogix.cl | cliente123 |

## Patrones aplicados

- **BFF** — toda comunicación pasa por el Gateway; el frontend nunca llama microservicios directamente.
- **Observer (RxJS BehaviorSubject)** — estado reactivo en cada service.
- **Interceptor** — JWT automático y manejo global de errores 401/403.
- **Guard** — `authGuard` para rutas autenticadas; `roleGuard` para restricción por rol.
- **Lazy Loading** — cada feature se carga bajo demanda con `loadComponent`.

---

*Documentación original de Angular CLI:*

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
