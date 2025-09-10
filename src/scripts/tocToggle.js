/**
 * Table of Contents Toggle Functionality
 * Handles the collapsible behavior of the table of contents
 */

export function toggleTOC() {
  const content = document.querySelector(".toc-content");
  const icon = document.querySelector(".toggle-icon");

  if (content && icon) {
    content.classList.toggle("collapsed");
    icon.classList.toggle("collapsed");
  }
}

// Make toggleTOC available globally for onclick handlers
window.toggleTOC = toggleTOC;
