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

La aplicacion se inicia en [http://localhost:4200](http://localhost:4200). El backend debe estar disponible en el puerto `8080`.

Durante el desarrollo, el frontend solicita `/api/productos` y Vite reenvia las rutas `/api/*` al host definido por `VITE_APP_PRODUCTS_API_URL`. Asi, el navegador usa el mismo origen del frontend y no necesita conectarse directamente al backend. Puedes abrir la aplicacion con `localhost` o `127.0.0.1`.

Despues de cambiar la URL del backend en `.env.local`, reinicia Vite para que actualice el destino del proxy.

En Linux o macOS, el segundo comando equivalente es:

```bash
cp .env.example .env.local
```

## Variables de entorno

La configuracion minima se encuentra en `.env.example`:

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | Base general de la API | `/api` |
| `VITE_APP_PRODUCTS_API_URL` | Endpoint del backend; Vite usa su origen como destino del proxy local | `http://127.0.0.1:8080/api/productos` |
| `VITE_APP_NAME` | Nombre de la aplicacion | `GrowShop` |
| `VITE_WHATSAPP_NUMBER` | Numero de destino de checkout, con codigo de pais y solo digitos | `573124058166` |

Usa `.env.local` para la configuracion de desarrollo; este archivo no se publica en Git. Las variables que empiezan por `VITE_` se incluyen en el frontend, asi que no pongas contrasenas, tokens ni credenciales de MongoDB en ellas. El checkout abre WhatsApp con el detalle del carrito y el total. En produccion, las solicitudes `/api/*` se reenvian desde Nginx al backend configurado con `BACKEND_HOST` y `BACKEND_PORT`.

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
- `/cart`: carrito de compra (requiere login para compra segura, autocompletado y opcion de tercero receptor)
- `/login`: inicio de sesion e inicio de registro de clientes con validacion de edad
- `/profile`: administracion del perfil del usuario (edicion de datos y cambio de contraseña)
- `/admin/users`: panel de administracion de usuarios (solo admin; activa/inactiva cuentas y restablece claves)
- `/createProduct`: alta de productos (solo admin)
- `/welcome/:name`: bienvenida personalizada

## Gestión de Usuarios, Perfiles y Preferencias

Hemos integrado un completo sistema transaccional de usuarios conectado al backend:

### 1. Registro e Inicio de Sesión
- **Registro de Clientes:** Formulario deslizable en `/login` que recopila información básica (Nombre, Apellido, Dirección, Teléfono, Tipo de Identificación, Número de Identificación y Consentimiento de mayoría de edad). Todos los registros se guardan con rol `'cliente'`.
- **Control de Actividad:** El inicio de sesión valida si el usuario está activo. Las cuentas inactivadas por el administrador tienen el acceso bloqueado de forma inmediata.

### 2. Administración de Perfil de Usuario (`/profile`)
- **Edición Transaccional:** Cada usuario logueado puede acceder a su perfil en el dropdown *"Mi Cuenta"* para actualizar sus datos personales o cambiar su contraseña.
- **Sincronización:** Los cambios se actualizan en el backend y se sincronizan al instante en `sessionStorage` para que todas las vistas de la aplicación (como el carrito de compras) reflejen los nuevos datos de inmediato.

### 3. Panel de Administración de Usuarios (`/admin/users`)
- **Restricción de Rol:** Ruta con guardias de seguridad asíncronas accesible únicamente para usuarios con rol de administrador (`isUserAdmin`).
- **Activación/Inactivación:** Permite alternar el estado activo/inactivo de cualquier cuenta para suspender accesos (protegiendo la cuenta maestra `admin`).
- **Restablecer Contraseñas:** Opción para que el administrador restablezca de forma segura la contraseña de cualquier usuario en la base de datos a través de la API.

### 4. Compra Segura y Autocompletado
- **Acceso Restringido:** Solo usuarios registrados y logueados pueden proceder al pago del carrito. Los usuarios invitados son guiados a iniciar sesión.
- **Formulario Inteligente:** Al cargar el carrito, los datos de contacto y entrega se pre-llenan con el perfil del usuario logueado.
- **Recibe un Tercero:** Se incluye un checkbox dinámico *"¿Recibe otra persona?"* que, al seleccionarse, muestra de forma obligatoria un campo para ingresar el nombre del destinatario alternativo.

### 5. Control de Edad (+18)
- **Advertencia Obligatoria:** Si un usuario no registrado ingresa al e-commerce, se muestra un modal overlay de confirmación de mayoría de edad.
- **Restricción:** El acceso es denegado y se redirige al usuario fuera de la web si indica ser menor de edad. La confirmación es persistente en `sessionStorage` por sesión.

### 6. Tema Claro / Oscuro (Dark Mode)
- **Interruptor Global:** Botón con icono dinámico (Sol/Luna) en el menú superior para cambiar el tema en toda la aplicación de manera instantánea.
- **Persistencia:** Guarda la selección en `localStorage` (`growShopTheme`) para recordar la preferencia del usuario en futuras visitas.
- **Soporte de Estilos:** Estructurado mediante clases de CSS en `index.css` acopladas dinámicamente al `<body>` para alternar la visualización de cards, tablas, formularios y fondos de forma armoniosa con el diseño de la tienda.

## Ejecucion con Docker

La imagen usa una etapa de build con Node.js y una etapa final con Nginx. Nginx reenvia las solicitudes `/api/*` al backend; el backend debe ser accesible desde el contenedor:

```bash
docker build -t products-frontend .
docker run --rm -p 8080:80 products-frontend
```

La aplicacion quedara disponible en [http://localhost:8080](http://localhost:8080). Si el backend usa un nombre de servicio distinto al valor predeterminado `Products-Api`, configura `BACKEND_HOST` y `BACKEND_PORT` durante el build:

```bash
docker build \
	--build-arg BACKEND_HOST=products-api \
	--build-arg BACKEND_PORT=8080 \
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
