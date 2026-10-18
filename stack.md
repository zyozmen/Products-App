# Stack Tecnológico del Proyecto

## Frontend
- React 19 y React DOM
- Vite 8 como servidor de desarrollo y bundler
- React Router DOM 7 para navegación
- JavaScript/JSX para las vistas existentes y TypeScript/TSX para HU-01, con TypeScript habilitado para migración incremental

## UI y estilos
- Bootstrap y CSS propio en las vistas existentes
- Tailwind CSS 3 para HU-01, con prefijo `hu-` y preflight deshabilitado para coexistir con Bootstrap
- Componentes locales con estilo shadcn/ui
- Animate.css y Font Awesome

## Formularios y datos
- TanStack Query para consultas, caché y mutaciones
- React Hook Form y Zod para formularios y validación
- Axios para consumo de APIs; el cliente global conserva los interceptores de autenticación existentes

## Testing
- Vitest
- Testing Library React, DOM y User Event
- `npm run typecheck` para comprobar TypeScript

## Runtime y despliegue
- Node.js 20 o superior
- Docker y Nginx
- Jenkins para CI/CD

## Gestión de paquetes
- npm
