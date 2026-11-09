# Nova Salud - Sistema web para botica

## 1. Descripción general

Nova Salud es una aplicación web para administrar una botica. Permite controlar productos, inventario, clientes, ventas internas, ventas web, comprobantes y alertas de reposición.

La aplicación fue construida con:

- React para crear la interfaz y manejar el estado.
- JSX para escribir los componentes.
- JavaScript para la lógica del sistema.
- CSS para el diseño visual y responsive.
- Vite para ejecutar y compilar el proyecto.
- `localStorage` como base de datos temporal local.

## 2. Cómo ejecutar el proyecto

Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Después se puede abrir:

```text
http://localhost:5173
```

Para generar una versión de producción:

```bash
npm run build
```

Para probar la compilación:

```bash
npm run preview
```

## 3. Estructura del proyecto

```text
C:\Entregable
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── src
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── components
    │   ├── ClientsView.jsx
    │   ├── InventoryView.jsx
    │   └── ProductsView.jsx
    └── data
        ├── clients.js
        ├── products.js
        └── storage.js
```

## 4. Archivo principal: `src/App.jsx`

`App.jsx` es el componente principal de la aplicación. Coordina:

- La navegación entre pestañas.
- Los productos y el inventario.
- El carrito de ventas internas.
- El carrito de ventas web.
- Los clientes.
- Las alertas de reposición.
- Los comprobantes.
- Las métricas del dashboard.
- Los mensajes de confirmación.

### Estado principal

React utiliza `useState` para mantener los datos mientras la aplicación está abierta:

```js
const [products, setProducts] = useState(...)
const [clients, setClients] = useState(...)
const [receipts, setReceipts] = useState(...)
```

Cada vez que un estado cambia, React vuelve a renderizar la parte de la pantalla que necesita actualizarse.

## 5. Componentes separados

### `src/components/ProductsView.jsx`

Contiene elementos reutilizables para mostrar productos:

- `ProductTable`: tabla de productos del inventario.
- `ProductCards`: tarjetas usadas en ventas internas y ventas web.

También muestra el estado del stock:

- Disponible.
- Stock bajo.
- Stock crítico.

### `src/components/InventoryView.jsx`

Administra la pantalla de inventario. Incluye:

- Búsqueda de productos.
- Filtro por categoría.
- Creación de productos.
- Edición de productos.
- Eliminación de productos.
- Actualización de unidades.
- Validación de precios, stock y stock mínimo.

El inventario recibe las funciones desde `App.jsx`, por eso los cambios se reflejan en ventas, alertas y dashboard.

### `src/components/ClientsView.jsx`

Administra los clientes:

- Lista de clientes.
- Búsqueda por nombre, DNI o teléfono.
- Registro de clientes.
- Edición de clientes.
- Eliminación con confirmación.
- Validación de DNI, teléfono y correo.

## 6. Datos iniciales

### `src/data/products.js`

Contiene la lista inicial de productos. Actualmente está vacía para que el dueño pueda comenzar desde cero.

También contiene `getProductStatus`, que determina el estado del inventario:

```js
if (stock <= stockMinimo / 2) {
  return 'Stock crítico'
}

if (stock <= stockMinimo) {
  return 'Stock bajo'
}

return 'Disponible'
```

### `src/data/clients.js`

Contiene los clientes iniciales. Actualmente también está vacía.

## 7. Base de datos temporal local

### `src/data/storage.js`

Este archivo contiene dos funciones:

```js
loadData(key, fallback)
saveData(key, value)
```

`loadData` lee información guardada en el navegador. Si todavía no existe información, utiliza el valor inicial.

`saveData` convierte los datos a JSON y los guarda en `localStorage`.

La aplicación guarda:

```text
nova-salud-v2:products
nova-salud-v2:clients
nova-salud-v2:receipts
nova-salud-v2:dailySales
nova-salud-v2:salesCount
```

Por ejemplo:

```js
useEffect(() => saveData('products', products), [products])
```

Esto significa que cada vez que cambia `products`, el inventario se guarda automáticamente.

### Importante

Esta base es local:

- Solo existe en el navegador actual.
- No se comparte entre computadoras.
- Si se borran los datos del navegador, se pierde la información.
- No es todavía una base de datos para producción.

Para una versión real multiusuario se necesitaría un backend y una base como PostgreSQL, MySQL o MongoDB.

## 8. Funcionamiento del inventario

### Crear producto

El usuario pulsa `＋ Producto` y registra:

