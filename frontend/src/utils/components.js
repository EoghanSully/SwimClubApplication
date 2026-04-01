/**
 * Component Loader Utility
 * Fetches reusable HTML component files and provides template rendering.
 * Components live in src/components/ and are injected where needed.
 */

const _cache = {};

/**
 * Fetch and cache a component HTML file from src/components/
 * @param {string} name - Filename without .html extension
 * @returns {Promise<string>}
 */
export async function loadComponent(name) {
  if (_cache[name]) return _cache[name];
  const res = await fetch(`src/components/${name}.html`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Component "${name}" not found (HTTP ${res.status})`);
  _cache[name] = await res.text();
  return _cache[name];
}

/**
 * Render a template string by substituting {{key}} tokens with data values.
 * Values are inserted as-is; escape before passing if inserting into HTML attributes.
 * @param {string} templateHtml - HTML string with {{key}} placeholders
 * @param {Object} data - Key/value pairs to substitute
 * @returns {string}
 */
export function renderTemplate(templateHtml, data) {
  return templateHtml.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = data[key.trim()];
    return val !== undefined && val !== null ? String(val) : '';
  });
}
