/**
 * Interactive 3D Scatterplot for Manifold Hypothesis
 * Shows 100 points representing 28x28 images with hover interactions
 */

import * as d3 from "d3";
import manifoldData from "../data/manifoldData.json";

export function createManifoldScatterplot(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // Set up dimensions
  const width = 400;
  const height = 400;

  // Create main container
  const mainContainer = d3
    .select(container)
    .append("div")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("position", "relative")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("background", "#fafafa");

  // Initialize Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio); // Add this line!
  renderer.domElement.style.cursor = "grab";
  mainContainer.node().appendChild(renderer.domElement);

  // Set camera position - using same radius as rotation controls
  // Account for the 90-degree Z rotation of the figure
  const radius = 12;
  const initialRotationX = 0;
  const initialRotationY = 0; // Start from front view since figure is rotated
  camera.position.set(
    radius * Math.cos(initialRotationY) * Math.cos(initialRotationX),
    radius * Math.sin(initialRotationX),
    radius * Math.sin(initialRotationY) * Math.cos(initialRotationX)
  );
  camera.lookAt(0, 0, 0);

  // Add consistent lighting for smooth appearance
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  // Add additional light for even illumination
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight2.position.set(-8, 8, -8);
  scene.add(directionalLight2);

  // Use imported data
  const data = manifoldData;

  // Create a group to hold all points and rotate the entire figure
  const pointsGroup = new THREE.Group();
  pointsGroup.rotation.z = Math.PI / 2; // 90 degrees rotation around Z-axis
  pointsGroup.rotation.y = Math.PI / 4; // 45 degrees rotation around Y-axis
  scene.add(pointsGroup);

  // Create point geometries with maximum resolution for perfectly smooth appearance
  const pointGeometry = new THREE.SphereGeometry(0.1, 64, 64);
  const points = [];

  data.forEach((point, index) => {
    const pointMaterial = new THREE.MeshLambertMaterial({
      color: 0x20b2aa, // Teal color for all points
    });

    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.position.set(point.x, point.y, point.z);
    pointMesh.userData = {
      id: point.id,
      image: point.image,
      originalData: point,
    };

    pointsGroup.add(pointMesh);
    points.push(pointMesh);
  });

  // Create image display container
  const imageContainer = mainContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("width", "120px")
    .style("height", "120px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "2px solid #333")
    .style("border-radius", "4px")
    .style("display", "none")
    .style("z-index", "10");

  const imageDisplay = imageContainer
    .append("img")
    .style("width", "100%")
    .style("height", "100%")
    .style("object-fit", "contain");

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
    .text("3D Manifold Points");

  // Add instructions
  mainContainer
    .append("div")
    .style("position", "absolute")
    .style("bottom", "10px")
    .style("left", "10px")
    .style("font-size", "12px")
    .style("color", "#666")
    .style("z-index", "10")
    .text(
      "Hover over points to see images • Click and drag horizontally to rotate"
    );

  // Mouse interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredPoint = null;

  function onMouseMove(event) {
    // Only handle hover when not dragging
    if (!isMouseDown) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(points);

      if (intersects.length > 0) {
        const point = intersects[0].object;

        if (hoveredPoint !== point) {
          // Reset previous hover
          if (hoveredPoint) {
            hoveredPoint.material.emissive.setHex(0x000000);
          }

          // Highlight new point
          point.material.emissive.setHex(0x444444);
          hoveredPoint = point;

          // Show image
          imageDisplay.attr("src", point.userData.image);
          imageContainer.style("display", "block");
        }
      } else {
        if (hoveredPoint) {
          hoveredPoint.material.emissive.setHex(0x000000);
          hoveredPoint = null;
          imageContainer.style("display", "none");
        }
      }
    }
  }

  // Rotation controls
  let isMouseDown = false;
  let mouseX = 0,
    mouseY = 0;
  // Initialize rotation angles to match the initial camera position
  let rotationX = 0; // Camera starts at y=0, which corresponds to rotationX=0
  let rotationY = 0; // Camera starts at x=radius, which corresponds to rotationY=0

  function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
    renderer.domElement.style.cursor = "grabbing";
  }

  function onMouseUp() {
    isMouseDown = false;
    renderer.domElement.style.cursor = "grab";
  }

  function onMouseMoveRotate(event) {
    if (isMouseDown) {
      const deltaX = event.clientX - mouseX;
      // Only use horizontal mouse movement for rotation
      // const deltaY = event.clientY - mouseY; // Disabled vertical rotation

      rotationY += deltaX * 0.01;
      // rotationX += deltaY * 0.01; // Disabled vertical rotation
      rotationX = 0; // Keep vertical rotation fixed

      // Rotate the camera around the scene (horizontal only)
      camera.position.x = radius * Math.cos(rotationY) * Math.cos(rotationX);
      camera.position.y = radius * Math.sin(rotationX);
      camera.position.z = radius * Math.sin(rotationY) * Math.cos(rotationX);
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    }
  }

  // Add event listeners
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mousemove", onMouseMoveRotate);
  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mouseup", onMouseUp);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
