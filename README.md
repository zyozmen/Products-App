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
npm run typecheck        # Comprueba los tipos TypeScript
npm run preview          # Sirve localmente la compilacion producida
npm run test             # Ejecuta Vitest en modo interactivo
npm run test -- --run    # Ejecuta Vitest una vez y termina
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
- `/admin`: dashboard de administracion con acceso a ordenes, usuarios, proveedores, reporte y alta de productos (solo admin; se abre desde el boton "Administracion" del menu de perfil)
- `/admin/orders`: kanban de ordenes (solo admin)
- `/admin/orders/report`: reporte de ordenes (solo admin)
- `/admin/proveedores`: gestion de proveedores, saldos, recepcion de lotes y abonos (solo admin)
- `/createProduct`: alta de productos (solo admin)
- `/editProduct/:productId`: edicion de productos (solo admin)
- `/welcome/:name`: bienvenida personalizada

## Tecnologias

- **TanStack Query:** gestiona consultas y mutaciones del servidor. Las mutaciones invalidan las consultas afectadas para mantener sincronizada la cache.
- **React Hook Form y Zod:** gestionan formularios y validaciones en registro/inicio de sesion, perfil, checkout, administracion de productos, proveedores y dialogos de ordenes.
- **Tailwind CSS:** estiliza la interfaz con el prefijo `hu-`. Los componentes compartidos de `src/components/ui/shadcn.tsx` tienen estilo shadcn/ui, pero son componentes locales y no dependen de la libreria oficial shadcn/ui ni de Radix.
- **CSS base:** `src/index.css` define los estilos globales y el tema oscuro; Swiper aporta los estilos del carrusel.

El Kanban de ordenes obtiene las ordenes desde TanStack Query, sin mantener una copia local de los datos del servidor. Los cambios de estado y otras mutaciones invalidan la cache para refrescar la vista. El carrito, en cambio, conserva su estado local persistido mediante `CartService`; no es dato remoto gestionado por TanStack Query.

El formulario de reseñas del detalle valida sus campos, pero no puede guardar reseñas: el backend documentado no ofrece un servicio o endpoint de envio de reseñas. La lista visible actualmente es de ejemplo.

## Guia de estilo (flat design verde)

Tailwind usa el prefijo `hu-` y `preflight` desactivado, por lo que los bordes y botones nativos necesitan `hu-border-0`/`hu-border-solid` y `hu-bg-transparent` explicitos.

### Colores

| Uso | Clase Tailwind | Ejemplo |
|---|---|---|
| Fondo oscuro de paneles, dashboard admin y header interno | `hu-bg-green-950`, degradado `hu-from-green-800 hu-to-green-950` | Header fuera de `/` |
| Tarjetas sobre fondo oscuro | `hu-bg-green-900` | Tarjetas de `/admin` |
| Botones primarios, foco, paginacion, enlaces | `hu-bg-green-700` (hover `-800`), `hu-ring-green-500`, `hu-text-green-700` | `Button` de `shadcn.tsx` |
| Acento / resaltado sobre fondo oscuro | `hu-text-green-400` | Titulo del hero |
| Item activo del menu | `hu-border-b-2 hu-border-green-400` | Navegacion del header |
| Fondos de pagina admin | `hu-bg-slate-50` con texto `hu-text-slate-900`; secundario `hu-text-slate-500` | Usuarios, Reporte, Proveedores |
| Estados (badges) | tonos `green`, `amber`, `red`, `blue` de `Badge` | El azul se conserva solo para estados informativos |

Regla: los botones de login, registro y modales son verdes; no usar `blue-*` para acciones.

### Tipografia

- **Principal / titulos:** `hu-font-display` (Franklin Gothic Heavy, con fallback Libre Franklin 800/900, Arial Black).
- **Complementaria / global:** Inter (`hu-font-sans`, tambien definida en `body`).
- Las fuentes se cargan en `index.html` y se configuran en `tailwind.config.js`. Si dispones del archivo de Franklin Gothic Heavy, agregalo con `@font-face` en `index.css`.

### Header y hero

