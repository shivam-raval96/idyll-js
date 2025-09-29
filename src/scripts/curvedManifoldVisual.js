/**
 * Interactive Curved Manifold Visualization
 * Shows a 3D curved surface with peaks and valleys and its 2D projection
 */

import * as d3 from "d3";

export function createCurvedManifold3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // Set up responsive dimensions
  const containerWidth = container.offsetWidth || 400;
  const width = Math.min(containerWidth, 400);
  const height = Math.min(width * 0.8, 350);

  // Create main container using D3
  const mainContainer = d3
    .select(container)
    .append("div")
    .style("width", "100%")
    .style("max-width", `${width}px`)
    .style("height", `${height}px`)
    .style("position", "relative")
    .style("margin", "0 auto")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("background", "#fafafa");

  // Create Three.js scene for 3D visualization
  const sceneContainer = mainContainer
    .append("div")
    .style("width", "100%")
    .style("height", "100%")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0");

  // Initialize Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  sceneContainer.node().appendChild(renderer.domElement);

  // Set camera position
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Create curved surface with peaks and valleys
  const surfaceGeometry = new THREE.PlaneGeometry(6, 6, 50, 50);
  const surfaceMaterial = new THREE.MeshLambertMaterial({
    color: 0x20b2aa,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  // Apply curvature to create peaks and valleys
  const positions = surfaceGeometry.attributes.position;
  const colors = [];

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    // Create multiple peaks and valleys using sine waves
    const z1 = 0.5 * Math.sin(x * 0.8) * Math.cos(y * 0.8);
    const z2 = 0.3 * Math.sin(x * 1.5) * Math.sin(y * 1.2);
    const z3 = 0.2 * Math.sin(x * 2.1) * Math.cos(y * 1.8);
    const z = z1 + z2 + z3;

    positions.setZ(i, z);

    // Color based on height (elevation)
    const normalizedZ = (z + 1) / 2; // Normalize to 0-1
    const color = new THREE.Color();
    color.setHSL(0.5 + normalizedZ * 0.3, 0.7, 0.3 + normalizedZ * 0.4);
    colors.push(color.r, color.g, color.b);
  }

  positions.needsUpdate = true;
  surfaceGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
  surfaceMaterial.vertexColors = true;

  const curvedSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  curvedSurface.rotation.x = Math.PI / 2; // Rotate 90 degrees around X-axis to make it vertical
  scene.add(curvedSurface);

  // Create interactive point
  const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6b6b,
  });
  const surfacePoint = new THREE.Mesh(pointGeometry, pointMaterial);
  scene.add(surfacePoint);

  // Add title
  mainContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("color", "#333")
    .style("z-index", "10")
    .text("3D Curved Surface");

  // Store references for external updates
  window.curvedManifold3D = {
    surfacePoint: surfacePoint,
    updatePoint: (x, y) => {
      // Calculate z value using the same function as the surface
      const z1 = 0.5 * Math.sin(x * 0.8) * Math.cos(y * 0.8);
      const z2 = 0.3 * Math.sin(x * 1.5) * Math.sin(y * 1.2);
      const z3 = 0.2 * Math.sin(x * 2.1) * Math.cos(y * 1.8);
      const z = z1 + z2 + z3;

      // Update 3D point position - account for vertical rotation
      // Since surface is rotated 90° around X-axis, we need to adjust coordinates
      // Original: (x, y, z) -> Rotated: (x, z, -y)
      surfacePoint.position.set(x, z, -y);
    },
  };

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

export function createCurvedManifold2D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // Set up responsive dimensions
  const containerWidth = container.offsetWidth || 400;
  const width = Math.min(containerWidth, 400);
  const height = Math.min(width * 0.8, 350);

  // Create main container using D3
  const mainContainer = d3
    .select(container)
    .append("div")
    .style("width", "100%")
    .style("max-width", `${width}px`)
    .style("height", `${height}px`)
    .style("position", "relative")
    .style("margin", "0 auto")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("background", "#fafafa");

  // Create SVG for 2D projection
  const svg = d3
    .select(mainContainer.node())
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create heatmap-like 2D projection
  const projectionGroup = svg.append("g");

  // Generate 2D projection data
  const projectionData = [];
  const resolution = 30;

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = (i / resolution) * 6 - 3;
      const y = (j / resolution) * 6 - 3;

      // Same function as 3D surface
      const z1 = 0.5 * Math.sin(x * 0.8) * Math.cos(y * 0.8);
      const z2 = 0.3 * Math.sin(x * 1.5) * Math.sin(y * 1.2);
      const z3 = 0.2 * Math.sin(x * 2.1) * Math.cos(y * 1.8);
      const z = z1 + z2 + z3;

      projectionData.push({
        x: (i / resolution) * width,
        y: (j / resolution) * height,
        z: z,
        normalizedZ: (z + 1) / 2,
      });
    }
  }

  // Create color scale
  const colorScale = d3.scaleSequential(d3.interpolateViridis);

  // Draw 2D projection
  projectionGroup
    .selectAll("rect")
    .data(projectionData)
    .enter()
    .append("rect")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("width", width / resolution)
    .attr("height", height / resolution)
    .attr("fill", (d) => colorScale(d.normalizedZ))
    .attr("opacity", 0.8);

  // Add projection point
  const projectionPoint = projectionGroup
    .append("circle")
    .attr("r", 6)
    .attr("fill", "#ff6b6b")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("2D Projection");

  // Make the entire SVG interactive
  svg
    .style("cursor", "crosshair")
    .on("click", function (event) {
      const [mouseX, mouseY] = d3.pointer(event, this);

      // Convert screen coordinates to parameter space
      const x = (mouseX / width) * 6 - 3;
      const y = (mouseY / height) * 6 - 3;

      // Update both visualizations
      updateBothVisualizations(x, y);
    })
    .on("mousemove", function (event) {
      if (event.buttons === 1) {
        // Only if left mouse button is pressed
        const [mouseX, mouseY] = d3.pointer(event, this);

        // Convert screen coordinates to parameter space
        const x = (mouseX / width) * 6 - 3;
        const y = (mouseY / height) * 6 - 3;

        // Update both visualizations
        updateBothVisualizations(x, y);
      }
    });

  // Function to update both visualizations
  function updateBothVisualizations(x, y) {
    // Update 2D projection point
    const projX = ((x + 3) / 6) * width;
    const projY = ((y + 3) / 6) * height;
    projectionPoint.attr("cx", projX).attr("cy", projY);

    // Update 3D visualization if available
    if (window.curvedManifold3D && window.curvedManifold3D.updatePoint) {
      window.curvedManifold3D.updatePoint(x, y);
    }
  }

  // Store references for external updates
  window.curvedManifold2D = {
    projectionPoint: projectionPoint,
    updatePoint: (x, y) => {
      // Update 2D projection point
      const projX = ((x + 3) / 6) * width;
      const projY = ((y + 3) / 6) * height;
      projectionPoint.attr("cx", projX).attr("cy", projY);
    },
  };
}