- Nombre.
- Categoría.
- Presentación.
- Precio.
- Unidades actuales.
- Stock mínimo.

Después de guardar:

1. El producto se agrega al estado `products`.
2. Se guarda en `localStorage`.
3. Aparece en inventario.
4. Aparece en ventas.
5. Puede generar una alerta si está bajo el mínimo.

### Editar producto

El usuario pulsa `Editar`, modifica los datos y guarda. El mismo producto se actualiza en todas las pantallas porque existe un único estado central de productos.

### Eliminar producto

El sistema solicita confirmación. Al confirmar:

1. El producto se elimina del inventario.
2. Se elimina del carrito activo.
3. Se actualiza la base local.

## 9. Alertas y reposición

Un producto genera alerta cuando:

```text
stock actual <= stock mínimo
```

Las alertas aparecen en:

- El contador del menú Inventario.
- El panel de alertas del dashboard.
- El ícono de notificaciones.

Al pulsar `Reponer`:

1. Se abre un formulario.
2. Se ingresan las unidades recibidas.
3. El stock aumenta.
4. La alerta se recalcula.
5. El inventario se guarda automáticamente.

## 10. Ventas internas

En la pestaña **Ventas**, el usuario selecciona productos y los agrega al carrito.

Al registrar la venta:

1. Se valida que haya productos.
2. Se valida que no se supere el stock.
3. Se descuentan las unidades.
4. Se actualiza el total de ventas.
5. Se registra una operación.
6. Se crea una boleta.
7. El comprobante se guarda.
8. Se muestran las alertas nuevas si el stock bajó.

## 11. Ventas web

La pestaña **Ventas web** es independiente de las ventas internas.

Tiene:

- Catálogo para clientes de la página web.
- Carrito web separado.
- Validación de stock.
- Confirmación del pedido.

Aunque el carrito es independiente, utiliza los mismos productos del inventario. Por eso un pedido web también descuenta unidades reales.

## 12. Comprobantes

La pestaña **Comprobantes** muestra el historial de:

- Boletas de ventas internas.
- Pedidos web.

Cada comprobante contiene:

- Número.
- Tipo.
- Fecha y hora.
- Productos.
- Cantidades.
- Precios.
- Total.

El historial se almacena en `localStorage`, por lo que permanece después de actualizar la página.

## 13. Dashboard

El dashboard se actualiza con el estado actual:

- Ventas acumuladas.
- Número de operaciones.
- Total de productos en stock.
- Alertas de reposición.
- Último comprobante.
- Última operación registrada.

No se utilizan valores fijos para las operaciones nuevas: las ventas, reposiciones y productos modifican los datos en tiempo real.

## 14. Validaciones implementadas

### Productos

- Nombre obligatorio.
- Categoría obligatoria.
- Presentación obligatoria.
- Precio mayor o igual a cero.
- Stock mayor o igual a cero.
- Stock mínimo mayor o igual a cero.

### Clientes

- Nombre mínimo de tres caracteres.
- DNI de ocho dígitos.
- Teléfono válido.
- Correo electrónico válido.
- DNI no duplicado.

### Ventas

- No se puede vender sin productos.
- No se puede superar el stock disponible.
- No se pueden agregar más unidades que las existentes.

### Reposición

- La cantidad debe ser un número entero.
- La cantidad debe ser mayor que cero.

## 15. Diseño y experiencia de usuario

`src/styles.css` contiene todos los estilos visuales:

- Sidebar.
- Dashboard.
- Tablas.
- Formularios.
- Modales.
- Notificaciones.
- Tarjetas de productos.
- Diseño responsive.

La interfaz se adapta a computadoras, tablets y celulares mediante reglas `@media`.

## 16. Flujo completo de uso

El flujo recomendado para el dueño es:

1. Registrar productos en Inventario.
2. Definir stock mínimo.
3. Registrar clientes.
4. Registrar ventas internas o pedidos web.
5. Revisar las alertas.
6. Reponer medicamentos.
7. Consultar los comprobantes.
8. Revisar las métricas del dashboard.

Todos los cambios se guardan automáticamente en el navegador.

## 17. Próxima mejora recomendada

Para convertir esta demostración en un sistema productivo se recomienda agregar:

- Backend con autenticación.
- Base de datos centralizada.
- Roles de usuario.
- API para productos, clientes y ventas.
- Generación fiscal real de comprobantes.
- Copias de seguridad.
- Control de permisos.
- Historial de auditoría.