- `HeaderComponent` es transparente y absoluto solo en `/` y `/welcome`; en las demas paginas usa la imagen de fondo `public/img/Fondo-head.jpg` (clase `.site-header-bg` en `HeaderComponent.css`).
- Incluye logo, menu (Marketplace, Cursos Online, Legal, Blog), tema, perfil, busqueda y carrito.
- El menu de perfil (`DropdownMenu`) acepta `buttonClassName`, `menuClassName`, `panelClassName` y `ariaLabel` para personalizar su estilo.
- El hero (`SwiperCarousel`) ocupa todo el ancho; su texto sale de las claves `hero_*` en `src/services/translations/es.js` y `en.js`.

### Navegacion de administracion

`AdminNav` (`src/components/admin/AdminNav.jsx`) es la barra de pestanas compartida: Administracion, Ordenes, Usuarios, Proveedores y Reporte. Para usarla en una pagina admin nueva, colocar `<AdminNav />` justo debajo del header y usar el contenedor `hu-mx-auto hu-w-full hu-max-w-[1600px] hu-px-4 hu-py-8 md:hu-px-8`.

### Tema oscuro

Se activa con `body.dark-theme`; `index.css` sobrescribe con `!important` una lista fija de clases slate/white. Los colores fuera de esa lista (badges, avisos `green-50`, `amber-50`) no se adaptan: agregar su regla en `index.css`. Ejemplo para borde blanco en tarjetas: dar a la tarjeta una clase propia (p. ej. `app-card`) y agregar `body.dark-theme .app-card { border-color: #fff !important; }`.

## Formatos y tamaños de imagenes

Recomendaciones segun como se muestra cada imagen en la interfaz. Usar JPG o WebP (calidad 80-85) para fotos y PNG/WebP solo cuando se necesite transparencia. Peso objetivo: menos de 300 KB por imagen (hero: menos de 500 KB). Evitar texto incrustado en las imagenes.

| Tipo | Ubicacion | Formato | Tamaño recomendado | Relacion | Como se recorta |
|---|---|---|---|---|---|
| Hero del carrusel | `public/img/hero-home.jpg` (`CarrouselComponent`) | JPG / WebP | 1920 x 780 px (minimo 1600 px de ancho) | ~2.4:1 | `object-cover`, ocupa todo el ancho y ~88vh; mantener el sujeto a la derecha porque el texto va a la izquierda |
| Tarjetas de oferta (bajo el hero) | `CarrouselComponent` | JPG / WebP | 1200 x 600 px | 2:1 | `object-cover` con opacidad |
| Producto (listado) | `ProductListComponent` | JPG / WebP | 800 x 800 px | 1:1 | `object-cover` a 280 px de alto; dejar margen alrededor del producto |
| Producto (detalle / galeria) | `ImageCarousel` | JPG / WebP | 1200 x 900 px | 4:3 | `object-contain`, no se recorta; fondo claro uniforme |
| Miniatura de carrito | `ShoppingCarComponent` | misma imagen del producto | se escala a 56 x 56 px | 1:1 | `object-cover` |
| Categoria | `public/img/cat-<category_id>.jpg` (`CategoryComponent`) | JPG | 400 x 400 px | 1:1 | `object-cover` a 96 x 96 px |
| Fondo del header | `public/img/Fondo-head.jpg` (`.site-header-bg` en `HeaderComponent.css`) | JPG / WebP | 1920 x 194 px (96 dpi; actual: ~42 KB) | ~10:1 | `cover` centrado; el header mide ~80-100 px de alto, asi que se recorta arriba y abajo. Mantener tonos verde oscuro (texto blanco encima), zona clara a la izquierda y el detalle visual a la derecha. Para pantallas retina usar 3840 x 388 px |
| Logo | `public/img/logo-cheyn-verde.png` | PNG transparente | 400 x 313 px | ~1.3:1 | se muestra a 80 px de alto |

Notas:
- Las imagenes de categoria deben nombrarse `cat-<category_id>.jpg` y ubicarse en `public/img/`.
- Las imagenes de producto se suben desde `/createProduct` (`accept="image/*"`); deben ser cuadradas para verse bien en el listado.
- Para pantallas de alta densidad se pueden subir al doble de tamaño, sin superar el peso objetivo.

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
- **Soporte de Estilos:** Se aplica mediante la clase `dark-theme` en el `<body>`, con reglas en `index.css` que ajustan fondos, textos y bordes de las utilidades Tailwind.

