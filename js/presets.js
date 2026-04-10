const STORAGE_KEY = 'exercisePresets';

export function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function savePresets(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function addPreset(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const presets = getPresets();
  if (presets.some(p => p.toLowerCase() === trimmed.toLowerCase())) return;
  presets.push(trimmed);
  savePresets(presets);
}

export function removePreset(name) {
  const presets = getPresets().filter(p => p.toLowerCase() !== name.toLowerCase());
  savePresets(presets);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Attaches an autocomplete dropdown to a text input.
 * Wraps the input in a .autocomplete-wrap div and appends a
 * .autocomplete-dropdown div. Shows up to 6 matching presets on input.
 * Tapping a suggestion fills the input (user still clicks Add to confirm).
 */
export function attachAutocomplete(input) {
  const wrap = document.createElement('div');
  wrap.className = 'autocomplete-wrap';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.hidden = true;
  wrap.appendChild(dropdown);

  function updateDropdown() {
    const val = input.value.trim().toLowerCase();
    const matches = val
      ? getPresets().filter(p => p.toLowerCase().includes(val)).slice(0, 6)
      : [];
    if (matches.length === 0) {
      dropdown.hidden = true;
      return;
    }
    dropdown.innerHTML = matches.map(p =>
      `<div class="autocomplete-item">${esc(p)}</div>`
    ).join('');
    dropdown.hidden = false;
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent blur firing before mousedown completes
        input.value = item.textContent;
        dropdown.hidden = true;
      });
    });
  }

  input.addEventListener('input', updateDropdown);
  input.addEventListener('focus', updateDropdown);
  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 150);
  });
}
