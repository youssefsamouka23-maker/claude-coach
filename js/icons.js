// js/icons.js
// Small inline icon set (stroke-based, currentColor) — no icon font/CDN needed.
// Keeping these as plain functions returning SVG strings so they drop straight
// into innerHTML templates anywhere in the app.

const wrap = (inner, vb = 24) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

export const icons = {
  dashboard: wrap(
    `<path d="M3 13.5h7V3H3v10.5zM14 21h7V10.5h-7V21zM14 3v4.5h7V3h-7zM3 21h7v-4.5H3V21z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`
  ),
  today: wrap(
    `<rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" stroke-width="1.6"/>
     <path d="M3.5 9.5h17" stroke="currentColor" stroke-width="1.6"/>
     <path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
     <path d="M8 14l1.6 1.6L13 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  progress: wrap(
    `<path d="M4 19V5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
     <path d="M4 19h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
     <path d="M6.5 16l4-4.5 3 2.5L18.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  coach: wrap(
    `<path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
     <path d="M8 10h8M8 13h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  settings: wrap(
    `<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/>
     <path d="M12 3.5v2.4M12 18.1v2.4M5.4 6.5l1.8 1.5M16.8 16l1.8 1.5M3.5 12h2.4M18.1 12h2.4M5.4 17.5l1.8-1.5M16.8 8l1.8-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`
  ),
  heart: wrap(
    `<path d="M12 20s-7.2-4.6-9.6-9.4C.9 7.2 2.6 4 6 4c2 0 3.4 1.1 4 2.4C10.6 5.1 12 4 14 4c3.4 0 5.1 3.2 3.6 6.6C15.2 15.4 12 20 12 20z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`
  ),
  bolt: wrap(
    `<path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`
  ),
  moon: wrap(
    `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`
  ),
  flame: wrap(
    `<path d="M12 21c4 0 6.5-2.6 6.5-6 0-2.4-1.3-3.8-2.2-5 .2 2-1 2.8-1.7 1.8C13.8 9 14 6.5 12 3c.6 3-1.6 4.6-3 6.8-1 1.6-1.5 2.8-1.5 4.2 0 3.4 1.7 7 4.5 7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`
  ),
  refresh: wrap(
    `<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
     <path d="M18 3v4.5h-4.5M6 21v-4.5h4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  check: wrap(
    `<path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  chevronDown: wrap(
    `<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  eye: wrap(
    `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
     <circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.5"/>`
  ),
  eyeOff: wrap(
    `<path d="M3.5 3.5l17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
     <path d="M9.9 5.6A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a14.6 14.6 0 0 1-2.9 3.7M6.4 7.4C4 9.2 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.2 0 2.3-.2 3.3-.6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
     <path d="M9.9 12a2.1 2.1 0 0 0 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  sparkle: wrap(
    `<path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
     <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>`
  ),
  key: wrap(
    `<circle cx="8" cy="15" r="3.5" stroke="currentColor" stroke-width="1.6"/>
     <path d="M10.6 12.4 18 5M15.5 7.5l2 2M18 5l2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  lock: wrap(
    `<rect x="5" y="10.5" width="14" height="9.5" rx="2.2" stroke="currentColor" stroke-width="1.6"/>
     <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="1.6"/>`
  ),
  chevronRight: wrap(
    `<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  alert: wrap(
    `<path d="M12 3.5 21 19H3L12 3.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
     <path d="M12 9.5v4.2M12 16.3h.01" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`
  ),
  dumbbell: wrap(
    `<path d="M4 9v6M2.5 10.5v3M21.5 10.5v3M20 9v6M7 12h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
     <rect x="6" y="8.5" width="3" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
     <rect x="15" y="8.5" width="3" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>`
  ),
};

export function icon(name, cls = "") {
  return `<span class="icon ${cls}">${icons[name] || ""}</span>`;
}
