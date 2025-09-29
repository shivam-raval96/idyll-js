/**
 * Interactive Sphere Manifold Visualization
 * Shows the mapping between 2D parameter space and 3D sphere using CSS
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
    .style("background", "transparent")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center");

  // Create 2D grid container (bottom half)
  const gridContainer = visualContainer
    .append("div")
    .style("position", "absolute")
    .style("bottom", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "50%")
    .style("background", "transparent");

  // Initialize CSS sphere and point
  let sphere, spherePoint;
  let currentPhi = Math.PI / 2; // latitude (0 to π)
  let currentTheta = 0; // longitude (0 to 2π)

  initCSSsphere();
  init2DGrid();

  function initCSSsphere() {
    // Create sphere container for positioning
    const sphereContainer = sceneContainer
      .append("div")
      .style("position", "relative")
      .style("width", "120px")
      .style("height", "120px");

    // Create the sphere with CSS gradients
    sphere = sphereContainer
      .append("div")
      .style("width", "120px")
      .style("height", "120px")
      .style("border-radius", "50%")
      .style("position", "relative")
      .style(
        "background",
        `radial-gradient(circle at 30% 30%, 
        #87ceeb 0%, 
        #20b2aa 30%, 
        #008b8b 60%, 
        #2f4f4f 100%)`
      )
      .style(
        "box-shadow",
        `
        inset -15px -15px 40px rgba(0,0,0,0.4),
        inset 15px 15px 20px rgba(255,255,255,0.1),
        15px 15px 30px rgba(0,0,0,0.3)`
      )
      .style("transform-style", "preserve-3d");

    // Create point on sphere surface
    spherePoint = sphereContainer
      .append("div")
      .style("position", "absolute")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background", "#dc3545")
      .style("border", "1px solid #000")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.3)")
      .style("z-index", "10")
      .style("transform", "translate(-50%, -50%)"); // Center the point
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
      .attr("width", "16")
      .attr("height", "16");

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

  // Update positions based on spherical coordinates
  function updatePositions(phi, theta) {
    currentPhi = phi;
    currentTheta = theta;

    // Update CSS sphere point position
    if (spherePoint) {
      // Convert spherical coordinates to 2D projection on the sphere face
      const sphereRadius = 60; // Half of sphere width (120px / 2)

      // Adjust theta so that theta = π/2 on the flat surface faces the front
      const adjustedTheta = theta - Math.PI / 2;

      // Calculate 3D position
      const x3d = Math.sin(phi) * Math.cos(adjustedTheta);
      const y3d = Math.cos(phi);
      const z3d = Math.sin(phi) * Math.sin(adjustedTheta);

      // Project to 2D (simple orthographic projection, viewing from front)
      const x2d = x3d * sphereRadius;
      const y2d = -y3d * sphereRadius; // Negative because CSS y increases downward

      // Position relative to sphere center (60px, 60px)
      const pointX = 60 + x2d;
      const pointY = 60 + y2d;

      // Hide point if it's on the back side of the sphere (z3d < 0)
      const isVisible = z3d >= -0.1; // Small threshold for smoother transition

      spherePoint
        .style("left", `${pointX}px`)
        .style("top", `${pointY}px`)
        .style("opacity", isVisible ? 1 : 0.3)
        .style(
          "transform",
          `translate(-50%, -50%) scale(${isVisible ? 1 : 0.7})`
        );
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
