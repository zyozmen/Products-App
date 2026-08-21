# Products App

Frontend de e-commerce para GrowShop, desarrollado con React 19, Vite y React Router. Incluye catalogo de productos, filtros, detalle de producto, carrito, autenticacion y creacion de productos.

## Requisitos

- Node.js 20 o superior
- npm
- Docker, solo si se desea construir o ejecutar la imagen del frontend

## Instalacion y desarrollo

```bash
npm install
copy .env.example .env.local
npm run dev
```

La aplicacion se inicia en [http://localhost:4200](http://localhost:4200).

En Linux o macOS, el segundo comando equivalente es:

```bash
cp .env.example .env.local
```

## Variables de entorno

Vite expone al frontend las variables que comienzan por `VITE_`. La configuracion minima se encuentra en `.env.example`:

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | Base general de la API | `/api` |
| `VITE_APP_PRODUCTS_API_URL` | Endpoint de productos | `http://localhost:8080/api/productos` |
| `VITE_APP_NAME` | Nombre de la aplicacion | `GrowShop` |

Usa `.env.local` para la configuracion de desarrollo y evita publicar credenciales o URLs sensibles.

## Scripts disponibles

```bash
npm run dev              # Servidor de desarrollo en el puerto 4200
npm run start            # Alias del servidor de desarrollo
npm run build            # Genera la aplicacion en build/
npm run preview          # Sirve localmente la compilacion producida
npm run test             # Ejecuta Vitest en modo interactivo
npm run test:coverage    # Ejecuta pruebas y genera cobertura
```

## Funcionalidades y rutas

- `/`: pagina de bienvenida
- `/shop`: catalogo y filtros de productos
- `/product/:id`: detalle de un producto
- `/cart`: carrito de compra
- `/login`: inicio de sesion
- `/createProduct`: alta de productos
- `/welcome/:name`: bienvenida personalizada

## Ejecucion con Docker

La imagen usa una etapa de build con Node.js y una etapa final con Nginx:

```bash
docker build -t products-frontend .
docker run --rm -p 8080:80 products-frontend
```

La aplicacion quedara disponible en [http://localhost:8080](http://localhost:8080). Los argumentos `VITE_APP_API_URL` y `VITE_APP_PRODUCTS_API_URL` pueden definirse durante el build:

```bash
docker build \
	--build-arg VITE_APP_PRODUCTS_API_URL=http://localhost:8080/api/productos \
	-t products-frontend .
```

## CI/CD y despliegue

El pipeline de `Jenkinsfile` ejecuta instalacion de dependencias, pruebas con cobertura, build y analisis SonarQube. Ademas:

- En `develop`, construye y ejecuta el frontend en Docker en el puerto 80.
- En `main`, aprovisiona la infraestructura con Terraform y publica `build/` en AWS S3, seguido de una invalidacion de CloudFront.

Antes de ejecutar Jenkins, configura sus credenciales con el script incluido:

```bash
JENKINS_TOKEN="tu-token-jenkins" \
SONAR_TOKEN="tu-token-sonar" \
AWS_ACCESS_KEY_ID="tu-access-key" \
AWS_SECRET_ACCESS_KEY="tu-secret-key" \
bash scripts/setup-jenkins-config.sh
```

Para validar el script sin modificar Jenkins:

```bash
DRY_RUN=1 bash scripts/setup-jenkins-config.sh
```

## Estructura principal

- `src/components/`: paginas y componentes de la interfaz
- `src/services/`: acceso a productos, autenticacion, carrito y favoritos
- `src/Interfaces/`: interfaces y transformacion de datos
- `public/`: recursos estaticos
- `dockerfile`: imagen de produccion con Nginx
- `nginx/`: plantilla de configuracion del servidor web
- `Jenkinsfile`: pipeline de CI/CD
- `Main.tf`: infraestructura de AWS con Terraform

## Validacion local

```bash
npm run test:coverage
npm run build
```
