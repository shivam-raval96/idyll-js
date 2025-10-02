/**
 * 3D Manifold Visualization with Geodesic Path
 * Creates an interactive 3D wireframe landscape with data points
 * and a geodesic line connecting two points with tooltips
 */

export function createManifoldVisualization(containerId, config = {}) {
  // Default configuration
  const defaultConfig = {
    startPoint: { x: -4, y: 9, z: null }, // z will be calculated from surface
    endPoint: { x: -4, y: -8.8, z: null },
    tooltipTexts: [
      "Response: This is a test",
      "Response: This is a test",
      "Response: This is a test",
      "Response: This is a test",
    ],
  };

  const settings = { ...defaultConfig, ...config };

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

    // Declare redoButton here
    let redoButton;

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

    // Initialize 3D scene first
    const sceneControls = init3DScene(visualContainer);

    // Create redo button after scene is initialized
    redoButton = document.createElement("button");
    redoButton.textContent = "↻ Redo";
    redoButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 100;
        background: rgba(255, 165, 0, 0.9);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s;
      `;

    redoButton.onmouseover = function () {
      this.style.background = "rgba(255, 165, 0, 1)";
      this.style.transform = "scale(1.05)";
    };

    redoButton.onmouseout = function () {
      this.style.background = "rgba(255, 165, 0, 0.9)";
      this.style.transform = "scale(1)";
    };

    redoButton.onclick = function () {
      if (sceneControls && sceneControls.restart) {
        sceneControls.restart();
      }
    };

    container.appendChild(redoButton);
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
    let geodesicLine,
      geodesicMarkers = [];
    let pathTooltipElements = [];
    let isHoveringDataPoint = false;
    let animationProgress = 0;
    let isAnimating = true;
    let animationComplete = false;
    let pathPoints = [];
    // Remove redoButton from here since it's now in initVisualization scope

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
    createGeodesicPath();
    createPathTooltips();

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
          isDataPoint: true,
        };

        points.push(point);
        wireframe.add(point);
      }
    }

    function createGeodesicPath() {
      // Use configured start and end points
      const startX = settings.startPoint.x;
      const startY = settings.startPoint.y;
      const startZ =
        settings.startPoint.z !== null
          ? settings.startPoint.z
          : sampleSurfaceHeight(startX, startY);

      const endX = settings.endPoint.x;
      const endY = settings.endPoint.y;
      const endZ =
        settings.endPoint.z !== null
          ? settings.endPoint.z
          : sampleSurfaceHeight(endX, endY);

      const start = new THREE.Vector3(startX, startY, startZ);
      const end = new THREE.Vector3(endX, endY, endZ);

      // Create endpoint markers
      const startPointGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const startPointMaterial = new THREE.MeshBasicMaterial({
        color: 0x893101,
        transparent: true,
        opacity: 0.9,
      });

      const startMarker = new THREE.Mesh(
        startPointGeometry,
        startPointMaterial
      );
      startMarker.position.copy(start);
      startMarker.userData = { isPathEndpoint: true };
      wireframe.add(startMarker);

      const endPointGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const endPointMaterial = new THREE.MeshBasicMaterial({
        color: 0x893101,
        transparent: true,
        opacity: 0,
      });
      const endMarker = new THREE.Mesh(endPointGeometry, endPointMaterial);
      endMarker.position.copy(end);
      endMarker.userData = { isPathEndpoint: true, isEndMarker: true };
      wireframe.add(endMarker);

      // Create a path along the surface
      pathPoints = [];
      const numSegments = 50;

      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;

        // Linear interpolation in XY plane
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;

        // Sample the height from the surface
        const z = sampleSurfaceHeight(x, y);

        pathPoints.push(new THREE.Vector3(x, y, z));
      }

      // Create the line as a tube - initially empty
      const curve = new THREE.CatmullRomCurve3([pathPoints[0], pathPoints[0]]);
      const tubeGeometry = new THREE.TubeGeometry(curve, 2, 0.08, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.8,
      });

      geodesicLine = new THREE.Mesh(tubeGeometry, tubeMaterial);
      wireframe.add(geodesicLine);
      const positions = [0.05, 0.3, 0.7, 1];
      // Create 4 tooltip markers along the path (initially hidden)
      for (let i = 0; i < 4; i++) {
        const t = positions[i]; // Positions at 0.2, 0.4, 0.6, 0.8
        const index = Math.floor(t * (pathPoints.length - 1));
        const position = pathPoints[index];

        // Create marker
        const markerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0xffa500,
          transparent: true,
          opacity: 0,
        });

        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(position);
        marker.userData = {
          isPathMarker: true,
          text: settings.tooltipTexts[i] || "Response: This is a test",
          index: i,
          worldPosition: position.clone(),
          threshold: t,
          visible: false,
        };

        geodesicMarkers.push(marker);
        wireframe.add(marker);
      }
    }

    function createPathTooltips() {
      // Create tooltip elements for each marker
      geodesicMarkers.forEach((marker, index) => {
        const tooltipElement = document.createElement("div");
        tooltipElement.style.cssText = `
          position: absolute;
          z-index: 999;
          pointer-events: none;
          background: white;
          color: #333;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s;
        `;
        tooltipElement.textContent = marker.userData.text;
        visualContainer.appendChild(tooltipElement);
        pathTooltipElements.push(tooltipElement);
      });
    }

    function updatePathTooltipPositions() {
      geodesicMarkers.forEach((marker, index) => {
        const tooltipElement = pathTooltipElements[index];

        // Get the marker's world position
        const worldPos = new THREE.Vector3();
        marker.getWorldPosition(worldPos);

        // Project to screen coordinates
        const screenPos = worldPos.clone().project(camera);

        const x = (screenPos.x * 0.5 + 0.5) * visualContainer.clientWidth;
        const y = (screenPos.y * -0.5 + 0.5) * visualContainer.clientHeight;

        tooltipElement.style.left = x + 10 + "px";
        tooltipElement.style.top = y - 20 + "px";

        // Show/hide based on hover state and marker visibility
        if (isHoveringDataPoint || !marker.userData.visible) {
          tooltipElement.style.opacity = "0";
        } else {
          tooltipElement.style.opacity = "1";
        }
      });
    }

    function updateLineAnimation() {
      if (!isAnimating || animationComplete) return;

      // Increment animation progress (adjust speed here: 0.005 = slower, 0.02 = faster)
      animationProgress += 0.005;

      if (animationProgress >= 1) {
        animationProgress = 1;
        isAnimating = false;
        animationComplete = true;

        // Show end marker when animation completes
        wireframe.children.forEach((child) => {
          if (child.userData.isEndMarker) {
            child.material.opacity = 0.9;
          }
        });
      }

      // Calculate how many points to include in the line
      const numPoints = Math.floor(animationProgress * pathPoints.length);
      if (numPoints < 2) return;

      const visiblePoints = pathPoints.slice(0, numPoints);

      // Update the tube geometry with visible points
      const curve = new THREE.CatmullRomCurve3(visiblePoints);
      const newGeometry = new THREE.TubeGeometry(
        curve,
        Math.max(2, visiblePoints.length),
        0.08,
        8,
        false
      );

      geodesicLine.geometry.dispose();
      geodesicLine.geometry = newGeometry;

      // Check if we've reached any markers
      geodesicMarkers.forEach((marker) => {
        if (
          animationProgress >= marker.userData.threshold &&
          !marker.userData.visible
        ) {
          marker.userData.visible = true;
          marker.material.opacity = 0.9;
        }
      });
    }

    function restartAnimation() {
      // Reset animation state
      animationProgress = 0;
      isAnimating = true;
      animationComplete = false;

      // Hide all markers
      geodesicMarkers.forEach((marker) => {
        marker.userData.visible = false;
        marker.material.opacity = 0;
      });

      // Hide end marker
      wireframe.children.forEach((child) => {
        if (child.userData.isEndMarker) {
          child.material.opacity = 0;
        }
      });

      // Reset line to single point
      const curve = new THREE.CatmullRomCurve3([pathPoints[0], pathPoints[0]]);
      const newGeometry = new THREE.TubeGeometry(curve, 2, 0.08, 8, false);

      geodesicLine.geometry.dispose();
      geodesicLine.geometry = newGeometry;
    }

    function sampleSurfaceHeight(x, y) {
      // Sample the height from the surface using the wave function
      const wave1 = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 3;
      const wave2 = Math.sin(x * 0.15 + y * 0.15) * 2;
      const wave3 = Math.cos(x * 0.6) * Math.sin(y * 0.4) * 1.5;

      return wave1 + wave2 + wave3;
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

      // Check for data points
      const dataPointIntersects = raycaster.intersectObjects(
        points.filter((p) => p.userData.isDataPoint)
      );

      if (dataPointIntersects.length > 0) {
        isHoveringDataPoint = true;
        showTooltip(
          dataPointIntersects[0].object,
          event.clientX,
          event.clientY
        );
      } else {
        isHoveringDataPoint = false;
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

      // Update line drawing animation
      updateLineAnimation();

      // Smooth rotation interpolation
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      // Apply rotations to the scene
      wireframe.rotation.z = currentRotationY;
      wireframe.rotation.x = -Math.PI / 2 + currentRotationX;

      // Subtle camera movement
      const time = Date.now() * 0.0005;
      camera.position.y = 8 + Math.sin(time) * 1;

      // Update path tooltip positions
      updatePathTooltipPositions();

      renderer.render(scene, camera);
    }

    // Cleanup function
    return {
      cleanup: function () {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (renderer) {
          renderer.dispose();
        }
        hideTooltip();
        pathTooltipElements.forEach((el) => el.remove());
      },
      restart: restartAnimation,
    };
  }
}
