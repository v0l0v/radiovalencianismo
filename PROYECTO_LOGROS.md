# 📊 Logros del Proyecto, Tareas Pendientes y Propuestas Locas

## 🏆 Logros Conseguidos
- **Persistencia de Reordenación del Panel de Control:** Se añadió un botón para guardar la configuración manual en `localStorage` tanto en `index.html` como en `secret.html`.
- **Limpieza Automática de URLs y Títulos:** Filtro por regex para eliminar enlaces `http://` y `https://` de los titulares y descripciones de noticias.
- **Limpieza de Nombres de Fuentes de Noticias:** Algoritmo avanzado que acorta y refina nombres de fuentes de RSS redundantes (eliminando sufijos como `Page`, `RSS`, etc.).
- **Rediseño Completo de la Modal de Noticias:** Se unificó el diseño con la estética premium de tarjetas cuadradas de la página de inicio.
- **Paginación Inteligente y Robusta en la Modal de Noticias:** Carga chunks de 8 en 8, vacía el contenedor anterior de la vista antes de añadir el nuevo bloque para un efecto de paginación impecable, restablece el scroll y ofrece un botón de respaldo manual.
- **Gestión Inteligente de Reproducción en Liquidsoap (`randomize`):** Configuración de playlists en Liquidsoap para garantizar que se reproducen todas las canciones antes de repetir alguna ya puesta.
- **No-Indexación y Privacidad de `secret.html`:** Meta tag robots y bloqueo en `robots.txt` para garantizar que la página secreta nunca sea indexada en Google.
- **Redirección de Móviles Inteligente:** Acceso automático de dispositivos móviles a `index_movil.html` mediante script de detección en el `<head>`.
- **Noticiero Flash Automatizado:** Nuevo sistema que agrega noticias de 10 fuentes RSS y las muestra dinámicamente en el reproductor alternando con refranes valencianos, incluyendo efecto visual de "Mascletà" al entrar noticias.

---

## 🛠️ Tareas Pendientes
- [ ] Optimizar la carga de la biblioteca multimedia MP3 a medida que crezca.
- [ ] Expandir la lista de feeds del archivo `feeds.txt` para enriquecer la sección de noticias.
- [ ] Implementar automatización adicional con Liquidsoap y la integración con el reproductor.

---

## 🤪 5 Propuestas Locas, Locas y Atrevidas para el Futuro
Aquí tienes 5 ideas completamente atrevidas y diferenciales para la Valencianismo Radio:

1. 🧨 **La Mascletà Visual Dinámica Sincronizada:** ¡CONSEGUIDO! La web vibra y brilla cuando entran noticias de última hora o Zaps.
2. 🎙️ **"Terreta Virtual AI" (Locutor de la tierra en directo):** Un locutor virtual entrenado con IA que hable con acento valenciano clásico, el cual entra entre canciones para leer el santoral, el refrán del día de `refranes.txt` o la noticia más leída.
3. 💿 **El Gramófono 3D Interactivo:** Un visor e interfaz 3D (con Three.js) en la página principal donde los oyentes pueden ver y arrastrar un vinilo o un CD a un reproductor virtual para cambiar el estilo de música o la visualización.
4. 📈 **El "Mascletà-O-Meter":** Un medidor en vivo en la cabecera. A medida que los usuarios reaccionan, comparten o donan satoshis, la mecha avanza. Al llegar al 100%, ¡se desatan fuegos artificiales virtuales para todos los que estén conectados en ese momento!
5. 🎮 **"La Fallera Mayor" - Trivia en Directo:** Un minijuego rápido integrado en la barra lateral donde, una vez por hora, aparece una pregunta sobre la historia de Valencia. El primer oyente en responder correctamente mediante el chat o Nostr gana satoshis directamente en su wallet.
