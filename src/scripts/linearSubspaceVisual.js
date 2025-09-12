import * as d3 from "d3";
export function createLinearSubspaceVisual(containerId) {
  const container = d3.select(`#${containerId}`);

  // Clear any existing content
  container.selectAll("*").remove();

  // Set up dimensions
  const width = 600;
  const height = 400;

  // Create main container
  const mainContainer = container
    .append("div")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("position", "relative")
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
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  sceneContainer.node().appendChild(renderer.domElement);

  // Set camera position
  camera.position.set(5, 3, 5);
  camera.lookAt(0, 0, 0);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Create flat plane (linear subspace)
  const planeGeometry = new THREE.PlaneGeometry(3, 3, 20, 20);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x007bff,
    transparent: true,
    opacity: 0.4,
    wireframe: false,
  });
  const flatPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  flatPlane.rotation.x = -Math.PI / 6; // Slight tilt to show it's 3D
  flatPlane.position.x = -4; // Position farther to the left
  scene.add(flatPlane);

  // Create curved surface (parabolic surface)
  const curvedGeometry = new THREE.PlaneGeometry(3, 3, 20, 20);
  const curvedMaterial = new THREE.MeshLambertMaterial({
    color: 0xdc3545,
    transparent: true,
    opacity: 0.4,
    wireframe: false,
  });
  const curvedSurface = new THREE.Mesh(curvedGeometry, curvedMaterial);
  curvedSurface.rotation.x = -Math.PI / 6;
  curvedSurface.position.x = 4; // Position farther to the right

  // Apply stronger curvature to the surface
  const positions = curvedSurface.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    // Apply stronger parabolic curvature: z = 0.5 * (x^2 + y^2)
    const newZ = 0.5 * (x * x + y * y);
    positions.setZ(i, newZ);
  }
  positions.needsUpdate = true;

  scene.add(curvedSurface);

  // Create interactive points
  const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);

  // Flat plane point
  const flatPointMaterial = new THREE.MeshLambertMaterial({
    color: 0x007bff,
  });
  const flatPoint = new THREE.Mesh(pointGeometry, flatPointMaterial);
  scene.add(flatPoint);

  // Curved surface point
  const curvedPointMaterial = new THREE.MeshLambertMaterial({
    color: 0xdc3545,
  });
  const curvedPoint = new THREE.Mesh(pointGeometry, curvedPointMaterial);
  scene.add(curvedPoint);

  // Create single parameter control
  const controlContainer = mainContainer
    .append("div")
    .style("position", "absolute")
    .style("bottom", "10px")
    .style("left", "10px")
    .style("right", "10px")
    .style("height", "60px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border-radius", "4px")
    .style("padding", "10px")
    .style("text-align", "center");

  controlContainer
    .append("div")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("color", "#333")
    .style("margin-bottom", "8px")
    .text("Move Points Along X-Axis");

  const sliderContainer = controlContainer
    .append("div")
    .style("position", "relative")
    .style("display", "inline-block")
    .style("width", "80%")
    .style("margin-bottom", "5px");

  const slider = sliderContainer
    .append("input")
    .attr("type", "range")
    .attr("min", "-2")
    .attr("max", "2")
    .attr("step", "0.1")
    .attr("value", "0")
    .style("width", "100%")
    .style("height", "20px")
    .style("background", "transparent")
    .style("outline", "none")
    .style("cursor", "pointer")
    .style("appearance", "none")
    .style("-webkit-appearance", "none");

  // Style the slider track
  slider.style("background", "linear-gradient(to right, #ccc 0%, #ccc 100%)");
  slider.style("border-radius", "10px");

  // Add custom CSS for the slider thumb
  const style = document.createElement("style");
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #dc3545;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #dc3545;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);

  // Add mouse icon that follows the slider thumb
  const mouseIcon = sliderContainer
    .append("img")
    .attr("src", "assets/images/click-me.png")
    .style("position", "absolute")
    .style("top", "45%")
    .style("left", "50%")
    .style("transform", "translate(-35%, -50%)")
    .style("width", "12px")
    .style("height", "12px")
    .style("pointer-events", "none")
    .style("z-index", "10");

  // Function to update mouse icon position based on slider value
  function updateMouseIconPosition(value) {
    const min = -2;
    const max = 2;
    const range = max - min;
    const percentage = (value - min) / range;

    // Calculate the exact position accounting for thumb width
    const thumbWidth = 20; // Same as CSS thumb width
    const sliderWidth = sliderContainer.node().offsetWidth;
    const thumbOffset = (thumbWidth / 2 / sliderWidth) * 100;

    const leftPosition = percentage * (100 - thumbOffset * 2) + thumbOffset;
    mouseIcon.style("left", `${leftPosition}%`);
  }

  controlContainer
    .append("div")
    .style("font-size", "12px")
    .style("color", "#666")
    .text("x = 0.0");

  // Add labels
  const labelsContainer = mainContainer
    .append("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px")
    .style("right", "10px")
    .style("display", "flex")
    .style("justify-content", "space-between");

  labelsContainer
    .append("div")
    .style("background", "rgba(0, 123, 255, 0.1)")
    .style("color", "#007bff")
    .style("padding", "5px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Flat Plane: z = 0");

  labelsContainer
    .append("div")
    .style("background", "rgba(220, 53, 69, 0.1)")
    .style("color", "#dc3545")
    .style("padding", "5px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Curved: z = 0.5(x² + y²)");

  // Update function for both points
  function updateBothPoints(x) {
    const y = 0; // Keep y constant for simplicity

    // Update flat point
    const flatZ = 0; // Flat plane has z = 0
    flatPoint.position.set(x - 4, y, flatZ); // Offset by -4 to match surface position

    // Update curved point
    const curvedZ = 0.5 * (x * x + y * y); // Updated curved surface equation
    curvedPoint.position.set(x + 4, y, curvedZ); // Offset by 4 to match surface position

    // Update display
    controlContainer.select("div:last-child").text(`x = ${x.toFixed(1)}`);
  }

  // Event listener for single slider
  slider.on("input", function () {
    const x = parseFloat(this.value);
    updateBothPoints(x);
    updateMouseIconPosition(x);
  });

  // Initialize positions
  updateBothPoints(0);
  updateMouseIconPosition(0);

  // Fixed camera position - no rotation
  camera.position.set(6, 4, 6);
  camera.lookAt(1, 0, 0);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
