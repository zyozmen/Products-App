# Products App

Frontend de e-commerce de **GrowShop**, desarrollado con React 19, Vite 8, React Router 7 y TypeScript incremental. Incluye el marketplace de productos y presentaciones, carrito con checkout por WhatsApp, autenticación con gestión de sesión y un panel de administración de órdenes, usuarios, proveedores, lotes, productos, categorías y liquidación diaria.

Consume el backend **Products API** (Spring Boot + MongoDB) mediante rutas `/api/*`.

## Tabla de contenido

1. [Requisitos](#requisitos)
2. [Instalación y desarrollo](#instalación-y-desarrollo)
3. [Variables de entorno](#variables-de-entorno)
4. [Scripts disponibles](#scripts-disponibles)
5. [Rutas](#rutas)
6. [Marketplace (HU-05)](#marketplace-hu-05)
7. [Carrito y checkout](#carrito-y-checkout)
8. [Órdenes](#órdenes)
9. [Liquidación diaria (HU-04)](#liquidación-diaria-hu-04)
10. [Proveedores, lotes y empaquetado (HU-01 a HU-03)](#proveedores-lotes-y-empaquetado-hu-01-a-hu-03)
11. [Usuarios y sesión](#usuarios-y-sesión)
12. [Tecnologías](#tecnologías)
13. [Guía de estilo](#guía-de-estilo)
14. [Formatos y tamaños de imágenes](#formatos-y-tamaños-de-imágenes)
15. [Docker y despliegue](#docker-y-despliegue)
16. [Estructura principal](#estructura-principal)
17. [Validación local](#validación-local)
18. [Problemas conocidos](#problemas-conocidos)

## Requisitos

- Node.js 20 o superior y npm
- Backend Products API disponible (por defecto en `http://localhost:8080`)
- Docker, solo para construir o ejecutar la imagen del frontend

## Instalación y desarrollo

```bash
npm install
npm run dev
```

La aplicación se inicia en [http://localhost:4200](http://localhost:4200).

Crea un archivo `.env.local` (no se publica en Git) con la configuración de desarrollo, por ejemplo:

```dotenv
VITE_APP_PRODUCTS_API_URL=http://127.0.0.1:8080/api/productos
VITE_WHATSAPP_NUMBER=573134312139
```

Durante el desarrollo, el frontend solicita rutas relativas `/api/*` y Vite las reenvía (proxy) al **origen** de `VITE_APP_PRODUCTS_API_URL`. Así el navegador usa el mismo origen del frontend y no se conecta directamente al backend. Después de cambiar esa URL, reinicia Vite para actualizar el destino del proxy.

Si un cambio en el código no se refleja en el navegador (por ejemplo, tras varias ediciones rápidas del mismo archivo), recarga con Ctrl+F5 o reinicia `npm run dev`.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_APP_PRODUCTS_API_URL` | URL del backend. En desarrollo, Vite usa su origen como destino del proxy; la base de la API se obtiene quitando el sufijo `/productos`. | `http://localhost:8080` (proxy) |
| `VITE_API_URL` | Base de la API; tiene prioridad sobre la anterior. Se le agrega `/api` si no lo incluye. | `/api` en producción, `http://localhost:8080/api` en desarrollo |
| `VITE_WHATSAPP_NUMBER` | Número de destino del checkout, con código de país y solo dígitos. | `573134312139` |
| `VITE_INACTIVITY_MINUTES` | Minutos sin actividad antes del aviso de cierre de sesión. | `15` |
| `VITE_SESSION_REFRESH_MINUTES` | Minutos desde la emisión del token hasta su renovación. | `55` |

Las variables que empiezan por `VITE_` se incluyen en el código del navegador: no pongas contraseñas, tokens ni credenciales de MongoDB en ellas. Los archivos `.env.production` y `.env.staging` contienen la configuración de cada ambiente.

## Scripts disponibles

```bash
npm run dev              # Servidor de desarrollo en el puerto 4200 (alias: npm run start)
npm run build            # Genera la aplicación en build/
npm run preview          # Sirve localmente la compilación producida
npm run typecheck        # Comprueba los tipos TypeScript
npm run test             # Vitest en modo interactivo
npm run test -- --run    # Vitest una sola vez
npm run test:coverage    # Pruebas con reporte de cobertura
```

`npm run dev:docker` y `npm run dev:docker:down` requieren un archivo `docker-compose.dev.yml` que actualmente no está en el repositorio.

## Rutas

| Ruta | Acceso | Descripción |
| --- | --- | --- |
| `/`, `/welcome` | Público | Página de bienvenida: hero, destacados del mes y categorías |
| `/shop` | Público | Catálogo del marketplace agrupado por producto, con filtros de nombre, precio y categoría |
| `/producto/:cepaId/:presentacionId` | Público | Detalle de un producto con la presentación seleccionada |
| `/cart` | Público (compra con sesión) | Carrito y checkout |
| `/login` | Público | Inicio de sesión y registro de clientes |
| `/profile` | Autenticado | Datos personales y cambio de contraseña |
| `/orders` | Autenticado | Órdenes propias |
| `/admin` | ADMIN | Panel con accesos a todas las secciones de administración |
| `/admin/orders` | ADMIN | Tablero Kanban de órdenes y PQR |
| `/admin/orders/report` | ADMIN | Reporte de órdenes |
| `/admin/users` | ADMIN | Aprobación, activación e inactivación de usuarios y restablecimiento de contraseñas |
| `/admin/proveedores`, `/admin/proveedores/:id` | ADMIN | Proveedores, saldos, recepción de lotes, empaquetado y abonos |
| `/admin/liquidacion` | ADMIN | Liquidación diaria por proveedor y pagos vinculados a la jornada |
| `/admin/productos` | ADMIN | Productos (antes cepas): nombre, categorías y fotografía. `/admin/cepas` redirige aquí |
| `/admin/categories` | ADMIN | Categorías y sus imágenes |

El catálogo anterior de productos (`/api/productos`, `/product/:id`, `/createProduct` y `/editProduct/:productId`) se retiró del frontend: los productos son ahora las antiguas cepas, y se venden por presentaciones publicadas desde los lotes.

## Marketplace (HU-05)

### Administración de productos (`/admin/productos`)

- Crea, renombra y categoriza productos, y carga su fotografía principal.
- El listado usa `GET /api/products?page=0&size=20` y lee el total de `X-Total-Count`. Crear, consultar y editar usan `POST /api/products`, `GET /api/products/{id}` y `PUT /api/products/{id}` con el cuerpo `{ nombre, version, categoryIds }`.
- Renombrar envía la `version` vigente; una versión desactualizada o un nombre normalizado duplicado devuelve `409` y se pide recargar.
- La fotografía se envía como multipart `fotoPrincipal` a `POST /api/v1/images/{id}?target=PRODUCT`: PNG, JPG/JPEG o WebP de hasta 2 MiB, con MIME acorde a la extensión.
- Los productos deben existir antes de recibir lotes: cada contenedor del lote referencia el producto mediante `cepaId` (nombre de campo sin cambios en la API).

### Catálogo (`/shop`) y filtros

- `GET /api/marketplace/presentaciones` pagina por producto, de 20 en 20. Cada tarjeta muestra la fotografía del producto (o un marcador si no tiene), el número de presentaciones disponibles y el precio desde. Al abrirla se selecciona la presentación más económica.
- La barra lateral filtra por nombre, rangos de precio y selección múltiple de categorías, con panel desplegable en móvil y etiquetas para retirar categorías activas. Los filtros viven en la URL (`buscar`, `categoryIds` repetido, `minPrice`, `maxPrice`); los enlaces anteriores con `name`, `category` o `category_id` siguen funcionando. Cambiar un filtro reinicia la página.
- El filtrado y la paginación ocurren en el servidor. Un producto coincide con cualquiera de las categorías seleccionadas y con el rango de precio si alguna presentación activa con stock cumple ambos límites (inclusivos). El resultado conserva todas sus opciones y su `precioDesde`, aunque la opción más barata quede fuera del rango.

### Detalle (`/producto/:cepaId/:presentacionId`)

- Consulta `GET /api/marketplace/products/{productId}/presentaciones/{presentacionId}` y muestra todas las presentaciones activas con stock del producto, incluso de distintos lotes; cada una conserva su ID, SKU, precio, stock y fotografía.
- Las presentaciones se eligen con botones de opción; el precio principal es el precio unitario por la cantidad. Una presentación agotada o inexistente muestra "Presentación no disponible".

### Asignar categorías a un producto

1. Inicia sesión como `ADMIN` y abre `/admin/productos`.
2. En la tarjeta del producto, marca las categorías en **Categorías del producto**.
3. Pulsa **Guardar cambios** de esa tarjeta; debe aparecer **Producto actualizado.** (**Cargar fotografía** no guarda categorías).
4. Recarga para confirmar y prueba el filtro en `/shop`.

Para un producto nuevo, marca las categorías en **Nuevo producto** antes de pulsar **Crear producto**. Todas las presentaciones del producto comparten sus categorías; un producto sin categorías se ve sin filtro, pero no al filtrar por una categoría.

### Solución de problemas del catálogo

- **El marketplace no muestra productos:** verifica que existan presentaciones `ACTIVO` con stock mayor que cero (se publican al empaquetar contenedores) y que el backend en ejecución esté actualizado.
- **Una categoría no devuelve resultados:** revisa que el producto tenga `categoryIds` en `GET /api/products/{id}`.
- **El filtro de precio no cambia el listado:** confirma en la pestaña Red que la petición incluya `minPrice` y `maxPrice`, y que algún precio disponible esté dentro del rango.

## Carrito y checkout

- Los artículos se identifican por `presentationId` y la cantidad se limita al stock. El carrito se guarda en `localStorage` (`growShopCartItems`); los artículos del catálogo anterior se retiran y se avisa una sola vez.
- Solo usuarios con sesión pueden comprar. Los datos de entrega se precargan desde el perfil y se puede indicar que recibe otra persona.
- **Sin impuestos:** el total es igual al subtotal. La orden se crea con `POST /api/orders` enviando `items`, `delivery`, `subtotal` y `total`; el backend recalcula precios vigentes y responde `422` si no coinciden.
- Si el pedido falla por precio o stock, el carrito vuelve a consultar cada presentación, actualiza o marca como no disponibles sus artículos y pide revisarlos; no reenvía el pedido.
- Tras crear la orden se abre WhatsApp (`VITE_WHATSAPP_NUMBER`) con los productos, los datos de entrega y el **número de la orden creada** (`Orden: #123`). El mensaje se arma en `createWhatsAppCheckoutUrl` de `src/components/cart/ShoppingCarComponent.jsx`.

## Órdenes

### Tablero (`/admin/orders`)

- Estados: `CREADA`, `PAGADA`, `EMPACADA`, `ENTREGADA` y `CANCELADA`. Las órdenes se obtienen con TanStack Query y cada cambio de estado (`PUT /api/admin/orders/{id}/status`) vuelve a consultar órdenes, liquidación y stock del marketplace; no se mantiene una copia local.
- La pestaña de órdenes, la tarjeta del panel y el menú de administración muestran un contador de órdenes `CREADA` (incluidas PQR), reutilizando `GET /api/admin/orders`. Se actualiza tras cada cambio y cada 30 segundos; si la consulta falla se muestra un error en lugar de asumir cero.
- No hay reintentos automáticos y los diálogos bloquean el doble envío. Sin respuesta del servidor se informa que el cambio pudo aplicarse y se pide revisar la orden antes de repetir.

### Ventas normales (F2)

- Pagar envía `{"status":"PAGADA","cashOnDelivery":false}`: descuenta stock y reconoce el costo al proveedor en la liquidación.
- Una venta que pasó por PAGADA (PAGADA o EMPACADA, `paidAt` presente o contra entrega) ya no se puede cancelar; el servidor también lo rechaza con `409`. CREADA y las PQR conservan la cancelación.
- Un `409` muestra el mensaje del servidor y refresca el tablero; un `422` (snapshot de costo inválido) muestra el mensaje sin aplicar cambios.

### Contra entrega (F3)

- Pagar con **Contra entrega** envía `{"status":"PAGADA","cashOnDelivery":true}`: descuenta stock pero el costo se reconoce al entregar. Empacar no acumula.
- Al pasar de EMPACADA a ENTREGADA se piden efectivo y tarjeta, por ejemplo `{"status":"ENTREGADA","cashAmount":70000,"cardAmount":30000}` para una orden de $100.000. La suma debe igualar el total (tolerancia 0,01). Los errores de cobro (`400`/`422`) se muestran dentro del diálogo; un `409` lo cierra y refresca el tablero.
- El costo se imputa al día de entrega en hora de Bogotá.

### PQR (F4)

- **Crear PQR** (`POST /api/admin/orders/pqr`) con presentación y cantidad reales: valor comercial $0, descuenta stock y reconoce al proveedor el costo de las unidades en la jornada de creación (`createdAt` en hora de Bogotá).
- Sin respuesta del servidor no se reenvía el POST: se refresca el tablero y se pide verificar si la PQR aparece antes de crearla de nuevo, porque cada creación es una orden distinta.
- **Cancelar una PQR** solo en CREADA o EMPACADA. Restituye stock y revierte el costo en la jornada de creación (visible en "Revertido"); los pagos existentes no cambian y un exceso aparece en "Exceso pagado". Una PQR anterior al inicio de la acumulación solo restituye stock.

El reporte comercial (`/admin/orders/report`) no cambia: el costo reconocido al proveedor no es ingreso.

## Liquidación diaria (HU-04)

`/admin/liquidacion` consume `GET /api/v1/settlements/daily-summary?page=0&size=20` (rol ADMIN). Incluye la navegación y el detalle de **F6**; el cierre integrado T6-F6 requiere verificar contra un backend y datos reales.

- **Filtros:** selector de fecha, proveedor por ID o búsqueda paginada por nombre/NIT con `GET /api/proveedores?buscar=...&page=0&size=20`. El resumen admite `providerId` opcional (ObjectId hexadecimal de 24 caracteres, sin distinguir mayúsculas). Cambiar fecha, proveedor o tamaño reinicia la página. Las fechas inexistentes, IDs y páginas inválidos muestran un error sin consultar silenciosamente otra jornada.
- **Jornada:** se muestra la fecha que devuelve el backend, en hora de Bogotá (`America/Bogota`); el navegador no calcula el día. `/admin/liquidacion?date=AAAA-MM-DD` consulta otra jornada y ofrece **Ver jornada de hoy**. El sugerido de una jornada anterior usa el saldo global **actual**, no el saldo histórico.
- **Columnas:** proveedor, unidades vendidas, unidades PQR, costo de ventas, costo PQR, revertido, acumulado bruto, acumulado neto, pagos vinculados, pendiente del día, saldo del proveedor, sugerido a pagar, exceso pagado y la acción **Registrar pago**. Las unidades son de presentación.
- **Importes:** se leen del JSON como texto y se muestran en COP sin convertirlos a `Number`, sin redondear ni recalcular. Si falta un importe o la respuesta no es válida se muestra un error, nunca ceros.
- **Estados:** carga, error con reintento, estado vacío real y aviso cuando `activationPending` es `true`. Paginación con `page`, `totalPages` y `totalElements` del servidor.

### Detalle auditable (F6)

- **Ver movimientos** abre `GET /api/v1/settlements/daily-detail?date=AAAA-MM-DD&providerId=...&page=0&size=20`, exclusivamente dentro de la ruta ADMIN. Fecha y proveedor son obligatorios; `page` inicia en cero y `size` admite 1 a 100. La respuesta tiene `content`, `page`, `size`, `totalElements` y `totalPages`; conteo, agrupación de pagos y paginación son responsabilidad de MongoDB, nunca de una lista completa en el navegador.
- Se conserva el orden del backend: `timestamp` ascendente, luego `id` ascendente. Se distinguen `SALE`, `PQR`, `PQR_REVERSAL` y `PAYMENT`.
- Los reconocimientos muestran `orderId` (identificador numérico del backend; también se admite texto), `itemIndex` (desde cero), lote, contenedor, producto y presentación, contenido por unidad, cantidad, snapshot `unitCost`, costo base e importe cuando aplican. La reversión muestra `originalMovementId`, `date` de la jornada original y `timestamp` real de cancelación en Bogotá, junto al instante ISO exacto.
- Un pago se muestra una sola vez por `correlationId`, con `paymentType`, `amount`, observaciones e `allocations[{transactionId,lotId,amount}]`; no se inventan cantidades ni costos unitarios. Los importes del detalle también se leen como texto decimal exacto. Una respuesta inválida o con pagos duplicados en la página genera un error.
- Los IDs de orden/lote/transacción se muestran como referencias: no existen rutas ADMIN específicas para abrir esos registros. No se enlazan a endpoints públicos ni se exponen costos en ellos.
- Fecha, proveedor, tamaño y página del resumen quedan en la URL; `detailProviderId`, `detailDate` y `detailPage` conservan el detalle. **Volver al resumen** mantiene los filtros y su página. TanStack Query separa cada consulta por todos sus filtros y cancela consultas obsoletas mediante `AbortSignal`, evitando mezclar respuestas tardías.
- Backend: entradas inválidas deben devolver `400`, acceso sin ADMIN `401/403`. La validación frontend no sustituye estas garantías del servidor.

### Pagos generales o vinculados a la jornada (F5)

- **Registrar pago** en una fila abre el formulario de abonos vinculado al proveedor y a la jornada mostrada. Se envía `fechaLiquidacion` al endpoint existente `POST /api/proveedores/{id}/pagos`; la respuesta (`correlationId`, `asignaciones`) se muestra con el monto imputado a cada lote.
- El abono general de `/admin/proveedores/{id}` conserva su flujo y **nunca** envía `fechaLiquidacion` (tampoco la fecha de hoy).
- El valor sugerido se precarga como referencia editable, no como límite: se admiten pagos parciales o superiores mientras no superen el saldo del proveedor ni del lote. Se conserva el ID de lote opcional o la distribución FIFO.
- Antes de registrar, ambos flujos muestran proveedor, importe, jornada vinculada (o "Ninguna") y destino (lote o FIFO), y advierten cuando el pago supera el sugerido.
- El envío se bloquea mientras hay una petición en curso. Sin respuesta se indica que el pago pudo registrarse y se deshabilita la confirmación hasta verificar el historial y la liquidación.
- Tras éxito, o ante un error incierto, `409` o `5xx`, se recargan proveedor, abonos, lotes y liquidación. El **exceso pagado** es informativo: no es deuda negativa, no genera reembolso automático y el abono no se elimina.
- Limitación: el historial `GET /api/proveedores/{id}/abonos` no devuelve `fechaLiquidacion`; la jornada y la imputación del pago se pueden rastrear en el detalle auditable.

## Proveedores, lotes y empaquetado (HU-01 a HU-03)

### Proveedores (`/admin/proveedores`)

- Crear proveedores y buscarlos por nombre o NIT con `GET /api/proveedores?buscar=...&page=0&size=20` (arreglo + encabezado `X-Total-Count`; si el backend está en otro origen debe exponerlo por CORS). Búsqueda parcial literal sin distinguir mayúsculas; vacía lista todos. También se puede consultar por ID de 24 caracteres.
- Se listan activos e inactivos; solo los activos reciben lotes.
- El detalle muestra Total deuda, Total pagado, Saldo pendiente y **Lotes pagados / Lotes por pagar** (`lotesPagados`, `lotesPorPagar` de `GET /api/proveedores/{id}`; si faltan se muestra un error, no cero), y cuatro acciones: **Recibir lote**, **Registrar un abono**, **Buscar un lote** y **Ver histórico de abonos**. Cambiar de sección conserva los datos ingresados.

### Recepción y lotes

- Cada contenedor selecciona un producto registrado (`cepaId`), unidad base, capacidad y costo base; las tarjetas se pueden contraer sin perder datos y marcan **Datos completos** cuando son válidas. Al guardar con errores se expanden las tarjetas afectadas.
- El listado usa `GET /api/proveedores/{id}/lotes?buscar=...&page=0&size=10&sort=fechaIngreso,desc` con paginación del servidor. Busca por producto, nombre de presentación o SKU; ordena por `fechaIngreso`, `codigoLote`, `costoTotalLote` o `saldoPendienteLote`. Recibir, abonar o empaquetar invalida el listado.
- El historial de abonos usa `GET /api/proveedores/{id}/abonos?page=0&size=50`, ordenado por fecha descendente; los abonos FIFO aparecen como una fila por lote.

### Desglose y publicación de contenedores (HU-03)

- **Desglosar contenedor** agrega presentaciones nuevas sin sustituir las existentes; muestra capacidad, costo calculado, unidades creadas y margen estimado. Superar el 100% de la capacidad bloquea el guardado.
- El SKU es opcional: vacío se genera como `codigoLote-codigoContenedor-nombre`. Se valida (máximo 100 caracteres, sin duplicados) antes de enviar; no se trunca ni se agregan sufijos.
- Un precio menor al costo abre una confirmación; confirmar envía `confirmacionMargenNegativo: true` solo en esas filas.
- `POST /api/v1/lotes/{loteId}/contenedores/{contenedorId}/presentaciones` recibe un arreglo JSON. Los decimales se calculan con enteros escalados para no perder precisión. Las presentaciones activas se publican en el marketplace; las inactivas se guardan sin publicarse.
- Imágenes opcionales PNG, JPG, JPEG o WebP de hasta 200 KiB, enviadas como `fotografia: { nombre, extension, filepart }` en Base64 sin prefijo `data:`.
- Un timeout no provoca reintentos automáticos y exige verificar el lote antes de repetir.

Organización: componentes en `src/components/admin/suppliers`, servicio `src/services/supplierService.ts`, hooks `src/hooks/useSupplierQueries.ts` y `useDesgloseContenedor.ts`, esquemas `src/schemas/supplier.ts` y `presentaciones.ts`, tipos `src/Interfaces/supplier.ts`, cálculos `src/utils/supplierCalculations.ts` y pruebas en `src/test/suppliers`.

## Usuarios y sesión

- **Registro** (`/login`): usuario, correo, contraseña (mínimo 8 caracteres), nombre, apellido, dirección, teléfono, tipo y número de identificación y consentimiento de mayoría de edad. La cuenta se crea con rol cliente en estado `PENDIENTE` hasta que un administrador la apruebe.
- **Inicio de sesión** por correo y contraseña. Un usuario pendiente o inactivo no inicia sesión y ve el motivo.
- **Inactividad:** tras `VITE_INACTIVITY_MINUTES` (15 por defecto) sin actividad aparece un aviso con cuenta regresiva de 60 s. **Aceptar**, o no responder, cierra la sesión (`/api/auth/logout` con `reason: INACTIVITY`); **Cancelar** reinicia el contador.
- **Renovación del token:** el token dura 60 minutos y se renueva una vez con `/api/auth/refresh` a los 55 minutos. Las demás peticiones esperan la renovación en curso.
- **Perfil** (`/profile`): edición de datos y contraseña, sincronizados con `sessionStorage`.
- **Administración de usuarios** (`/admin/users`): aprobar, activar o inactivar cuentas (el administrador principal configurado en el backend está protegido) y restablecer contraseñas.
- **Control de edad:** un visitante debe confirmar que es mayor de 18 años; la confirmación dura la sesión del navegador.
- **Tema claro/oscuro:** se guarda en `localStorage` (`growShopTheme`) y se aplica con la clase `dark-theme` en `<body>`.

## Tecnologías

- **TanStack Query:** consultas y mutaciones del servidor; las mutaciones invalidan las consultas afectadas.
- **React Hook Form y Zod:** formularios y validaciones (registro, perfil, checkout, proveedores, productos y diálogos de órdenes).
- **Tailwind CSS 3** con prefijo `hu-` y `preflight` desactivado. Los componentes de `src/components/ui/shadcn.tsx` tienen estilo shadcn/ui, pero son locales (sin dependencia de shadcn/ui ni Radix).
- **Vitest y Testing Library** para pruebas; **lucide-react** para iconos; **Swiper** para el carrusel.
- El carrito conserva estado local con `CartService`; no es dato remoto de TanStack Query.
- Los **destacados del mes** de la página de inicio son datos de ejemplo (`src/mocks/featuredProducts.js`) hasta contar con un servicio de destacados del marketplace.

## Guía de estilo

Tailwind usa el prefijo `hu-` y `preflight` desactivado: los bordes y botones nativos necesitan `hu-border-0`/`hu-border-solid` y `hu-bg-transparent` explícitos.

### Colores

| Uso | Clase Tailwind | Ejemplo |
|---|---|---|
| Fondo oscuro de paneles, dashboard admin y header interno | `hu-bg-green-950`, degradado `hu-from-green-800 hu-to-green-950` | Header fuera de `/` |
| Tarjetas sobre fondo oscuro | `hu-bg-green-900` | Tarjetas de `/admin` |
| Botones primarios, foco, paginación, enlaces | `hu-bg-green-700` (hover `-800`), `hu-ring-green-500`, `hu-text-green-700` | `Button` de `shadcn.tsx` |
| Acento sobre fondo oscuro | `hu-text-green-400` | Título del hero |
| Ítem activo del menú | `hu-border-b-2 hu-border-green-400` | Navegación del header |
| Fondos de página admin | `hu-bg-slate-50` con texto `hu-text-slate-900`; secundario `hu-text-slate-500` | Usuarios, Reporte, Proveedores |
| Estados (badges) | tonos `green`, `amber`, `red`, `blue` de `Badge` | El azul solo para estados informativos |

Los botones de login, registro y modales son verdes; no usar `blue-*` para acciones.

### Tipografía

- **Títulos:** `hu-font-display` (Franklin Gothic Heavy, con fallback Libre Franklin 800/900, Arial Black).
- **Texto:** Inter (`hu-font-sans`, también en `body`).
- Las fuentes se cargan en `index.html` y se configuran en `tailwind.config.js`.

### Header, hero y navegación de administración

- `HeaderComponent` es transparente solo en `/` y `/welcome`; en las demás páginas usa `public/img/Fondo-head.jpg` (`.site-header-bg` en `HeaderComponent.css`). Incluye logo, menú, tema, perfil, búsqueda y carrito.
- El hero (`SwiperCarousel`) toma sus textos de las claves `hero_*` de `src/services/translations/es.js` y `en.js`.
- `AdminNav` (`src/components/admin/AdminNav.jsx`) es la barra de pestañas compartida: Administración, Órdenes, Usuarios, Proveedores, Liquidación diaria, Productos, Categorías y Reporte. En una página admin nueva, colócala debajo del header y usa el contenedor `hu-mx-auto hu-w-full hu-max-w-[1600px] hu-px-4 hu-py-8 md:hu-px-8`.

### Tema oscuro

Se activa con `body.dark-theme`; `index.css` sobrescribe con `!important` una lista fija de clases slate/white. Los colores fuera de esa lista (badges, avisos `green-50`, `amber-50`) no se adaptan: agrega su regla en `index.css`, por ejemplo con una clase propia (`body.dark-theme .app-card { border-color: #fff !important; }`).

## Formatos y tamaños de imágenes

Usar JPG o WebP (calidad 80-85) para fotos y PNG/WebP solo cuando se necesite transparencia. Peso objetivo: menos de 300 KB por imagen (hero: menos de 500 KB). Evitar texto incrustado.

| Tipo | Origen | Formato | Tamaño recomendado | Relación | Cómo se muestra |
|---|---|---|---|---|---|
| Hero del carrusel | `public/img/hero-home.jpg` | JPG / WebP | 1920 x 780 px (mínimo 1600 px de ancho) | ~2.4:1 | `object-cover`, ancho completo; mantener el sujeto a la derecha |
| Producto (listado) | Fotografía del producto en `/admin/productos` (máx. 2 MiB) | JPG / WebP | 800 x 800 px | 1:1 | `object-cover` a 280 px de alto |
| Presentación (detalle) | Fotografía al desglosar el contenedor (máx. 200 KiB) | JPG / WebP | 800 x 800 px | 1:1 | `object-contain` en el carrusel del detalle |
| Miniatura de carrito | Misma imagen de la presentación o del producto | — | se escala a 56 x 56 px | 1:1 | `object-cover` |
| Categoría | Imagen cargada en `/admin/categories` (`/api/v1/categories/{id}/image`); sin imagen usa `public/img/category-placeholder.svg` | WebP / JPG / PNG (máx. 2 MiB) | 800 x 800 px | 1:1 | `object-cover` |
| Fondo del header | `public/img/Fondo-head.jpg` | JPG / WebP | 1920 x 194 px (retina: 3840 x 388 px) | ~10:1 | `cover` centrado; tonos verde oscuro con texto blanco encima |
| Logo | `public/img/logo-cheyn-verde.png` | PNG transparente | 400 x 313 px | ~1.3:1 | 80 px de alto |

## Docker y despliegue

### Docker

La imagen (`dockerfile`) compila con Node.js 20 y sirve el resultado con Nginx, que reenvía `/api/*` al backend:

```bash
docker build -t products-frontend .
docker run --rm -p 8080:80 products-frontend
```

La aplicación queda en [http://localhost:8080](http://localhost:8080). Si el backend no se llama `Products-Api` en la red de Docker, configura los argumentos de build:

```bash
docker build \
  --build-arg BACKEND_HOST=products-api \
  --build-arg BACKEND_PORT=8080 \
  --build-arg CORS_ALLOWED_ORIGIN=https://mi-dominio \
  -t products-frontend .
```

### Netlify

`netlify.toml` ejecuta `npm run build && node scripts/prepare-netlify.js` (genera `build/_redirects` para el enrutamiento de la SPA y el proxy de la API) y publica `build/` con Node.js 20.

### Calidad y CI

- `sonar-project.properties` configura el análisis de SonarQube con el reporte de cobertura de Vitest.
- `scripts/setup-jenkins-config.sh` configura credenciales de Jenkins (`JENKINS_TOKEN`, `SONAR_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`); se puede probar sin cambios con `DRY_RUN=1 bash scripts/setup-jenkins-config.sh`. El `Jenkinsfile` y la infraestructura de Terraform no están en este repositorio.

## Estructura principal

- `src/components/`: páginas y componentes (`shop/`, `cart/`, `orders/`, `admin/`, `auth/`, `dashboard/`, `ui/`)
- `src/components/admin/cepas/`: administración de productos (antes cepas)
- `src/components/admin/suppliers/`: proveedores, lotes, empaquetado y formulario de abonos
- `src/components/admin/settlements/`: liquidación diaria (HU-04)
- `src/services/`: acceso a la API (`marketplaceService.ts`, `supplierService.ts`, `settlementService.ts`, `OrderService.js`, `categoryService.js`, autenticación), carrito y traducciones
- `src/hooks/`: consultas y mutaciones de TanStack Query
- `src/schemas/`: esquemas Zod
- `src/Interfaces/`: tipos y utilidades de datos
- `src/test/`: pruebas de Vitest
- `public/`: recursos estáticos
- `nginx/`: plantilla de configuración del servidor web
- `dockerfile`, `netlify.toml`: empaquetado y despliegue

## Validación local

```bash
npm run test -- --run
npm run build
```

`npm run typecheck` reporta actualmente dos errores previos en `src/hooks/useApiQueries.ts` y `src/schemas/profile.test.ts`, que no afectan al build.

## Problemas conocidos

- En desarrollo con frontend y backend en orígenes distintos (sin el proxy de Vite), los rechazos `401`/`403` de Spring Security llegan sin cabeceras CORS: el navegador no puede leer el estado y la pantalla muestra un error de conexión. Con el proxy de Vite o Nginx en el mismo origen no ocurre.
- El historial de abonos no indica la jornada de liquidación de un pago (ver F5).