## Gestión de Proveedores y Saldos (HU-01)

El acceso a Administrar Ordenes en el panel y su pestana, asi como el menu de administracion del encabezado, muestran un contador de todas las ordenes en estado `CREADA` (incluidas PQR), independiente del filtro de fecha del tablero. Solo se consulta para administradores, reutilizando `GET /api/admin/orders` y la cache de React Query. Se actualiza al crear ordenes o cambiar su estado en esta sesion y cada 30 segundos mientras la aplicacion esta activa para detectar cambios externos. El contador se oculta si no hay ordenes creadas; si falla la consulta, se muestra un error en lugar de asumir cero.

La ruta `/admin/proveedores` permite crear proveedores y buscarlos por nombre o NIT, con resultados paginados de 20 registros y acceso al detalle. Se consulta `GET /api/proveedores?buscar=...&page=0&size=20`: la respuesta es un arreglo de proveedores y el encabezado `X-Total-Count` indica el total de coincidencias. Si el backend se sirve desde otro origen, debe exponer ese encabezado mediante CORS (`Access-Control-Expose-Headers: X-Total-Count`). Una busqueda vacia lista todos; el backend aplica coincidencia parcial literal en nombre o NIT sin distinguir mayusculas, conservando acentos, puntuacion y espacios internos. Tambien se mantiene la consulta directa por ID de 24 caracteres.

Los resultados incluyen proveedores activos e inactivos; ambos se pueden consultar, pero solo los activos pueden recibir lotes. En el detalle se pueden recibir lotes con contenedores, registrar abonos, consultar su historial y evaluar el monto liquidable de ventas/PQR. Los formularios usan React Hook Form y Zod; las consultas y mutaciones se gestionan con TanStack Query. El endpoint de liquidaciones solo evalua el monto y no modifica el inventario.

Al entrar al detalle se muestran los saldos y cuatro botones: **Recibir lote**, **Registrar un abono**, **Buscar un lote** y **Ver histórico de abonos**. Cada boton abre su seccion y oculta las demas; al pulsarlo de nuevo, la cierra. Cambiar de seccion conserva los datos ingresados durante la consulta del mismo proveedor.

Una cuarta tarjeta del resumen muestra **Lotes pagados** y **Lotes por pagar**, usando `lotesPagados` y `lotesPorPagar` de `GET /api/proveedores/{id}`. Son conteos globales, sin filtros ni paginacion: saldo de lote cero significa pagado; saldo positivo incluye pendientes y pagos parciales. Sin lotes, ambos valores son cero. No representan contenedores ni se calculan desde la pagina visible. Si la API omite los conteos o devuelve valores invalidos, se muestra un error en lugar de asumir cero. El detalle se refresca despues de recibir lotes o registrar pagos.

Al recibir un lote, cada tarjeta de cepa/contenedor se puede contraer sin perder los datos. Comienza expandida y muestra en el encabezado un icono verde con **Datos completos** cuando cumple la validacion del contenedor; el indicador se retira si algun dato deja de ser valido. Al intentar guardar, las tarjetas con errores se expanden para permitir corregirlos.

El listado de lotes consulta `GET /api/proveedores/{id}/lotes?buscar=...&page=0&size=10&sort=fechaIngreso,desc`, mediante `URLSearchParams`, y lee el total de `X-Total-Count`. Se pagina en el servidor, con los mas recientes primero. Busca parcialmente por cepa, nombre de presentacion o SKU; solo recorta espacios exteriores y conserva caracteres especiales como texto literal. Una busqueda vacia lista todos, incluidos lotes saldados e historicos. El backend filtra por proveedor antes de paginar y devuelve cada lote con todos sus contenedores y presentaciones. Los ordenamientos permitidos son `fechaIngreso`, `codigoLote`, `costoTotalLote` y `saldoPendienteLote`, con una sola direccion `asc` o `desc`. Al cambiar busqueda, proveedor u orden se reinicia la pagina. Recibir, abonar o empaquetar invalida el listado para refrescar resultados y saldos; tambien hay un boton de actualizacion manual. La consulta directa por ID se conserva como opcion adicional.

