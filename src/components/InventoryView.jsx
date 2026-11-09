import React, { useState } from 'react'
import { ProductTable } from './ProductsView'

export default function InventoryView({ products, query, setQuery, category, setCategory, categories, onAddToCart, onSaveProduct, onDeleteProduct }) {
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const filteredProducts = products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'Todas las categorías' || product.category === category)
  })
  const openForm = (product = null) => { setEditingProduct(product); setFormError(''); setShowForm(true) }
  const submitProduct = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const product = { name: form.get('name').trim(), category: form.get('category'), presentation: form.get('presentation').trim(), stock: Number(form.get('stock')), min: Number(form.get('min')), price: Number(form.get('price')) }
    if (!product.name || !product.presentation || !Number.isFinite(product.stock) || !Number.isFinite(product.min) || !Number.isFinite(product.price) || product.stock < 0 || product.min < 0 || product.price < 0) {
      setFormError('Completa todos los campos y usa valores mayores o iguales a cero.')
      return
    }
    onSaveProduct(product, editingProduct?.id)
    setShowForm(false)
  }
  return <><div className="filters full-filters"><label className="search-box">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." /></label><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><button className="primary-button inventory-add" onClick={() => openForm()}>＋ Producto</button></div>{filteredProducts.length ? <ProductTable products={filteredProducts} onAddToCart={onAddToCart} onEdit={openForm} onDelete={onDeleteProduct} /> : <div className="empty-state">No se encontraron productos.</div>}{showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="modal" onSubmit={submitProduct}><div className="modal-heading"><div><h2>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2><p>Administra nombre, precio y unidades de inventario.</p></div><button type="button" className="close-button" onClick={() => setShowForm(false)}>×</button></div><div className="form-grid"><label>Nombre<input name="name" defaultValue={editingProduct?.name || ''} required /></label><label>Categoría<input name="category" defaultValue={editingProduct?.category || ''} required placeholder="Ej. Analgésicos" /></label><label>Presentación<input name="presentation" defaultValue={editingProduct?.presentation || ''} required /></label><label>Precio (S/)<input name="price" type="number" step="0.01" min="0" defaultValue={editingProduct?.price ?? ''} required /></label><label>Unidades actuales<input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? ''} required /></label><label>Stock mínimo<input name="min" type="number" min="0" defaultValue={editingProduct?.min ?? ''} required /></label></div>{formError && <p className="form-error">⚠ {formError}</p>}<button className="primary-button modal-submit">{editingProduct ? 'Guardar cambios' : 'Crear producto'}</button></form></div>}</>
}
