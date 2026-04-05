/**
 * COMPONENT LOADER UTILITY
 * FETCHES REUSABLE HTML COMPONENT FILES AND PROVIDES TEMPLATE RENDERING.
 * COMPONENTS LIVE IN SRC/COMPONENTS/ AND ARE INJECTED WHERE NEEDED.
 */

// IN-MEMORY CACHE SO EACH COMPONENT HTML FILE IS FETCHED ONCE PER SESSION.
const _cache = {};

/**
 * FETCH AND CACHE A COMPONENT HTML FILE FROM SRC/COMPONENTS/
 * @param {string} name - FILENAME WITHOUT .HTML EXTENSION
 * @returns {Promise<string>}
 */
export async function loadComponent(name) {
  // RETURN CACHED TEMPLATE IMMEDIATELY IF ALREADY LOADED.
  if (_cache[name]) return _cache[name];

  // FETCH RAW HTML TEMPLATE FROM THE COMPONENTS FOLDER.
  const res = await fetch(`src/components/${name}.html`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Component "${name}" not found (HTTP ${res.status})`);

  // STORE TEMPLATE IN CACHE FOR FUTURE REUSE.
  _cache[name] = await res.text();
  return _cache[name];
}

/**
 * RENDER A TEMPLATE STRING BY SUBSTITUTING {{KEY}} TOKENS WITH DATA VALUES.
 * VALUES ARE INSERTED AS-IS; ESCAPE BEFORE PASSING IF INSERTING INTO HTML ATTRIBUTES.
 * @param {string} templateHtml - HTML STRING WITH {{KEY}} PLACEHOLDERS
 * @param {Object} data - KEY/VALUE PAIRS TO SUBSTITUTE
 * @returns {string}
 */
export function renderTemplate(templateHtml, data) {
  // REPLACE EACH {{KEY}} TOKEN WITH ITS MATCHING VALUE FROM DATA.
  return templateHtml.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = data[key.trim()];
    return val !== undefined && val !== null ? String(val) : '';
  });
}
