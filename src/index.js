import { generateTableOfContents } from "./scripts/tocGenerator.js";
import { toggleTOC } from "./scripts/tocToggle.js";
import { setupScrollMonitoring } from "./scripts/scrollMonitor.js";
import { createManifoldVisualization } from "./scripts/heroVisual.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    console.log("DOMContentLoaded");

    // Initialize table of contents
    generateTableOfContents();

    // Setup scroll monitoring for active link highlighting
    setupScrollMonitoring();

    // Create the D3 floating grid banner
    createManifoldVisualization("banner-container");
  },
  { once: true }
);
