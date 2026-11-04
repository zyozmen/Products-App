# Especificacion de avance y pendientes - App Zona Green

Fecha de evaluacion: 4 de noviembre de 2026.

## 1. Objetivo y limites de la evaluacion

Este documento compara la propuesta "Projecto App Zona Green (1).pdf" con el frontend disponible, su documentacion y las verificaciones realizadas contra el backend.

La propuesta menciona siete modulos, pero enumera ocho. Esta evaluacion utiliza los ocho modulos enumerados; la propuesta y su clausula de garantia deben corregirse para mantener el mismo alcance.

Los porcentajes son estimaciones de cumplimiento, no mediciones de lineas de codigo, horas restantes o certificaciones contractuales.

Se distinguen tres tipos de pendiente:

- **Implementacion:** funcionalidad que no se encontro completa en el frontend.
- **Definicion:** requisito ambiguo que debe acordarse antes de desarrollar. Si la solucion actual es aceptada, puede cerrarse sin codigo nuevo.
- **Validacion:** funcionalidad existente cuyo cierre requiere pruebas de integracion, volumen o aceptacion. No implica volver a implementarla.

El repositorio backend, Swagger, Bruno y la titularidad de los servicios no se inspeccionaron. La ausencia de evidencia en este frontend no demuestra que esos entregables no existan.

## 2. Resumen de porcentajes

| Modulo | Completado estimado | Pendiente estimado | Peso en el avance funcional |
|---|---:|---:|---:|
| Autenticacion | 95% | 5% | 8% |
| Gestion de usuarios | 60% | 40% | 12% |
| Gestion de perfil | 90% | 10% | 5% |
| Tienda electronica | 90% | 10% | 18% |
| Administracion de ordenes | 90% | 10% | 15% |
| Reportes de ordenes | 75% | 25% | 10% |
| Gestion de inventario | 70% | 30% | 14% |
| Proveedores, lotes y cuentas por pagar | 90% | 10% | 18% |
| **Avance funcional ponderado** | **82,5% (aproximadamente 83%)** | **17,5%** | **100%** |

Formula: suma de cada porcentaje completado multiplicado por su peso. Los pesos son una convencion de esta evaluacion, considerando el alcance y la complejidad operativa; no forman parte del contrato.

**Preparacion global para entrega contractual: aproximadamente 75%.** Esta segunda cifra considera tambien despliegue, documentacion, transferencia, capacitacion y aceptacion. Es una estimacion preliminar con menor confianza; no existe evidencia suficiente para asignar un porcentaje certificado a esos entregables.

Los porcentajes de las tareas siguientes son **puntos porcentuales dentro de su modulo**, no del proyecto completo. Por ejemplo, los 20 puntos pendientes de referidos pertenecen al modulo de usuarios.

## 3. Autenticacion: 95% completado, 5% pendiente

### Lo que ya existe

- Inicio y cierre de sesion.
- Control de acceso por sesion y rutas restringidas.
- Bloqueo de usuarios pendientes o inactivos.
- Expiracion y renovacion de tokens.
- Aviso y cierre de sesion por inactividad.
- Interceptores que coordinan solicitudes durante la renovacion.

### Definicion del 5% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Aceptacion integral de sesiones | 3% | Validacion | Probar con el backend real: login, logout, token expirado, renovacion concurrente, inactividad y usuario bloqueado. No deben restaurarse sesiones cerradas ni continuar solicitudes con permisos revocados fuera de la politica acordada. |
| Comportamiento en el ambiente final | 2% | Validacion | Verificar HTTPS, proxy, estados 401/403 y renovacion en los dominios de produccion. La interfaz debe distinguir falta de permisos, sesion expirada y fallo de red. |

**No se identifico una nueva funcionalidad concreta equivalente al 5% restante.** El pendiente es de validacion, no de reimplementacion de login o tokens.

Evidencia: [AuthContext](src/context/AuthContext.jsx), [AuthenticationService](src/services/AuthenticationService.js), [interceptores HTTP](src/services/httpClient.js), [rutas protegidas](src/components/auth/ProtectedRoute.jsx).

## 4. Gestion de usuarios: 60% completado, 40% pendiente

### Lo que ya existe

- Registro de clientes con datos personales y consentimiento de mayoria de edad.
- Aprobacion de cuentas pendientes.
- Activacion e inactivacion.
- Restricciones de acceso ADMIN/cliente.
- Restablecimiento de contrasena realizado por un administrador.

