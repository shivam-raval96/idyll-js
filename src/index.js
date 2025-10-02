import { generateTableOfContents } from "./scripts/tocGenerator.js";
import { toggleTOC } from "./scripts/tocToggle.js";
import { setupScrollMonitoring } from "./scripts/scrollMonitor.js";
import { createManifoldVisualization } from "./scripts/heroVisual.js";
import { createCircleManifoldVisual } from "./scripts/circleManifoldVisual.js";
import { createSphereManifoldVisual } from "./scripts/sphereManifoldVisual.js";
import { createLinearSubspaceVisual } from "./scripts/linearSubspaceVisual.js";
import {
  createCurvedManifold3D,
  createCurvedManifold2D,
} from "./scripts/curvedManifoldVisual.js";
import { createManifoldScatterplot } from "./scripts/manifoldScatterplot.js";
import { createTangentSpaceVisual } from "./scripts/tangentSpaceVisual.js";

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

    // Create the circle manifold visualization
    createCircleManifoldVisual("circle-manifold-visual");

    // Create the sphere manifold visualization
    createSphereManifoldVisual("sphere-manifold-visual");

    // Create the linear subspace visualization
    createLinearSubspaceVisual("linear-subspace-visual");

    // Create the manifold scatterplot visualization
    createManifoldScatterplot("manifold-scatterplot");

    // Create the tangent space visualization
    createTangentSpaceVisual("tangent-space-visual");

    // Create the curved manifold visualizations
    setTimeout(() => {
      createCurvedManifold3D("curved-manifold-3d");
      createCurvedManifold2D("curved-manifold-2d");
    }, 100);
  },
  { once: true }
);
