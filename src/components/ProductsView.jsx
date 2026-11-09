import React from 'react'
import { getProductStatus } from '../data/products'

export function ProductTable({ products, onAddToCart, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table><thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>STOCK</th><th>PRECIO</th><th>ESTADO</th><th /></tr></thead>
      <tbody>{products.map((product) => {
        const status = getProductStatus(product)
        return <tr key={product.id}>
          <td><div className="product-cell"><span className={`product-image ${product.tone}`}>{product.icon}</span><div><strong>{product.name}</strong><small>{product.presentation}</small></div></div></td>
          <td>{product.category}</td><td><strong className={product.stock <= product.min ? 'stock-low' : ''}>{product.stock}</strong><small className="stock-unit"> unidades</small></td>
          <td>S/ {product.price.toFixed(2)}</td><td><span className={`status ${status.className}`}><i />{status.label}</span></td>
          <td><button className="row-menu" onClick={() => onAddToCart(product)}>＋</button>{onEdit && <button className="row-action" onClick={() => onEdit(product)}>Editar</button>}{onDelete && <button className="row-action danger" onClick={() => onDelete(product)}>Eliminar</button>}</td>
        </tr>
      })}</tbody></table>
    </div>
  )
}

export function ProductCards({ products, onAddToCart }) {
  return <div className="sales-product-grid">{products.map((product) => <button className="sales-product" key={product.id} onClick={() => onAddToCart(product)}><span className={`product-image ${product.tone}`}>{product.icon}</span><strong>{product.name}</strong><small>S/ {product.price.toFixed(2)} · {product.stock} disponibles</small></button>)}</div>
}