### Definicion del 40% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Codigos de referido | 20% | Implementacion y definicion | Acordar quien obtiene un codigo, cuando se genera y donde se utiliza. Implementar generacion/consulta del codigo, captura durante el registro y asociacion persistente con el usuario referido. El servidor debe validar codigo inexistente, duplicidad y autorreferencia segun la politica acordada. Verificar la relacion en una consulta autorizada. |
| Recuperacion de contrasena | 15% | Definicion e implementacion condicional | Acordar si basta el restablecimiento administrativo existente. Si se exige recuperacion autonoma, agregar solicitud desde login, envio por el canal acordado, token temporal de un solo uso y formulario para establecer nueva contrasena. Probar token vencido, reutilizado e invalido sin revelar si una cuenta existe. |
| Administracion de roles y permisos | 5% | Definicion e implementacion condicional | Confirmar si los dos roles fijos ADMIN/cliente satisfacen el contrato. Si se requiere asignacion, implementar seleccion autorizada de roles, persistencia y validacion en el backend, evitando autoasignacion o elevacion no autorizada. Si se aceptan roles fijos, documentar y probar la matriz de acceso. |

No se consideran contratadas comisiones, premios o descuentos por referidos: deben acordarse como ampliacion si se solicitan.

Evidencia: [registro](src/components/login/LoginComponent.jsx), [administracion de usuarios](src/components/admin/users/UserAdminComponent.jsx), [servicio de usuarios](src/services/UserService.js).

## 5. Gestion de perfil: 90% completado, 10% pendiente

### Lo que ya existe

- Edicion de nombre, apellido, direccion y telefono.
- Cambio de contrasena.
- Actualizacion del perfil conservado en la sesion.
- Preferencias basicas de tema e idioma en la interfaz.

### Definicion del 10% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Alcance y persistencia de preferencias | 5% | Definicion e implementacion condicional | Enumerar las preferencias contratadas y decidir si son locales al navegador o pertenecen a la cuenta. Si deben seguir al usuario entre dispositivos, agregar persistencia y recuperacion en el backend. Si son locales, documentar esa limitacion y verificar su conservacion. |
| Aceptacion del perfil | 5% | Validacion | Verificar que las ediciones persistan despues de cerrar e iniciar sesion; que un usuario no pueda editar otro perfil; y que el cambio de contrasena tenga el efecto acordado sobre credenciales y sesiones. |

No se presupone una obligacion de agregar avatar, preferencias de marketing o nuevos campos personales.

Evidencia: [perfil](src/components/profile/ProfileComponent.jsx), [header y preferencias](src/components/dashboard/HeaderComponent.jsx), [servicio de usuarios](src/services/UserService.js).

## 6. Tienda electronica: 90% completado, 10% pendiente

### Lo que ya existe

- Catalogo y detalle de productos por presentacion.
- Filtros y paginacion del servidor.
- Precios, fotografias y existencias por presentacion.
- Carrito y formulario de entrega.
- Creacion de orden y apertura de WhatsApp con el pedido.
- Revalidacion del carrito ante cambios de precio o disponibilidad.

### Definicion del 10% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Catalogo publico/privado | 4% | Definicion e implementacion condicional | Precisar que significa catalogo privado: acceso autenticado, productos exclusivos u otra restriccion. Probar que la politica se cumpla en API e interfaz. Si se exige un catalogo diferenciado y no solo acceso a compra con sesion, implementar la visibilidad acordada. |
| Aceptacion del checkout | 3% | Validacion | Probar compra con datos reales, producto agotado, cambio de precio, perdida de respuesta y confirmacion repetida. Verificar que el pedido persista y que no se duplique por una repeticion de envio. Confirmar que el flujo por WhatsApp cumple el alcance pactado. |
| Aceptacion visual y contenido final | 3% | Validacion y configuracion | Revisar movil/escritorio contra el manual de marca, imagenes y textos finales. Resolver enlaces de navegacion sin destino real y retirar o identificar contenido de ejemplo visible en la entrega. El cliente debe aprobar las pantallas de tienda y compra. |

Una pasarela de pago automatica, cursos, blog o sistema de resenas no se consideran pendientes contratados solo porque aparezcan referencias visuales: no estan especificados como modulos en la propuesta.

