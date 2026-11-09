import React, { useEffect, useMemo, useState } from 'react'
import { initialProducts } from './data/products'
import { initialClients } from './data/clients'
import { loadData, saveData } from './data/storage'
import InventoryView from './components/InventoryView'
import ClientsView from './components/ClientsView'
import { ProductCards } from './components/ProductsView'

const navItems = [
  ['Resumen', '▦'],
  ['Inventario', '▤'],
  ['Ventas', '▥'],
  ['Ventas web', '▣'],
  ['Comprobantes', '▤'],
  ['Clientes', '♙'],
  ['Proveedores', '⌑'],
]

function Icon({ children }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>
}

function App() {
  const [active, setActive] = useState('Resumen')
  const [products, setProducts] = useState(() => loadData('products', initialProducts))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas las categorías')
  const [cart, setCart] = useState([])
  const [webCart, setWebCart] = useState([])
  const [receipts, setReceipts] = useState(() => loadData('receipts', []))
  const [toast, setToast] = useState('')
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastReceipt, setLastReceipt] = useState(() => loadData('receipts', [])[0] || null)
  const [dailySales, setDailySales] = useState(() => loadData('dailySales', 0))
  const [salesCount, setSalesCount] = useState(() => loadData('salesCount', 0))
  const [showNotifications, setShowNotifications] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const [clients, setClients] = useState(() => loadData('clients', initialClients))
  const [clientQuery, setClientQuery] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [clientError, setClientError] = useState('')
  const [restockProduct, setRestockProduct] = useState(null)

  const categories = ['Todas las categorías', ...new Set(products.map((product) => product.category))]
  const productCategories = categories.filter((item) => item !== 'Todas las categorías')
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'Todas las categorías' || product.category === category)
  }), [products, query, category])

  const lowStock = products.filter((product) => product.stock <= product.min)
  const activeAlerts = lowStock.filter((product) => !dismissedAlerts.includes(product.id))
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const webCartTotal = webCart.reduce((total, item) => total + item.price * item.quantity, 0)
  const filteredClients = clients.filter((client) => `${client.name} ${client.document} ${client.phone}`.toLowerCase().includes(clientQuery.toLowerCase()))

  useEffect(() => saveData('products', products), [products])
  useEffect(() => saveData('clients', clients), [clients])
  useEffect(() => saveData('receipts', receipts), [receipts])
  useEffect(() => saveData('dailySales', dailySales), [dailySales])
  useEffect(() => saveData('salesCount', salesCount), [salesCount])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const addToCart = (product) => {
    if (product.stock === 0) return notify('Este producto no tiene stock disponible.')
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing && existing.quantity >= product.stock) {
        notify(`No puedes agregar más de ${product.stock} unidades de ${product.name}.`)
        return current
      }
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1 }]
    })
    notify(`${product.name} agregado a la venta.`)
  }

  const completeSale = () => {
    if (!cart.length) return notify('Agrega productos antes de registrar la venta.')
    if (cart.some((item) => item.quantity > products.find((product) => product.id === item.id)?.stock)) {
      return notify('La cantidad solicitada supera el stock disponible.')
    }
    const receipt = {
      number: `B001-${String(Date.now()).slice(-8)}`,
      date: new Date().toLocaleString('es-PE'),
      type: 'Boleta electrónica',
      items: cart.map((item) => ({ ...item })),
      total: cartTotal,
    }
    setProducts((current) => current.map((product) => {
      const sold = cart.find((item) => item.id === product.id)
      return sold ? { ...product, stock: product.stock - sold.quantity } : product
    }))
    setCart([])
    setDailySales((current) => current + cartTotal)
    setSalesCount((current) => current + 1)
    setReceipts((current) => [receipt, ...current])
    setLastReceipt(receipt)
    setShowReceipt(true)
    notify('Venta registrada y boleta generada.')
  }

  const addProduct = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const stock = Number(form.get('stock'))
    const min = Number(form.get('min'))
    const price = Number(form.get('price'))
    if (!form.get('name') || !form.get('presentation') || stock < 0 || min < 0 || price < 0) {
      return notify('Completa correctamente todos los datos del producto.')
    }
    const newProduct = {
      id: Date.now(),
      name: form.get('name'),
      category: form.get('category'),
      presentation: form.get('presentation'),
      stock,
      min,
      price,
      status: 'Disponible',
      icon: '💊',
      tone: 'blue',
    }
    setProducts((current) => [newProduct, ...current])
    setShowNewProduct(false)
    notify('Producto creado correctamente.')
  }

  const openClientForm = (client = null) => {
    setEditingClient(client)
    setClientError('')
    setShowClientForm(true)
  }

  const saveClient = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = form.get('name').trim()
    const document = form.get('document').trim()
    const phone = form.get('phone').trim()
    const email = form.get('email').trim()
    if (name.length < 3 || !/^[0-9]{8}$/.test(document) || !/^[0-9\s+()-]{7,15}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setClientError('Verifica nombre, DNI de 8 dígitos, teléfono y correo electrónico.')
      return
    }
    if (clients.some((client) => client.document === `DNI ${document}` && client.id !== editingClient?.id)) {
      setClientError('Ya existe un cliente registrado con este DNI.')
      return
    }
    const data = { name, document: `DNI ${document}`, phone, email }
    if (editingClient) {
      setClients((current) => current.map((client) => client.id === editingClient.id ? { ...client, ...data } : client))
      notify('Cliente actualizado correctamente.')
    } else {
      setClients((current) => [{ id: Date.now(), ...data, purchases: 0, lastVisit: 'Sin compras' }, ...current])
      notify('Cliente registrado correctamente.')
    }
    setShowClientForm(false)
  }

  const removeClient = (client) => {
    if (window.confirm(`¿Eliminar a ${client.name} de la cartera de clientes?`)) {
      setClients((current) => current.filter((item) => item.id !== client.id))
      notify('Cliente eliminado correctamente.')
    }

  }

  const requestRestock = (product) => {
    setRestockProduct(product)
  }

  const completeRestock = (event) => {
    event.preventDefault()
    const quantity = Number(new FormData(event.currentTarget).get('quantity'))
    if (!restockProduct || !Number.isInteger(quantity) || quantity <= 0) return notify('Ingresa una cantidad válida de unidades.')
    setProducts((current) => current.map((product) => product.id === restockProduct.id ? { ...product, stock: product.stock + quantity } : product))
    setDismissedAlerts((current) => current.filter((id) => id !== restockProduct.id))
    notify(`${quantity} unidades de ${restockProduct.name} agregadas al inventario.`)
    setRestockProduct(null)
  }

  const addToWebCart = (product) => {
    if (product.stock === 0) return notify('Este producto no está disponible para compra web.')
    setWebCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing && existing.quantity >= product.stock) return current
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1 }]
    })
    notify(`${product.name} agregado al carrito web.`)
  }

  const completeWebSale = () => {
    if (!webCart.length) return notify('Agrega productos al carrito web.')
    if (webCart.some((item) => item.quantity > products.find((product) => product.id === item.id)?.stock)) return notify('Una cantidad solicitada ya no está disponible.')
    setProducts((current) => current.map((product) => {
      const sold = webCart.find((item) => item.id === product.id)
      return sold ? { ...product, stock: product.stock - sold.quantity } : product
    }))
    setDailySales((current) => current + webCartTotal)
    setSalesCount((current) => current + 1)
    setReceipts((current) => [{
      number: `WEB-${String(Date.now()).slice(-8)}`,
      date: new Date().toLocaleString('es-PE'),
      type: 'Pedido web',
      items: webCart.map((item) => ({ ...item })),
      total: webCartTotal,
    }, ...current])
    setWebCart([])
    notify('Pedido web confirmado correctamente.')
  }

  const saveInventoryProduct = (product, editingId = null) => {
    if (editingId) {
      setProducts((current) => current.map((item) => item.id === editingId ? { ...item, ...product } : item))
      notify('Producto actualizado correctamente.')
      return
    }
    setProducts((current) => [{ ...product, id: Date.now(), status: 'Disponible', icon: '💊', tone: 'blue' }, ...current])
    notify('Producto creado correctamente.')
  }

  const removeInventoryProduct = (product) => {
    if (!window.confirm(`¿Eliminar ${product.name} del inventario?`)) return
    setProducts((current) => current.filter((item) => item.id !== product.id))
    setCart((current) => current.filter((item) => item.id !== product.id))
    notify('Producto eliminado correctamente.')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✚</div>
          <div><strong>Nova Salud</strong><small>Gestión de botica</small></div>
        </div>
        <div className="workspace-label">MENÚ PRINCIPAL</div>
        <nav>
          {navItems.map(([label, icon]) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}>
              <Icon>{icon}</Icon>{label}
              {label === 'Inventario' && lowStock.length > 0 && <span className="nav-count">{lowStock.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Icon>⚙</Icon>Configuración</button>
          <div className="user-card"><div className="avatar">LM</div><div><strong>Laura Mendoza</strong><small>Administradora</small></div><span>⋮</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Nova Salud</span><b>/</b><strong>{active}</strong></div>
          <div className="top-actions"><div className="notification-wrap"><button className={`icon-button notification ${showNotifications ? 'selected' : ''}`} onClick={() => setShowNotifications((current) => !current)} aria-label="Abrir notificaciones">♧{activeAlerts.length > 0 && <i />}{activeAlerts.length > 0 && <b>{activeAlerts.length}</b>}</button>{showNotifications && <div className="notification-panel"><div className="notification-header"><div><strong>Notificaciones</strong><small>Alertas de reposición</small></div>{activeAlerts.length > 0 && <span>{activeAlerts.length} pendientes</span>}</div>{activeAlerts.length > 0 ? activeAlerts.map((product) => <div className="notification-item" key={product.id}><span className={`product-image small ${product.tone}`}>{product.icon}</span><div><strong>{product.name}</strong><small>Stock: {product.stock} · Mínimo: {product.min}</small></div><button onClick={() => requestRestock(product)}>Atender</button></div>) : <div className="notification-empty">✓ No tienes notificaciones pendientes</div>}<button className="notification-footer" onClick={() => { setShowNotifications(false); setActive('Inventario') }}>Ver inventario</button></div>}</div><div className="top-avatar">LM</div></div>
        </header>

        <div className="page-content">
          {active === 'Resumen' ? <>
          <section className="welcome-row">
            <div><p className="eyebrow">DOMINGO, 08 NOVIEMBRE 2026</p><h1>Buenos días, Laura <span>👋</span></h1><p className="subtitle">Este es el resumen de tu botica para hoy.</p></div>
            <button className="primary-button" onClick={() => setActive('Inventario')}><span>▤</span> Ir al inventario</button>
          </section>

          <section className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Ventas del día</span><span className="stat-icon green">↗</span></div><strong>S/ {dailySales.toFixed(2)}</strong><div className="stat-foot"><span className="positive">↑ 12.5%</span><span>{salesCount} operaciones</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Productos en stock</span><span className="stat-icon blue">▣</span></div><strong>{products.reduce((sum, product) => sum + product.stock, 0).toLocaleString('es-PE')}</strong><div className="stat-foot"><span className="positive">↑ 3.2%</span><span>vs. mes anterior</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Alertas de stock</span><span className="stat-icon orange">♢</span></div><strong>{lowStock.length.toString().padStart(2, '0')}</strong><div className="stat-foot"><span className="warning">Requieren atención</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Clientes atendidos</span><span className="stat-icon purple">♙</span></div><strong>{salesCount}</strong><div className="stat-foot"><span className="positive">↑ 8.7%</span><span>operaciones registradas</span></div></article>
          </section>

          {lastReceipt && <div className="panel recent-receipt"><div><p className="eyebrow">ÚLTIMA OPERACIÓN</p><h2>Comprobante generado: {lastReceipt.type}</h2><p>{lastReceipt.number} · {lastReceipt.date} · Total S/ {lastReceipt.total.toFixed(2)}</p></div><button className="text-button" onClick={() => setShowReceipt(true)}>Ver comprobante →</button></div>}
          <section className="dashboard-grid">
            <div className="panel inventory-panel">
              <div className="panel-heading"><div><h2>Inventario reciente</h2><p>Consulta y administra tus productos</p></div><button className="text-button" onClick={() => setActive('Inventario')}>Ver todo <span>→</span></button></div>
              <div className="filters"><label className="search-box">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." /></label><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>STOCK</th><th>PRECIO</th><th>ESTADO</th><th /></tr></thead><tbody>
                {filteredProducts.slice(0, 5).map((product) => <tr key={product.id}><td><div className="product-cell"><span className={`product-image ${product.tone}`}>{product.icon}</span><div><strong>{product.name}</strong><small>{product.presentation}</small></div></div></td><td>{product.category}</td><td><strong className={product.stock <= product.min ? 'stock-low' : ''}>{product.stock}</strong><small className="stock-unit"> unidades</small></td><td>S/ {product.price.toFixed(2)}</td><td><span className={`status ${product.stock <= product.min / 2 ? 'critical' : product.stock <= product.min ? 'low' : 'available'}`}><i />{product.stock <= product.min / 2 ? 'Stock crítico' : product.stock <= product.min ? 'Stock bajo' : 'Disponible'}</span></td><td><button className="row-menu" onClick={() => addToCart(product)}>＋</button></td></tr>)}
              </tbody></table></div>
              {!filteredProducts.length && <div className="empty-state">No se encontraron productos.</div>}
            </div>

            <div className="side-column">
              <div className="panel alerts-panel"><div className="panel-heading"><div><h2>Alertas de reposición</h2><p>Productos que necesitan atención</p></div><span className="alert-count">{lowStock.length}</span></div>
                {lowStock.map((product) => <div className="alert-item" key={product.id}><span className={`product-image small ${product.tone}`}>{product.icon}</span><div><strong>{product.name}</strong><small>Stock actual: <b>{product.stock} unidades</b></small></div><button onClick={() => requestRestock(product)}>Reponer</button></div>)}
                {!lowStock.length && <div className="all-good">✓ Todo el inventario está saludable</div>}
              </div>
              <div className="panel quick-sale"><div className="sale-heading"><div><h2>Venta rápida</h2><p>Agrega productos para registrar una venta</p></div><span className="cart-icon">🛒</span></div>
                {cart.length ? <div className="cart-list">{cart.map((item) => <div className="cart-item" key={item.id}><span>{item.name}</span><b>{item.quantity} × S/ {item.price.toFixed(2)}</b></div>)}</div> : <div className="cart-empty">Selecciona <b>＋</b> en un producto para comenzar</div>}
                <div className="sale-total"><span>Total estimado</span><strong>S/ {cartTotal.toFixed(2)}</strong></div><button className="sale-button" onClick={completeSale}>Registrar venta <span>→</span></button>
              </div>
            </div>
          </section>
          </> : <section className="panel section-view">
            <div className="panel-heading">
              <div><p className="eyebrow">GESTIÓN OPERATIVA</p><h1>{active}</h1><p>{active === 'Ventas' ? 'Registra y consulta las ventas de la jornada.' : active === 'Inventario' ? 'Administra existencias, precios y alertas de reposición.' : `Módulo de ${active.toLowerCase()} de Nova Salud.`}</p></div>
              {active === 'Inventario' && <span className="section-hint">Usa “＋ Producto” para registrar existencias</span>}
            </div>
            {active === 'Ventas' ? <div className="sales-view">
              <div className="sales-products"><h2>Productos disponibles</h2><ProductCards products={filteredProducts} onAddToCart={addToCart} /></div>
              <div className="sale-summary"><h2>Venta actual</h2>{cart.length ? cart.map((item) => <div className="cart-item" key={item.id}><span>{item.name}<small>{item.quantity} unidad(es)</small></span><b>S/ {(item.price * item.quantity).toFixed(2)}</b></div>) : <div className="cart-empty">Aún no hay productos en la venta.</div>}<div className="sale-total"><span>Total</span><strong>S/ {cartTotal.toFixed(2)}</strong></div><button className="sale-button" onClick={completeSale}>Registrar venta <span>→</span></button></div>
            </div> : active === 'Ventas web' ? <div className="web-sales-view"><div className="web-sales-intro"><p className="eyebrow">CANAL DIGITAL</p><h2>Ventas para clientes web</h2><p>Catálogo disponible exclusivamente para pedidos desde la página web.</p></div><div className="web-sales-layout"><div><h2>Catálogo web</h2><ProductCards products={products.filter((product) => product.stock > 0)} onAddToCart={addToWebCart} /></div><div className="sale-summary"><h2>Carrito del cliente</h2>{webCart.length ? webCart.map((item) => <div className="cart-item" key={item.id}><span>{item.name}<small>{item.quantity} unidad(es)</small></span>            <b>S/ {(item.quantity * item.price).toFixed(2)}</b></div>) : <div className="cart-empty">El cliente aún no agregó productos.</div>}<div className="sale-total"><span>Total del pedido</span><strong>S/ {webCartTotal.toFixed(2)}</strong></div><button className="sale-button" onClick={completeWebSale}>Confirmar pedido web <span>→</span></button></div></div></div> : active === 'Comprobantes' ? <div className="receipts-view"><div className="receipts-heading"><div><p className="eyebrow">DOCUMENTOS EMITIDOS</p><h2>Comprobantes</h2><p>Historial guardado en la base temporal de este navegador.</p></div><span className="receipt-count">{receipts.length} documentos</span></div>{receipts.length ? <div className="receipt-list">{receipts.map((receipt) => <article className="receipt-card" key={receipt.number}><div className="receipt-card-main"><span className="receipt-symbol">▤</span><div><strong>{receipt.type}</strong><small>{receipt.number} · {receipt.date}</small></div></div><div className="receipt-card-total"><strong>S/ {receipt.total.toFixed(2)}</strong><button className="row-action" onClick={() => { setLastReceipt(receipt); setShowReceipt(true) }}>Ver detalle</button></div></article>)}</div> : <div className="empty-state">Todavía no hay comprobantes registrados.</div>}</div> : active === 'Inventario' ? <InventoryView products={products} query={query} setQuery={setQuery} category={category} setCategory={setCategory} categories={categories} onAddToCart={addToCart} onSaveProduct={saveInventoryProduct} onDeleteProduct={removeInventoryProduct} /> : active === 'Clientes' ? <ClientsView clients={clients} query={clientQuery} setQuery={setClientQuery} onCreate={() => openClientForm()} onEdit={openClientForm} onRemove={removeClient} /> : <div className="module-placeholder"><span>✦</span><h2>Próximamente</h2><p>Este módulo está listo para conectarse con los datos de tu operación.</p></div>}
          </section>}
        </div>
      </main>
      {showNewProduct && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowNewProduct(false)}><form className="modal" onSubmit={addProduct}><div className="modal-heading"><div><h2>Nuevo producto</h2><p>Registra un producto en tu inventario</p></div><button type="button" className="close-button" onClick={() => setShowNewProduct(false)}>×</button></div><div className="form-grid"><label>Nombre del producto<input name="name" required placeholder="Ej. Paracetamol 500mg" /></label><label>Categoría<input name="category" required placeholder="Ej. Analgésicos" /></label><label>Presentación<input name="presentation" required placeholder="Ej. Caja x 20 unidades" /></label><label>Precio (S/)<input name="price" type="number" step="0.01" min="0" required placeholder="0.00" /></label><label>Stock inicial<input name="stock" type="number" min="0" required placeholder="0" /></label><label>Stock mínimo<input name="min" type="number" min="0" required placeholder="0" /></label></div><button className="primary-button modal-submit">Guardar producto</button></form></div>}
      {showClientForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowClientForm(false)}><form className="modal" onSubmit={saveClient}><div className="modal-heading"><div><h2>{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</h2><p>Registra datos válidos para una atención personalizada</p></div><button type="button" className="close-button" onClick={() => setShowClientForm(false)}>×</button></div><div className="form-grid"><label>Nombre completo<input name="name" defaultValue={editingClient?.name || ''} required minLength="3" placeholder="Ej. María Rodríguez" /></label><label>DNI<input name="document" defaultValue={editingClient?.document?.replace('DNI ', '') || ''} required pattern="[0-9]{8}" maxLength="8" placeholder="8 dígitos" /></label><label>Teléfono<input name="phone" defaultValue={editingClient?.phone || ''} required pattern="[0-9\s+()-]{7,15}" placeholder="Ej. 987 654 321" /></label><label>Correo electrónico<input name="email" type="email" defaultValue={editingClient?.email || ''} required placeholder="cliente@correo.com" /></label></div>{clientError && <p className="form-error">⚠ {clientError}</p>}<button className="primary-button modal-submit">Guardar cliente</button></form></div>}
      {showReceipt && lastReceipt && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowReceipt(false)}><div className="modal receipt-modal"><div className="modal-heading"><div><p className="eyebrow">NOVA SALUD</p><h2>{lastReceipt.type}</h2><p>{lastReceipt.number} · {lastReceipt.date}</p></div><button type="button" className="close-button" onClick={() => setShowReceipt(false)}>×</button></div><div className="receipt-items">{lastReceipt.items.map((item) => <div className="cart-item" key={item.id}><span>{item.name}<small>{item.quantity} × S/ {item.price.toFixed(2)}</small></span><b>S/ {(item.quantity * item.price).toFixed(2)}</b></div>)}</div><div className="sale-total receipt-total"><span>Total pagado</span><strong>S/ {lastReceipt.total.toFixed(2)}</strong></div><button className="primary-button modal-submit" onClick={() => setShowReceipt(false)}>Cerrar comprobante</button></div></div>}
      {restockProduct && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setRestockProduct(null)}><form className="modal restock-modal" onSubmit={completeRestock}><div className="modal-heading"><div><p className="eyebrow">REPOSICIÓN DE INVENTARIO</p><h2>Reponer medicamento</h2><p>{restockProduct.name} · Stock actual: {restockProduct.stock} unidades</p></div><button type="button" className="close-button" onClick={() => setRestockProduct(null)}>×</button></div><label className="restock-field">Unidades a ingresar<input name="quantity" type="number" min="1" step="1" required autoFocus placeholder="Ej. 50" /></label><button className="primary-button modal-submit">Agregar al inventario</button></form></div>}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  )
}

export default App
