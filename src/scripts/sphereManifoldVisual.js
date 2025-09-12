/**
 * Interactive Sphere Manifold Visualization
 * Shows the mapping between 2D parameter space and 3D sphere
 */

import * as d3 from "d3";

export function createSphereManifoldVisual(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Set up dimensions
  const width = 400;
  const height = 300;

  // Create container for 3D scene and 2D grid
  const visualContainer = d3
    .select(container)
    .append("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("background", "#f8f9fa")
    .style("border-radius", "8px")
    .style("border", "1px solid #e9ecef");

  // Create 3D scene container (top half)
  const sceneContainer = visualContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "50%")
    .style("background", "transparent");

  // Create 2D grid container (bottom half)
  const gridContainer = visualContainer
    .append("div")
    .style("position", "absolute")
    .style("bottom", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "50%")
    .style("background", "transparent");

  // Initialize Three.js scene
  let scene, camera, renderer, sphere, spherePoint;
  let currentPhi = Math.PI / 2; // latitude (0 to π)
  let currentTheta = 0; // longitude (0 to 2π)

  // Check if Three.js is available
  if (typeof THREE === "undefined") {
    console.error("Three.js is required for 3D sphere visualization");
    // Fallback to 2D representation
    createFallbackVisualization();
    return;
  }

  initThreeJS();
  init2DGrid();

  function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / (height / 2), 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height / 2);
    renderer.setClearColor(0x000000, 0);
    sceneContainer.node().appendChild(renderer.domElement);

    // Create sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(1.5, 15, 15);
    const sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: false,
      opacity: 0.3,
    });
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Create point on sphere
    const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: 0xdc3545,
      transparent: false,
      wireframe: true,
    });
    spherePoint = new THREE.Mesh(pointGeometry, pointMaterial);
    sphere.add(spherePoint); // Add as child of sphere so it rotates with it

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Position camera
    camera.position.z = 3;
    camera.position.y = 0.5;
    camera.lookAt(0, 0, 0);

    // Add rotation controls
    let isMouseDown = false;
    let mouseX = 0,
      mouseY = 0;
    let rotationX = 0,
      rotationY = 0;

    renderer.domElement.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    renderer.domElement.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    renderer.domElement.addEventListener("mousemove", (event) => {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;

        sphere.rotation.y = rotationY;
        sphere.rotation.x = rotationX;

        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Add rotate icon above the sphere
    const rotateIconGroup = d3
      .select(sceneContainer.node())
      .append("div")
      .style("position", "absolute")
      .style("top", "-3px")
      .style("left", "50%")
      .style("transform", "translateX(-50%)")
      .style("z-index", "10");

    rotateIconGroup
      .append("img")
      .attr("src", "assets/images/rotate-me.png")
      .style("width", "24px")
      .style("height", "24px")
      .style("opacity", "0.7");
  }

  function init2DGrid() {
    // Create SVG for 2D grid
    const svg = d3
      .select(gridContainer.node())
      .append("svg")
      .attr("width", width)
      .attr("height", height / 2);

    const gridGroup = svg.append("g").attr("class", "grid-group");
    const gridPointGroup = svg.append("g").attr("class", "grid-point-group");

    const gridStartX = 20;
    const gridStartY = 20;
    const gridEndX = width - 20;
    const gridEndY = height / 2 - 20;
    const gridWidth = gridEndX - gridStartX;
    const gridHeight = gridEndY - gridStartY;
    const gridCols = 15;
    const gridRows = 15;

    // Vertical grid lines
    for (let i = 0; i <= gridCols; i++) {
      const x = gridStartX + (i / gridCols) * gridWidth;
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", gridStartY)
        .attr("x2", x)
        .attr("y2", gridEndY)
        .attr("stroke", "#dee2e6")
        .attr("stroke-width", 1);
    }

    // Horizontal grid lines
    for (let i = 0; i <= gridRows; i++) {
      const y = gridStartY + (i / gridRows) * gridHeight;
      gridGroup
        .append("line")
        .attr("x1", gridStartX)
        .attr("y1", y)
        .attr("x2", gridEndX)
        .attr("y2", y)
        .attr("stroke", "#dee2e6")
        .attr("stroke-width", 1);
    }

    // Add black rectangle boundary for the surface
    gridGroup
      .append("rect")
      .attr("x", gridStartX)
      .attr("y", gridStartY)
      .attr("width", gridWidth)
      .attr("height", gridHeight)
      .attr("fill", "none")
      .attr("stroke", "#000000")
      .attr("stroke-width", 2);

    // Create the moving point on the grid
    const gridPoint = gridPointGroup
      .append("circle")
      .attr("r", 12)
      .attr("fill", "#dc3545")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add clickable mouse icon inside the grid point
    const mouseIconGroup = svg.append("g").attr("class", "mouse-icon");

    // Mouse cursor icon (positioned inside the point)
    const mouseIcon = mouseIconGroup
      .append("image")
      .attr("href", "assets/images/click-me.png")
      .attr("x", gridStartX - 8)
      .attr("y", gridStartY - 8)
      .attr("width", 16)
      .attr("height", 16);

    // Add labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#495057")
      .text("2D Parameter Space (φ, θ)");

    // Add coordinate labels
    svg
      .append("text")
      .attr("x", gridStartX - 5)
      .attr("y", gridStartY + 10)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", "#6c757d")
      .text("φ=0");

    svg
      .append("text")
      .attr("x", gridStartX - 5)
      .attr("y", gridEndY + 15)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", "#6c757d")
      .text("φ=π");

    svg
      .append("text")
      .attr("x", gridStartX + 10)
      .attr("y", gridStartY - 5)
      .attr("font-size", "10px")
      .attr("fill", "#6c757d")
      .text("θ=0");

    svg
      .append("text")
      .attr("x", gridEndX - 10)
      .attr("y", gridStartY - 5)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", "#6c757d")
      .text("θ=2π");

    // Add interactive area for grid
    const gridArea = svg
      .append("rect")
      .attr("x", gridStartX - 5)
      .attr("y", gridStartY - 5)
      .attr("width", gridWidth + 10)
      .attr("height", gridHeight + 10)
      .attr("fill", "transparent")
      .attr("stroke", "none")
      .style("cursor", "pointer");

    // Grid interaction
    gridArea.on("mousemove", function (event) {
      const [mouseX, mouseY] = d3.pointer(event, this);
      const relativeX = mouseX - gridStartX;
      const relativeY = mouseY - gridStartY;

      const normalizedX = Math.max(0, Math.min(1, relativeX / gridWidth));
      const normalizedY = Math.max(0, Math.min(1, relativeY / gridHeight));

      const theta = normalizedX * 2 * Math.PI;
      const phi = normalizedY * Math.PI;

      updatePositions(phi, theta);
    });

    // Store references for updatePositions function
    window.spherePoint = spherePoint;
    window.gridPoint = gridPoint;
    window.mouseIcon = mouseIcon;
    window.gridStartX = gridStartX;
    window.gridStartY = gridStartY;
    window.gridWidth = gridWidth;
    window.gridHeight = gridHeight;
  }

  function createFallbackVisualization() {
    // Fallback 2D visualization if Three.js is not available
    const svg = d3
      .select(sceneContainer.node())
      .append("svg")
      .attr("width", width)
      .attr("height", height / 2);

    const sphereGroup = svg.append("g").attr("class", "sphere-group");

    sphereGroup
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 4)
      .attr("r", 50)
      .attr("fill", "none")
      .attr("stroke", "#6c757d")
      .attr("stroke-width", 2);

    sphereGroup
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 4 - 60)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#6c757d")
      .text("3D Sphere (Three.js required)");
  }

  // Update positions based on spherical coordinates
  function updatePositions(phi, theta) {
    currentPhi = phi;
    currentTheta = theta;

    // Update 3D sphere point position
    if (spherePoint) {
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);

      // Position the point slightly outside the sphere surface for visibility
      // Since the point is now a child of the sphere, we use local coordinates
      const pointRadius = 0.08;
      const scale = 1 + pointRadius; // Scale relative to sphere radius of 1

      spherePoint.position.set(x * scale, y * scale, z * scale);
    }

    // Update 2D grid point position
    if (window.gridPoint) {
      const normalizedTheta = theta / (2 * Math.PI);
      const normalizedPhi = phi / Math.PI;
      const gridX = window.gridStartX + normalizedTheta * window.gridWidth;
      const gridY = window.gridStartY + normalizedPhi * window.gridHeight;

      window.gridPoint.attr("cx", gridX).attr("cy", gridY);

      // Update mouse icon position (move with the point)
      if (window.mouseIcon) {
        window.mouseIcon.attr("x", gridX - 8).attr("y", gridY - 8);
      }
    }
  }

  // Initialize with default position
  updatePositions(Math.PI / 2, 0);

  return visualContainer;
}