Evidencia: [catalogo](src/components/shop/MarketplaceShopList.jsx), [detalle](src/components/shop/MarketplaceProductDetail.jsx), [checkout](src/components/cart/ShoppingCarComponent.jsx), [servicio marketplace](src/services/marketplaceService.ts).

## 7. Administracion de ordenes: 90% completado, 10% pendiente

### Lo que ya existe

- Tablero operativo y contador de ordenes.
- Estados de creacion, pago, empaquetado, entrega y cancelacion.
- Ordenes PQR y contra entrega.
- Dialogos de confirmacion.
- Historial de ordenes personales.
- Actualizacion de inventario y liquidacion asociada a mutaciones.

### Definicion del 10% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Matriz de estados y concurrencia | 6% | Validacion | Probar todas las transiciones permitidas y rechazar las restantes en el servidor. Incluir dos administradores actuando sobre la misma orden, confirmacion repetida, cancelacion PQR y contra entrega. No deben duplicarse stock, reconocimiento de costos o pagos. |
| Seguimiento e historial personal | 4% | Validacion | Verificar que cada usuario solo consulte sus ordenes, que los estados coincidan con el tablero y que el historial persista. Validar busqueda, carga, errores y volumen operativo acordado. |

Este 10% no representa ausencia del Kanban o del historial: son funcionalidades existentes pendientes de aceptacion integral.

Evidencia: [tablero](src/components/admin/orders/OrdersKanbanComponent.jsx), [historial personal](src/components/orders/MyOrdersComponent.jsx), [servicio de ordenes](src/services/OrderService.js).

## 8. Reportes de ordenes: 75% completado, 25% pendiente

### Lo que ya existe

- Consulta por dia, semana y mes.
- Indicadores de ordenes, ventas entregadas, pendientes, cancelaciones y PQR.
- Importes y desglose registrado de efectivo/tarjeta.
- Visualizacion grafica.

### Definicion del 25% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Definicion de fecha y significado de venta | 10% | Definicion e implementacion condicional | Acordar si el reporte atribuye la venta a creacion, pago o entrega y fijar zona horaria de negocio. Actualmente filtra por creacion. Alinear consultas, etiquetas y pruebas con la definicion aprobada, incluyendo orden creada un dia y pagada/entregada otro. |
| Agregacion y consulta escalable | 10% | Implementacion | Evitar depender de descargar todas las ordenes para calcular los reportes. Implementar agregados por periodo en el backend y paginacion del historial cuando aplique. Conectar el frontend y validar cifras exactas y volumen sin cortes silenciosos. |
| Conciliacion y aceptacion | 5% | Validacion | Comparar reporte con ordenes reales para distintos periodos, PQR, cancelaciones y cobros. Explicar cualquier diferencia entre ingreso comercial, costo reconocido y liquidacion al proveedor; no son la misma magnitud. |

Exportar Excel/PDF no figura como requisito explicito; debe acordarse aparte si se necesita.

Evidencia: [reporte](src/components/admin/orders/OrdersReportComponent.jsx), [calculos actuales](src/components/admin/orders/OrdersReportHelper.js), [consultas de ordenes](src/hooks/useApiQueries.ts).

## 9. Gestion de inventario: 70% completado, 30% pendiente

### Lo que ya existe

- Alta de productos y recepcion de lotes.
- Desglose de contenedores y creacion de presentaciones.
- Costos, precios, capacidad y existencias.
- Control de disponibilidad en marketplace y carrito.
- Descuento de stock asociado a ordenes y restitucion en los casos admitidos.
- Activacion de marketplace al crear presentaciones.

### Definicion del 30% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Bajas y retiro de productos/presentaciones | 12% | Implementacion y definicion | Definir baja logica o retiro de venta, preservar referencias historicas de ordenes/lotes y agregar la accion autorizada en administracion. Un producto retirado no debe poder comprarse; los movimientos previos deben seguir siendo auditables. Verificar primero las capacidades reales del backend. |
| Alertas de disponibilidad | 10% | Implementacion y definicion | Acordar si basta aviso de agotado o se necesitan umbrales de stock bajo. Implementar la vista/indicador que no este cubierto, mostrando producto, presentacion y stock real; si hay umbral, permitir configurarlo con permisos. Probar agotado, stock bajo y recuperacion de disponibilidad. |
| Ajustes y mermas | 5% | Definicion e implementacion condicional | Determinar si el control de stock pactado exige ajustes por perdida, conteo o dano. Si se exige, registrar variacion con motivo y responsable, conservar trazabilidad y evitar existencias negativas. Si se excluye, documentarlo y aceptar el cierre sin agregar ese flujo. |
| Conciliacion de existencias | 3% | Validacion | Comparar stock antes/despues de recepcion, desglose, venta y cancelacion permitida. Probar operaciones concurrentes y evitar sobreventa o restitucion duplicada. |

