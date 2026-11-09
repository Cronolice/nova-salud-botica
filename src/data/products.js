export const initialProducts = []

export function getProductStatus(product) {
  if (product.stock <= product.min / 2) return { label: 'Stock crítico', className: 'critical' }
  if (product.stock <= product.min) return { label: 'Stock bajo', className: 'low' }
  return { label: 'Disponible', className: 'available' }
}
