/**
 * Interactive Circle Manifold Visualization
 * Shows the mapping between 1D parameter space and 2D circle
 */

import * as d3 from "d3";

export function createCircleManifoldVisual(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Set up dimensions
  const width = 400;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  // Create SVG
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#f8f9fa")
    .style("border-radius", "8px")
    .style("border", "1px solid #e9ecef");

  // Create groups for circle and line
  const circleGroup = svg.append("g").attr("class", "circle-group");
  const lineGroup = svg.append("g").attr("class", "line-group");
  const connectionGroup = svg.append("g").attr("class", "connection-group");

  // Circle parameters
  const circleRadius = 60;
  const circleCenterX = width / 2;
  const circleCenterY = 80;

  // Line parameters
  const lineY = 220;
  const lineStartX = 50;
  const lineEndX = width - 50;
  const lineLength = lineEndX - lineStartX;

  // Current angle (in radians)
  let currentAngle = 0;
  let targetAngle = 0;
  let animationId = null;

  // Draw the circle
  circleGroup
    .append("circle")
    .attr("cx", circleCenterX)
    .attr("cy", circleCenterY)
    .attr("r", circleRadius)
    .attr("fill", "none")
    .attr("stroke", "#6c757d")
    .attr("stroke-width", 2);

  // Draw the 1D line
  lineGroup
    .append("line")
    .attr("x1", lineStartX)
    .attr("y1", lineY)
    .attr("x2", lineEndX)
    .attr("y2", lineY)
    .attr("stroke", "#6c757d")
    .attr("stroke-width", 2);

  // Add tick marks on the line
  const numTicks = 8;
  for (let i = 0; i <= numTicks; i++) {
    const x = lineStartX + (i / numTicks) * lineLength;
    lineGroup
      .append("line")
      .attr("x1", x)
      .attr("y1", lineY - 10)
      .attr("x2", x)
      .attr("y2", lineY + 10)
      .attr("stroke", "#6c757d")
      .attr("stroke-width", 1);

    // Add labels
    if (i % 2 === 0) {
      lineGroup
        .append("text")
        .attr("x", x)
        .attr("y", lineY + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#6c757d")
        .text(`${((i / numTicks) * 2 * Math.PI).toFixed(1)}`);
    }
  }

  // Create the moving point on the circle
  const circlePoint = circleGroup
    .append("circle")
    .attr("r", 6)
    .attr("fill", "#dc3545")
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // Create the moving point on the line
  const linePoint = lineGroup
    .append("circle")
    .attr("r", 12)
    .attr("fill", "#dc3545")
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // Create connection line
  const connectionLine = connectionGroup
    .append("line")
    .attr("stroke", "#007bff")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .attr("opacity", 0);

  // Smooth animation function
  function animateToTarget() {
    if (Math.abs(currentAngle - targetAngle) < 0.001) {
      currentAngle = targetAngle;
      animationId = null;
      return;
    }

    // Smooth interpolation
    const lerpFactor = 0.2;
    currentAngle += (targetAngle - currentAngle) * lerpFactor;

    updatePositions(currentAngle);

    animationId = requestAnimationFrame(animateToTarget);
  }

  // Update positions based on angle
  function updatePositions(angle) {
    // Circle position (start from top, go clockwise)
    const circleX =
      circleCenterX + circleRadius * Math.cos(angle - Math.PI / 2);
    const circleY =
      circleCenterY + circleRadius * Math.sin(angle - Math.PI / 2);

    // Line position (map angle to line position)
    const normalizedAngle = angle / (2 * Math.PI);
    const lineX = lineStartX + normalizedAngle * lineLength;

    // Update circle point
    circlePoint.attr("cx", circleX).attr("cy", circleY);

    // Update line point
    linePoint.attr("cx", lineX).attr("cy", lineY);

    // Update mouse icon position (move with the point)
    mouseIcon.attr("x", lineX - 8).attr("y", lineY - 8);

    // Update connection line
    connectionLine
      .attr("x1", circleX)
      .attr("y1", circleY)
      .attr("x2", lineX)
      .attr("y2", lineY);
  }

  // Set target angle and start animation
  function setTargetAngle(angle) {
    targetAngle = angle;

    if (!animationId) {
      animationId = requestAnimationFrame(animateToTarget);
    }
  }

  // Add labels
  svg
    .append("text")
    .attr("x", circleCenterX)
    .attr("y", circleCenterY - circleRadius - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#495057")
    .text("2D Circle (Manifold)");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", lineY + 50)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#495057")
    .text("1D Parameter Space (θ)");

  // Add clickable mouse icon inside the point
  const mouseIconGroup = svg.append("g").attr("class", "mouse-icon");

  // Mouse cursor icon (positioned inside the point)
  const mouseIcon = mouseIconGroup
    .append("image")
    .attr("href", "assets/images/click-me.png")
    .attr("x", lineStartX - 8)
    .attr("y", lineY - 8)
    .attr("width", 16)
    .attr("height", 16);

  // Add interactive area only for the line
  const lineArea = lineGroup
    .append("rect")
    .attr("x", lineStartX - 10)
    .attr("y", lineY - 10)
    .attr("width", lineLength + 20)
    .attr("height", 20)
    .attr("fill", "transparent")
    .attr("stroke", "none")
    .style("cursor", "pointer");

  // Line interaction (only interactive element)
  lineArea.on("mousemove", function (event) {
    const [mouseX] = d3.pointer(event, this);
    const relativeX = mouseX - lineStartX;
    const normalizedX = Math.max(0, Math.min(1, relativeX / lineLength));
    const angle = normalizedX * 2 * Math.PI;
    setTargetAngle(angle);
  });

  // Initialize with angle 0
  updatePositions(0);

  return svg;
}