Las presentaciones existentes se muestran principalmente como lectura; no se debe dar por implementado su retiro o edicion por existir el checkbox de activacion durante su creacion.

Evidencia: [productos](src/components/admin/cepas/CepaManagementPage.tsx), [desglose](src/components/admin/suppliers/DesgloseContenedorForm.tsx), [lotes](src/components/admin/suppliers/SupplierLotsList.tsx), [carrito](src/services/CartService.js).

## 10. Proveedores, lotes y cuentas por pagar: 90% completado, 10% pendiente

### Lo que ya existe

- Registro y consulta paginada de proveedores.
- Recepcion de lotes y clasificacion de contenedores/productos.
- Presentaciones con costo y precio.
- Deuda, abonos, imputacion por lote y saldo pendiente.
- Liquidacion diaria por proveedor.
- Pagos vinculados a la jornada.
- Detalle auditable paginado que distingue ventas, PQR, reversiones y pagos.
- Lectura exacta de importes y snapshots monetarios.

La incompatibilidad de `orderId` numerico ya se corrigio. Se verificaron una venta real por $20.000 COP y un abono vinculado por $20.000 COP: resumen y detalle coinciden y el pendiente diario es $0. Tambien se verificaron paginas individuales con un movimiento por pagina.

### Definicion del 10% pendiente

| Pendiente | Puntos | Tipo | Especificacion y criterio de cierre |
|---|---:|---|---|
| Parametros obligatorios del detalle | 3% | Correccion backend y validacion | En una verificacion previa, omitir `date` o `providerId` devolvio 500 en lugar de 400. Reprobar con la version vigente del backend y corregir si persiste. Fechas, proveedores y paginacion invalidos deben responder 400; la interfaz debe mostrar el error sin fabricar resultados. |
| Cierre integrado de escenarios financieros | 5% | Validacion | Probar varias presentaciones con distintos costos, contra entrega, PQR cancelada en otra jornada, pago parcial, pago distribuido entre lotes y exceso pagado. Conciliar resumen/detalle, saldo y stock; el pago debe aparecer una vez por correlacion con sus imputaciones. |
| Trazabilidad y consistencia bajo concurrencia | 2% | Validacion | Verificar original de la reversion, fecha del evento y jornada afectada; controlar confirmaciones simultaneas y respuestas tardias. No deben duplicarse reconocimientos o pagos ni mezclarse proveedores/jornadas. |

El historial general de abonos no expone la jornada vinculada; el detalle auditable permite rastrearla. Si el cliente exige verla tambien en el historial general, acordar el cambio de contrato antes de implementarlo.

Evidencia: [proveedores](src/components/admin/suppliers/SupplierManagementPage.tsx), [pagos](src/components/admin/suppliers/SupplierPaymentForm.tsx), [liquidacion](src/components/admin/settlements/DailySettlementPage.tsx), [detalle](src/components/admin/settlements/DailySettlementDetail.tsx), [contrato y validacion](src/services/settlementService.ts).

## 11. Pendientes transversales para entrega contractual

Estos entregables no reciben porcentajes individuales porque no se inspeccionaron todas sus fuentes de evidencia. No deben interpretarse como 0% implementados.

