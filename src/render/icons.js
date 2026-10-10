// Inline SVG icons (stroke = currentColor). Usage: icon('cart').
const paths = {
  cart: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  skip: '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
  soundOn: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  soundOff: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  grape: '<circle cx="9" cy="10" r="2.2"/><circle cx="14" cy="10" r="2.2"/><circle cx="11.5" cy="14" r="2.2"/><circle cx="16.5" cy="14" r="2.2"/><circle cx="14" cy="18" r="2.2"/><path d="M12 7.8V4c1.5 0 3 .6 4 2"/>',
  glass: '<path d="M7 3h10l-.6 5.5A4.4 4.4 0 0 1 12 12.5a4.4 4.4 0 0 1-4.4-4L7 3z"/><path d="M12 12.5V20M8.5 20.5h7"/><path d="M7.4 7h9.2"/>',
  barrel: '<ellipse cx="12" cy="4.5" rx="6" ry="1.8"/><path d="M6 4.5C4.8 8 4.8 16 6 19.5M18 4.5c1.2 3.5 1.2 11.5 0 15"/><ellipse cx="12" cy="19.5" rx="6" ry="1.8"/><path d="M5.2 9h13.6M5.2 15h13.6"/>',
  thermo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="M8.5 11 6 3h4l2 5 2-5h4l-2.5 8"/><path d="M12 12.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>',
  vine: '<path d="M12 21V9"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 10c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  cheese: '<path d="M3 17l15-9 3 3v6z"/><path d="M3 17v3h18v-3"/><circle cx="12" cy="15" r="1"/><circle cx="16" cy="13.5" r=".8"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>',
  toast: '<path d="M5 3h5l-.4 4.6A2.6 2.6 0 0 1 7 10a2.6 2.6 0 0 1-2.6-2.4z"/><path d="M14 3h5l.6 4.6A2.6 2.6 0 0 1 17 10a2.6 2.6 0 0 1-2.6-2.4z"/><path d="M7 10v8M17 10v8M5 21h4M15 21h4"/>',
  wine: '<path d="M10 2h4v4.5c0 1 1.5 2 1.5 4V21h-7V10.5c0-2 1.5-3 1.5-4z"/><path d="M8.5 14h7"/>',
  arrowRight: '<path d="M4 12h15M14 6l6 6-6 6"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
