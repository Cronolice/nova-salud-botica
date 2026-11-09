const STORAGE_PREFIX = 'nova-salud-v2:'

export function loadData(key, fallback) {
  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return saved ? JSON.parse(saved) : fallback
  } catch (error) {
    console.error(`No se pudo leer la base temporal (${key}).`, error)
    return fallback
  }
}

export function saveData(key, value) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error(`No se pudo guardar la base temporal (${key}).`, error)
  }
}