| Entregable | Situacion verificable | Definicion del cierre |
|---|---|---|
| Backend Java/Spring Boot y MongoDB Atlas | APIs reales parcialmente verificadas; codigo backend e infraestructura no revisados | Revisar reglas, persistencia, permisos y operacion del despliegue acordado. |
| Frontend en Netlify y backend en Render | Existen configuraciones frontend de despliegue; cuentas y despliegue final no comprobados | Verificar dominios, HTTPS, variables, proxy y operacion sobre servicios a nombre del cliente. |
| Codigo fuente y propiedad intelectual | Frontend disponible; transferencia y backend no comprobados | Entregar ambos repositorios o estructura principal acordada, accesos, instrucciones y cesion formal de derechos. |
| Swagger | No verificado en este repositorio | Entregar documentacion de endpoints, autenticacion, cuerpos, respuestas, errores y paginacion de la version final. |
| Colecciones Bruno | No verificadas en este repositorio | Entregar colecciones ejecutables con ambientes sin secretos versionados y casos positivos/negativos. |
| Guia tecnica | README disponible | Completar instrucciones frontend/backend, despliegue, configuracion y recuperacion; verificar que otro operador pueda ejecutarlas. |
| Manual de usuario | No verificado | Documentar flujos de cliente y administrador, restricciones, mensajes y conciliacion de operaciones. |
| Capacitacion | No verificada | Realizar sesion practica con el administrador y registrar entrega de material y dudas resueltas. |
| Pruebas de aceptacion y acta | Validaciones tecnicas parciales disponibles | Ejecutar los ocho modulos con Zona Green, documentar resultados y pendientes, y firmar acta cuando se cumpla el alcance. |
| Garantia | Propuesta establece 30 dias | Precisar inicio en acta final, canal de reporte y diferencia entre defecto cubierto y ampliacion de alcance. |

### Calidad tecnica pendiente

- Corregir los errores TypeScript actualmente documentados en [useApiQueries](src/hooks/useApiQueries.ts) y [pruebas de perfil](src/schemas/profile.test.ts).
- Ejecutar compilacion, pruebas y pruebas de aceptacion despues de las correcciones.
- Acordar volumen esperado y objetivos medibles de respuesta antes de certificar "alto rendimiento".
- Verificar respaldos, restauracion, registros operativos y alertas del servicio. No se certifica disponibilidad solo por desplegar en la nube.
- No confundir las pruebas frontend con validacion de transacciones, indices y concurrencia en MongoDB.

En la revision del 4 de noviembre de 2026 pasaron **308 pruebas en 43 archivos**; el build de frontend tambien se verifico. Este resultado describe esa revision y debe actualizarse al cambiar la implementacion.

### Presupuesto operativo

La propuesta estima MongoDB Atlas con 5 GB por USD 5/mes. La [documentacion oficial de Atlas Flex](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/) consultada indica USD 8-30 por 30 dias segun uso; debe confirmarse el plan contratado.

Verificar tambien el plan de Render y los limites de [Netlify](https://www.netlify.com/pricing/). No prometer un costo mensual fijo ni rendimiento garantizado sin validar recursos y demanda.

Estos ajustes no cambian automaticamente el valor de desarrollo de $24.000.000 COP: servicios mensuales, garantia y ampliaciones son conceptos diferentes.

## 12. Orden recomendado para completar el proyecto

1. **Cerrar definiciones con el cliente:** ocho modulos, recuperacion de contrasena, referidos, roles, preferencias, catalogo privado, fecha de reportes y alcance de inventario.
2. **Corregir defectos conocidos:** typecheck y estado HTTP por parametros obligatorios, si se reproduce en el backend vigente.
3. **Completar funcionalidades comprometidas:** referidos, bajas/alertas de inventario y cualquier implementacion condicional confirmada.
4. **Completar escalabilidad y conciliacion:** reportes en servidor y pruebas de volumen, estados, stock y movimientos financieros.
5. **Preparar entrega:** infraestructura, documentacion, transferencia, capacitacion y aceptacion.

No se deben desarrollar nuevas funciones solo para rellenar porcentajes. Una definicion aceptada o una validacion satisfactoria puede cerrar puntos pendientes sin cambios de codigo.

## 13. Condicion para declarar 100%

El proyecto se considera completo cuando:

- Los ocho modulos cumplen el alcance explicitamente acordado.
- Los pendientes condicionales tienen decision documentada e implementacion cuando corresponda.
- Los flujos existentes pasan sus pruebas integradas y de aceptacion.
- Los defectos que incumplen el contrato quedan corregidos.
- Codigo, documentacion, cuentas y activos acordados se entregan al cliente.
- Se realizan capacitacion y acta final con condiciones de garantia claras.

La asignacion final de porcentajes debe actualizarse contra esa evidencia, no contra la cantidad de pantallas o pruebas existentes.
