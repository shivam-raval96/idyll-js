/**
 * D3.js Floating Curved Grid Banner
 * Creates an animated curved grid surface that floats and moves
 */

import * as d3 from "d3";

/**
 * 3D Manifold Visualization
 * Creates an interactive 3D wireframe landscape with data points
 * Replacement for the D3.js floating curved grid banner
 */

export function createManifoldVisualization(containerId) {
  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  // Check if Three.js is available
  if (typeof THREE === "undefined") {
    console.error("Three.js is required for this visualization");
    // Try to load Three.js
    loadThreeJS()
      .then(() => {
        initVisualization();
      })
      .catch((error) => {
        console.error("Failed to load Three.js:", error);
        showError("Failed to load 3D engine");
      });
    return;
  }

  initVisualization();

  async function loadThreeJS() {
    return new Promise((resolve, reject) => {
      // Check if already loading or loaded
      if (window.threeJSLoading) {
        // Wait for existing load
        const checkInterval = setInterval(() => {
          if (typeof THREE !== "undefined") {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      window.threeJSLoading = true;

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = () => {
        window.threeJSLoading = false;
        resolve();
      };
      script.onerror = () => {
        window.threeJSLoading = false;
        reject(new Error("Failed to load Three.js"));
      };
      document.head.appendChild(script);
    });
  }

  function showError(message) {
    container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #013d4f;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
        ">
          ${message}
        </div>
      `;
  }

  function initVisualization() {
    // Clear container and set up structure
    container.innerHTML = "";

    // Set up container styles
    container.style.cssText = `
        position: relative;
        width: 70%;
        height: 60vh;
        min-height: 400px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 8px;
        overflow: hidden;
        margin: 2rem 0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
      `;

    // Create info overlay
    const infoOverlay = document.createElement("div");
    infoOverlay.innerHTML = `
        <div class="title">A low dimensional manifold</div>
        <div class="instructions">LLM activations live on curved surfaces like this surface.</div>
        <div class="status">Interactive 3D Visualization</div>
      `;
    infoOverlay.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        color: #013d4f;
        font-size: 14px;
        z-index: 100;
        background: rgba(255, 255, 255, 0.9);
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #ee627a;
      `;

    // Style the overlay content
    const title = infoOverlay.querySelector(".title");
    title.style.cssText = `
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 5px;
        color: #013d4f;
      `;

    const instructions = infoOverlay.querySelector(".instructions");
    instructions.style.cssText = `
        font-size: 12px;
        color: #666;
        font-weight: 400;
        margin-bottom: 3px;
      `;

    const status = infoOverlay.querySelector(".status");
    status.style.cssText = `
        font-size: 10px;
        color: #28a745;
        font-weight: 500;
        font-style: italic;
      `;

    container.appendChild(infoOverlay);

    // Create visual container
    const visualContainer = document.createElement("div");
    visualContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
      `;
    container.appendChild(visualContainer);

    // Initialize 3D scene
    init3DScene(visualContainer);
  }

  function init3DScene(visualContainer) {
    let scene, camera, renderer, wireframe;
    let mouseX = 0,
      mouseY = 0;
    let targetRotationX = 0,
      targetRotationY = 0;
    let currentRotationX = 0,
      currentRotationY = 0;
    let isMouseDown = false;
    let points = [];
    let raycaster, mouse, tooltip;
    let animationId;
    let geometry, vertices;
    const gridSize = 50;
    const spacing = 0.5;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      visualContainer.clientWidth / visualContainer.clientHeight,
      0.1,
      1000
    );
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(visualContainer.clientWidth, visualContainer.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    visualContainer.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Create the landscape
    createLandscape();
    createSurfacePoints();

    // Camera position
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Setup raycaster for tooltips
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();

    function createLandscape() {
      geometry = new THREE.PlaneGeometry(
        gridSize * spacing,
        gridSize * spacing,
        gridSize - 1,
        gridSize - 1
      );

      // Modify vertices to create waves and peaks
      vertices = geometry.attributes.position.array;

      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 1];

        // Create multiple wave patterns for interesting terrain
        const wave1 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 3;
        const wave2 = Math.sin(x * 0.15 + z * 0.15) * 2;
        const wave3 = Math.cos(x * 0.6) * Math.sin(z * 0.4) * 1.5;
        const noise = (Math.random() - 0.5) * 0.5;

        vertices[i + 2] = wave1 + wave2 + wave3 + noise;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      // Create wireframe material
      const material = new THREE.MeshBasicMaterial({
        color: 0x013d4f,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });

      wireframe = new THREE.Mesh(geometry, material);
      wireframe.rotation.x = -Math.PI / 2;
      scene.add(wireframe);
    }

    function createSurfacePoints() {
      const positionArray = geometry.attributes.position.array;
      const totalVertices = positionArray.length / 3;

      // Calculate the grid dimensions
      const gridWidth = gridSize;
      const gridHeight = gridSize;

      // Analyze heights to find peaks and valleys
      const vertexHeights = [];
      for (let i = 0; i < totalVertices; i++) {
        const vertexOffset = i * 3;
        const height = positionArray[vertexOffset + 2];
        vertexHeights.push({ index: i, height: height });
      }

      // Sort by height to find peaks and valleys
      const sortedHeights = [...vertexHeights].sort(
        (a, b) => a.height - b.height
      );
      const minHeight = sortedHeights[0].height;
      const maxHeight = sortedHeights[sortedHeights.length - 1].height;
      const heightRange = maxHeight - minHeight;

      // Define peak and valley thresholds
      const peakThreshold = maxHeight - heightRange * 0.15;
      const valleyThreshold = minHeight + heightRange * 0.15;

      // Find peak and valley vertices
      const peakVertices = vertexHeights.filter(
        (v) => v.height >= peakThreshold
      );
      const valleyVertices = vertexHeights.filter(
        (v) => v.height <= valleyThreshold
      );
      const otherVertices = vertexHeights.filter(
        (v) => v.height > valleyThreshold && v.height < peakThreshold
      );

      // Create a set to track which vertices we've used
      const usedVertices = new Set();

      // Create 100 points with strategic distribution
      for (let i = 0; i < 100; i++) {
        let vertexIndex;
        let attempts = 0;

        do {
          // Strategic point placement
          if (i < 40) {
            // 40% of points clustered around peaks
            const randomPeak =
              peakVertices[Math.floor(Math.random() * peakVertices.length)];
            const gridX = randomPeak.index % gridWidth;
            const gridY = Math.floor(randomPeak.index / gridWidth);
            const offsetX = Math.floor((Math.random() - 0.5) * 6);
            const offsetY = Math.floor((Math.random() - 0.5) * 6);
            const newX = Math.max(0, Math.min(gridWidth - 1, gridX + offsetX));
            const newY = Math.max(0, Math.min(gridHeight - 1, gridY + offsetY));
            vertexIndex = newY * gridWidth + newX;
          } else if (i < 70) {
            // 30% of points clustered around valleys
            const randomValley =
              valleyVertices[Math.floor(Math.random() * valleyVertices.length)];
            const gridX = randomValley.index % gridWidth;
            const gridY = Math.floor(randomValley.index / gridWidth);
            const offsetX = Math.floor((Math.random() - 0.5) * 6);
            const offsetY = Math.floor((Math.random() - 0.5) * 6);
            const newX = Math.max(0, Math.min(gridWidth - 1, gridX + offsetX));
            const newY = Math.max(0, Math.min(gridHeight - 1, gridY + offsetY));
            vertexIndex = newY * gridWidth + newX;
          } else {
            // 30% of points spread out in other areas
            const randomOther =
              otherVertices[Math.floor(Math.random() * otherVertices.length)];
            vertexIndex = randomOther.index;
          }

          vertexIndex = Math.max(0, Math.min(totalVertices - 1, vertexIndex));
          attempts++;
        } while (usedVertices.has(vertexIndex) && attempts < 20);

        if (attempts >= 20) {
          vertexIndex = Math.floor(Math.random() * totalVertices);
        }

        usedVertices.add(vertexIndex);

        // Get the actual vertex position from the mesh
        const vertexOffset = vertexIndex * 3;
        const x = positionArray[vertexOffset];
        const y = positionArray[vertexOffset + 1];
        const z = positionArray[vertexOffset + 2];

        // Create point geometry
        const pointGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const pointMaterial = new THREE.MeshBasicMaterial({
          color: 0xee627a,
          transparent: true,
          opacity: 0.9,
        });

        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(x, y, z);

        // Store point data for tooltips
        point.userData = {
          id: points.length,
          x: x.toFixed(2),
          z: y.toFixed(2),
          height: z.toFixed(2),
          vertexIndex: vertexIndex,
        };

        points.push(point);
        wireframe.add(point);
      }
    }

    function setupEventListeners() {
      // Mouse controls
      renderer.domElement.addEventListener("mousedown", onMouseDown);
      renderer.domElement.addEventListener("mousemove", onMouseMove);
      renderer.domElement.addEventListener("mouseup", onMouseUp);
      renderer.domElement.addEventListener("mousemove", onMouseMoveForTooltip);

      // Touch controls
      renderer.domElement.addEventListener("touchstart", onTouchStart);
      renderer.domElement.addEventListener("touchmove", onTouchMove);
      renderer.domElement.addEventListener("touchend", onTouchEnd);

      // Window resize
      window.addEventListener("resize", onWindowResize);
    }

    function onMouseMoveForTooltip(event) {
      const rect = visualContainer.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(points);

      if (intersects.length > 0) {
        showTooltip(intersects[0].object, event.clientX, event.clientY);
      } else {
        hideTooltip();
      }
    }

    function showTooltip(point, mouseX, mouseY) {
      hideTooltip();

      tooltip = document.createElement("div");
      tooltip.style.cssText = `
          position: absolute;
          z-index: 1000;
          pointer-events: none;
          background: rgba(1, 61, 79, 0.95);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          border-left: 4px solid #ee627a;
          min-width: 180px;
          backdrop-filter: blur(10px);
        `;

      tooltip.innerHTML = `
          <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); font-size: 14px; color: #ee627a; font-weight: bold;">
            Data Point ${point.userData.id + 1}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">X Position:</span>
              <span style="color: white; font-weight: 600; font-size: 12px; font-family: 'Courier New', monospace;">${
                point.userData.x
              }</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">Z Position:</span>
              <span style="color: white; font-weight: 600; font-size: 12px; font-family: 'Courier New', monospace;">${
                point.userData.z
              }</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">Height:</span>
              <span style="color: white; font-weight: 600; font-size: 12px; font-family: 'Courier New', monospace;">${
                point.userData.height
              }</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">Vertex:</span>
              <span style="color: white; font-weight: 600; font-size: 12px; font-family: 'Courier New', monospace;">#${
                point.userData.vertexIndex
              }</span>
            </div>
          </div>
        `;

      const tooltipWidth = 200;
      const tooltipHeight = 140;

      let left = mouseX + 15;
      let top = mouseY - tooltipHeight - 10;

      if (left + tooltipWidth > window.innerWidth) {
        left = mouseX - tooltipWidth - 15;
      }
      if (top < 0) {
        top = mouseY + 15;
      }

      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";

      document.body.appendChild(tooltip);
    }

    function hideTooltip() {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    }

    function onMouseDown(event) {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    }

    function onMouseMove(event) {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        targetRotationX = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, targetRotationX)
        );

        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    }

    function onMouseUp() {
      isMouseDown = false;
    }

    function onTouchStart(event) {
      if (event.touches.length === 1) {
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
        isMouseDown = true;
      }
    }

    function onTouchMove(event) {
      if (event.touches.length === 1 && isMouseDown) {
        const deltaX = event.touches[0].clientX - mouseX;
        const deltaY = event.touches[0].clientY - mouseY;

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        targetRotationX = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, targetRotationX)
        );

        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      }
    }

    function onTouchEnd() {
      isMouseDown = false;
    }

    function onWindowResize() {
      if (visualContainer && camera && renderer) {
        camera.aspect =
          visualContainer.clientWidth / visualContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          visualContainer.clientWidth,
          visualContainer.clientHeight
        );
      }
    }

    function animate() {
      animationId = requestAnimationFrame(animate);

      // Smooth rotation interpolation
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      // Apply rotations to the scene
      wireframe.rotation.z = currentRotationY;
      wireframe.rotation.x = -Math.PI / 2 + currentRotationX;

      // Subtle camera movement
      const time = Date.now() * 0.0005;
      camera.position.y = 8 + Math.sin(time) * 1;

      renderer.render(scene, camera);
    }

    // Cleanup function
    return function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
      hideTooltip();
    };
  }
}
