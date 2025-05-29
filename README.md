# 📘 Price Comparator — Estado del Proyecto

## ✅ Funcionalidades ya implementadas

- Popup visual con imagen, título, precio y botón.
- Backend local activo en `localhost:3000/api/scrape`.
- Detección de país por IP.
- Archivo `stores.js` con tiendas por país.
- Estructura con manifest, background, popup y content script.

## ⚠️ Funcionalidades implementadas pero con errores

- Comunicación rota entre `popup.js`, `background.js` y `content.js`.
- `getProductInfo()` no se ejecuta correctamente desde el popup.
- Precio no se extrae ni guarda en `chrome.storage.local` como debería.
- Botón "Actualizar" ejecuta pero no actualiza correctamente el DOM.

## 🔜 Pendientes por hacer

- Arreglar el flujo de mensajes: popup → background → content → respuesta.
- Probar extracción real en Amazon o MercadoLibre.
- Verificar conexión backend + frontend.
- Agregar ícono flotante (más adelante).
- Mejores selectores + soporte para más países.

## 🧠 Para mañana

- Empezar por arreglar los `chrome.runtime.sendMessage` y `onMessage` entre scripts.
- Asegurar que `getProductInfo()` devuelva algo útil.
- Usar `console.log()` en cada paso para rastrear el flujo.
