# Products App

Aplicaci�n frontend de e-commerce desarrollada con React y Vite. El proyecto incluye cat�logo de productos, carrito, login, vistas de administraci�n y un flujo de despliegue basado en ramas.

## Requisitos

- Node.js 20+
- npm
- Docker y Docker Compose (opcional para desarrollo local)

## Primeros pasos

```bash
npm install
npm run dev
```

La aplicaci�n quedar� disponible en:
- http://localhost:4200

## Scripts disponibles

```bash
npm run dev
npm run dev:docker
npm run dev:docker:down
npm run build
npm run test
npm run test:coverage
```

## Desarrollo local con Docker

Para levantar el entorno completo con frontend y MongoDB:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Servicios incluidos:
- Frontend: http://localhost:4200
- MongoDB: localhost:27017

Para detener el entorno:

```bash
docker compose -f docker-compose.dev.yml down --remove-orphans
```

## Flujo de despliegue por ramas

- main: ejecuta build, pruebas, an�lisis SonarQube, provisioning con Terraform y despliegue a AWS S3/CloudFront.
- develop: ejecuta build, pruebas, an�lisis SonarQube y despliegue local con Docker.
- otras ramas: ejecutan an�lisis de SonarQube y validaciones b�sicas, sin despliegues productivos.
## Preparación previa de Jenkins

Antes de ejecutar el pipeline, configura las credenciales en Jenkins desde la máquina/host que tenga acceso al servidor Jenkins. El script de apoyo crea los secrets de Jenkins y no depende de que el pipeline haya creado un contenedor previamente.

```bash
JENKINS_TOKEN="tu-token-jenkins" \
SONAR_TOKEN="tu-token-sonar" \
AWS_ACCESS_KEY_ID="tu-access-key" \
AWS_SECRET_ACCESS_KEY="tu-secret-key" \
bash scripts/setup-jenkins-config.sh
```

Para probar sin escribir realmente en Jenkins:

```bash
DRY_RUN=1 bash scripts/setup-jenkins-config.sh
```
## Estructura principal

- src/components: vistas y componentes de la interfaz
- src/services: servicios para productos, autenticaci�n, carrito y peticiones HTTP
- src/interfaces: mapeo y transformaci�n de datos
- docker-compose.dev.yml: entorno local de desarrollo
- Jenkinsfile: pipeline CI/CD
- Main.tf: infraestructura base para despliegue en AWS

## Calidad y validaci�n

```bash
npm run build
npm run test:coverage
```

## Notas de desarrollo

- El proyecto incluye un modo de desarrollo con datos mock por defecto para que un nuevo integrante pueda arrancar sin configurar un backend externo.
- Si deseas conectar un backend real, puedes configurar la variable de entorno VITE_APP_PRODUCTS_API_URL.
