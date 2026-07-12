/**
 * Escape user/admin text before it is interpolated into a raw-HTML map popup
 * (Leaflet `bindPopup`, Google `InfoWindow.content`, and Yandex `balloonContent` all render
 * their content as RAW HTML). Used by every place that builds a `popupHtml` string.
 */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'))
}
