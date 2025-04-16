// Theme color management utilities

// Default primary color
const DEFAULT_PRIMARY_COLOR = "#7269FF";
const DEFAULT_PRIMARY_RGB = "114 105 255";

// Convert hex to RGB
const hexToRgb = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r} ${g} ${b}`;
};

// Get the current primary color from localStorage or use default
export const getPrimaryColor = () => {
  return localStorage.getItem("primaryColor") || DEFAULT_PRIMARY_COLOR;
};

// Get the current primary RGB values from localStorage or use default
export const getPrimaryRgb = () => {
  return localStorage.getItem("primaryColorRgb") || DEFAULT_PRIMARY_RGB;
};

// Set the primary color in localStorage
export const setPrimaryColor = (color) => {
  localStorage.setItem("primaryColor", color);
  const rgb = hexToRgb(color);
  localStorage.setItem("primaryColorRgb", rgb);
  applyPrimaryColor(color, rgb);
};

// Apply the primary color to the document
export const applyPrimaryColor = (color, rgb) => {
  console.log("applyPrimaryColor", color, rgb);
  // Create or update CSS variables
  document.documentElement.style.setProperty("--primary-color", color);
  document.documentElement.style.setProperty("--primary-color-rgb", rgb);

  // Update Tailwind CSS custom property
  const style = document.createElement("style");
  style.innerHTML = `
    :root {
      --primary-color: ${color};
      --primary-color-rgb: ${rgb};
    }
  `;

  // Remove any existing style tag with this ID
  const existingStyle = document.getElementById("primary-color-style");
  if (existingStyle) {
    existingStyle.remove();
  }

  // Add the new style tag
  style.id = "primary-color-style";
  document.head.appendChild(style);

  // Force a re-render of the page to apply the new color
  // This is a workaround for some browsers that don't update CSS variables immediately
  const event = new Event("primaryColorChanged");
  window.dispatchEvent(event);
};

// Initialize the primary color on app load
export const initializePrimaryColor = () => {
  const savedColor = getPrimaryColor();
  const savedRgb = getPrimaryRgb();
  applyPrimaryColor(savedColor, savedRgb);
};