La vista usa TypeScript, Tailwind CSS con utilidades prefijadas y componentes de interfaz locales con estilo shadcn/ui.

El historial de abonos usa paginacion del servidor mediante `GET /api/proveedores/{id}/abonos?page=0&size=50`. Cada respuesta contiene un arreglo de hasta 50 movimientos y el encabezado `X-Total-Count` con el total real (tambien debe exponerse por CORS si aplica). El servidor ordena por fecha descendente y, en caso de empate, por ID descendente. Los botones consultan cada pagina por separado y las recepciones/pagos invalidan todas las paginas del historial.

Organizacion del modulo: componentes en `src/components/admin/suppliers`, servicio en `src/services/supplierService.ts`, hooks en `src/hooks/useSupplierQueries.ts`, esquemas en `src/schemas/supplier.ts`, tipos en `src/Interfaces/supplier.ts`, calculos en `src/utils/supplierCalculations.ts` y pruebas en `src/test/suppliers`.

### Desglose y publicacion de contenedores (HU-03)

En el detalle del proveedor, busca un lote en el listado paginado o consultalo por ID. Las tarjetas de contenedores comienzan contraidas; su encabezado muestra codigo, cepa/tipo y capacidad. Se expanden de forma independiente al pulsar el encabezado, con soporte de teclado, y conservan los datos del desglose al contraerlas. Cada contenedor ofrece **Desglosar contenedor**. El formulario agrega presentaciones nuevas sin sustituir las existentes; muestra capacidad, costo calculado, unidades creadas y margen estimado. El minimo sugerido equivale al costo base sin margen (no se aplica un porcentaje comercial no definido).

El SKU es opcional en el formulario: si queda vacio o solo contiene espacios, se genera como `codigoLote-codigoContenedor-nombre`, recortando espacios al inicio y final de cada parte. Si faltan los codigos, se usan los IDs del lote/contenedor. Los SKU manuales se conservan (recortados). El SKU efectivo se muestra como ayuda y se valida antes de confirmar o enviar: maximo 100 caracteres, sin duplicados en la solicitud ni entre las presentaciones conocidas del contenedor. No se truncan ni se agregan sufijos automaticamente; ante una colision o un nombre demasiado largo se debe escribir un SKU manual.

La capacidad incluye las unidades originalmente creadas de las presentaciones existentes, no el stock restante despues de ventas. Al superar el 100%, se bloquea el guardado. Un precio menor al costo abre un dialogo de confirmacion antes del POST; cancelar conserva los datos y no envia solicitudes. Confirmar envia `confirmacionMargenNegativo: true` solo en las filas con margen negativo. Los errores conservan los datos; un timeout no provoca reintentos automaticos y exige verificar el lote antes de repetir.

`POST /api/v1/lotes/{loteId}/contenedores/{contenedorId}/presentaciones` recibe un arreglo JSON, no un objeto envolvente. Los decimales se mantienen como texto en el formulario, se calculan con enteros escalados y se serializan como numeros JSON para conservar hasta 15 enteros y 3/2 decimales sin redondearlos previamente con `Number`. La respuesta del servidor actualiza el lote en cache e invalida las consultas existentes de productos; no modifica ni recalcula saldos de proveedores. El catalogo legado no se reemplaza: la publicacion en `productos_marketplace` corresponde al endpoint de HU-03; su exposicion por los endpoints de lectura del Marketplace depende del backend.

Las imagenes opcionales admiten PNG, JPG, JPEG y WebP de hasta 204800 bytes (200 KiB). Se validan extension, nombre, MIME si existe, Base64 y tamano; se envian como `fotografia: { nombre, extension, filepart }` sin prefijo `data:` ni multipart. La previsualizacion agrega ese prefijo solo para mostrar la imagen. No se usa el endpoint legado de imagenes. Las presentaciones inactivas se guardan sin anunciarse como publicadas.

Componentes: `DesgloseContenedorForm.tsx`, `CapacidadBar.tsx` y `MargenNegativoModal.tsx` en `src/components/admin/suppliers`; esquema `src/schemas/presentaciones.ts`; hook `src/hooks/useDesgloseContenedor.ts`; pruebas HU-03 en `src/test/suppliers`.

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
