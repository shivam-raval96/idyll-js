/**
 * Interactive Tangent Space Visualization
 * Shows a fixed sphere with a tangent plane that moves across its surface
 * Fixed version with proper grid rotation
 */

import * as d3 from "d3";

export function createTangentSpaceVisual(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Set up dimensions
  const width = 500;
  const height = 400;
  const sphereRadius = 100;

  // Create main container
  const visualContainer = d3
    .select(container)
    .append("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("background", "#ffffff")
    .style("border-radius", "8px")
    .style("border", "1px solid #e9ecef")
    .style("overflow", "hidden");

  // Create 3D scene container
  const sceneContainer = visualContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "100%")
    .style("background", "transparent")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("perspective", "1000px")
    .style("perspective-origin", "center center");

  // Initialize state - angles for point on sphere
  let theta = -Math.PI / 4; // azimuthal angle (-45 degrees)
  let phi = Math.PI / 4; // polar angle
  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  // Create the 3D scene group
  const sceneGroup = sceneContainer
    .append("div")
    .style("position", "relative")
    .style("width", "300px")
    .style("height", "300px")
    .style("transform-style", "preserve-3d");

  // Create tangent plane group FIRST (so it renders behind sphere)
  const tangentGroup = sceneGroup
    .append("div")
    .style("position", "absolute")
    .style("width", "0")
    .style("height", "0")
    .style("left", "150px")
    .style("top", "150px")
    .style("transform-style", "preserve-3d");

  // Create tangent plane
  const tangentPlane = tangentGroup
    .append("div")
    .style("position", "absolute")
    .style("width", "120px")
    .style("height", "120px")
    .style("left", "-60px")
    .style("top", "-60px")
    .style("background", "rgba(220, 53, 69, 0.4)")
    .style("border", "2px solid rgba(220, 53, 69, 0.9)")
    .style("transform-style", "preserve-3d")
    .style("backface-visibility", "visible");

  // Add grid pattern
  const gridPattern = tangentPlane
    .append("div")
    .style("position", "absolute")
    .style("width", "100%")
    .style("height", "100%")
    .style(
      "background-image",
      `
      linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
    `
    )
    .style("background-size", "20px 20px")
    .style("pointer-events", "none");

  // Create point of tangency
  const tangencyPoint = tangentGroup
    .append("div")
    .style("position", "absolute")
    .style("width", "10px")
    .style("height", "10px")
    .style("border-radius", "50%")
    .style("background", "#1a1a1a")
    .style("left", "-5px")
    .style("top", "-5px")
    .style(
      "box-shadow",
      "0 0 10px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.5)"
    )
    .style("z-index", "10")
    .style("border", "2px solid rgba(255,255,255,0.6)");

  // Create fixed sphere AFTER tangent plane (so it renders on top)
  const sphere = sceneGroup
    .append("div")
    .style("position", "absolute")
    .style("width", "200px")
    .style("height", "200px")
    .style("border-radius", "50%")
    .style("left", "50px")
    .style("top", "50px")
    .style(
      "background",
      `radial-gradient(circle at 30% 30%, 
      #6aa3d5 0%, 
      #4a8bc2 30%, 
rgb(50, 107, 160) 60%, 
rgb(31, 73, 110) 100%)`
    )
    .style(
      "box-shadow",
      `
      inset -20px -20px 50px rgba(0,0,0,0.5),
      inset 20px 20px 30px rgba(255,255,255,0.2),
      20px 20px 40px rgba(0,0,0,0.3)`
    )
    .style("transform-style", "preserve-3d")
    .style("overflow", "hidden");

  // Create shadow container on sphere surface
  const sphereShadow = sphere
    .append("div")
    .style("position", "absolute")
    .style("width", "100%")
    .style("height", "100%")
    .style("border-radius", "50%")
    .style("overflow", "hidden")
    .style("pointer-events", "none");

  // Create the grid shadow element
  const gridShadow = sphereShadow
    .append("div")
    .style("position", "absolute")
    .style("width", "120px")
    .style("height", "120px")
    .style("background", "rgba(0, 0, 0, 0.3)")
    .style("border-radius", "8px")
    .style("filter", "blur(8px)")
    .style("transform-origin", "center center");

  // Add instructions
  const instructions = visualContainer
    .append("div")
    .style("position", "absolute")
    .style("bottom", "20px")
    .style("left", "50%")
    .style("transform", "translateX(-50%)")
    .style("color", "#999")
    .style("font-size", "14px")
    .style("text-align", "center")
    .style("z-index", "10")
    .style("font-family", "system-ui, -apple-system, sans-serif");

  instructions.append("span").text("click & drag");

  instructions
    .append("span")
    .style("margin", "0 15px")
    .style("font-size", "18px")
    .text("↶");

  instructions
    .append("span")
    .style("margin", "0 15px")
    .style("font-size", "18px")
    .text("↷");

  // Calculate position and orientation from spherical coordinates
  function updateTangentPlane() {
    // Allow full rotation - no constraints on phi
    phi = phi % (2 * Math.PI);
    if (phi < 0) phi += 2 * Math.PI;

    // Calculate point on sphere surface
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
    const z = sphereRadius * Math.cos(phi);

    // To orient the tangent plane:
    // The plane starts in XY plane with normal pointing in +Z direction
    // We need to rotate it so the normal points radially outward at (theta, phi)

    // Rotation sequence (applied right-to-left):
    // 1. rotateZ(theta) - rotate around Z axis by azimuthal angle
    // 2. rotateY(90° - phi) - rotate around Y axis to tilt from vertical
    // 3. Add 90° to rotateY to correct the grid orientation

    const rotateZ = theta * (180 / Math.PI);
    const rotateY = phi * (180 / Math.PI);
    const rotateX = 0; // Add 90-degree rotation around X-axis to correct plane orientation

    // Hide the tangent plane when it's behind the sphere (z < -20)
    // Use a smooth transition zone
    const planeOpacity = 1; //z < -20 ? 0 : z < 0 ? (z + 20) / 20 : 1;

    tangentGroup
      .style(
        "transform",
        `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) rotateY(${rotateY}deg)`
      )
      .style("opacity", planeOpacity);

    // Update shadow position on sphere surface
    // Project the 3D point onto the 2D sphere surface (front face)
    // The sphere's center is at (100, 100) in its local coordinate system
    const sphereCenterX = 100;
    const sphereCenterY = 100;

    // Calculate the 2D projection accounting for the sphere's curvature
    // We need to map the 3D position to where it appears on the 2D circle
    const angle2D = Math.atan2(y, x);
    const distance2D = Math.sqrt(x * x + y * y);

    // Project onto the visible circle
    const shadowX = sphereCenterX + distance2D * Math.cos(angle2D) - 60;
    const shadowY = sphereCenterY + distance2D * Math.sin(angle2D) - 60;

    // Calculate opacity based on z-position (fade when behind sphere)
    const shadowOpacity = z > -50 ? 0.3 * (1 - Math.abs(z) / sphereRadius) : 0;

    // Scale the shadow based on distance from camera
    const shadowScale = 1 - Math.abs(z) / (sphereRadius * 2);

    gridShadow
      .style("left", `${shadowX}px`)
      .style("top", `${shadowY}px`)
      .style("opacity", shadowOpacity)
      .style("transform", `rotate(${rotateZ}deg) scale(${shadowScale})`);
  }

  // Mouse interaction handlers
  function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
    sceneContainer.style("cursor", "grabbing");
  }

  function onMouseUp() {
    isMouseDown = false;
    sceneContainer.style("cursor", "grab");
  }

  function onMouseMove(event) {
    if (isMouseDown) {
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Update spherical coordinates
      // Map horizontal mouse movement to theta (azimuthal) and vertical to phi (polar)
      theta += deltaX * 0.01;
      phi -= deltaY * 0.01;

      updateTangentPlane();

      mouseX = event.clientX;
      mouseY = event.clientY;
    }
  }

  // Add event listeners
  sceneContainer
    .on("mousedown", onMouseDown)
    .on("mouseup", onMouseUp)
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseUp)
    .style("cursor", "grab");

  // Add title
  visualContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "20px")
    .style("left", "20px")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .style("color", "#333")
    .style("z-index", "10")
    .style("font-family", "system-ui, -apple-system, sans-serif")
    .text("Tangent Space Visualization");

  // Initialize
  updateTangentPlane();

  return visualContainer;
}
