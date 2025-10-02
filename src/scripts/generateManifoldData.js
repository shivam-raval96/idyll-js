/**
 * Generate 100 data points for the manifold visualization
 * Each point represents a 28x28 black and white image
 */

// Generate 100 random points in 3D space
const data = [];
for (let i = 0; i < 100; i++) {
  // Generate points that roughly follow a curved manifold
  const t = (i / 100) * 2 * Math.PI;
  const r = 2 + 0.5 * Math.sin(t * 3);
  const x = r * Math.cos(t) + (Math.random() - 0.5) * 0.5;
  const y = r * Math.sin(t) + (Math.random() - 0.5) * 0.5;
  const z = Math.sin(t * 2) + (Math.random() - 0.5) * 0.3;

  // Generate a simple 28x28 black and white pattern
  const pattern = generateImagePattern(i);

  data.push({
    id: i,
    x: x,
    y: y,
    z: z,
    image: pattern,
  });
}

function generateImagePattern(seed) {
  // Create a simple 28x28 pattern based on seed
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Set background to black
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  // Generate white pattern
  ctx.fillStyle = "#ffffff";

  // Create different patterns based on seed
  const patternType = seed % 4;

  switch (patternType) {
    case 0: // Circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 4, 0, 2 * Math.PI);
      ctx.fill();
      break;
    case 1: // Rectangle
      ctx.fillRect(size / 4, size / 4, size / 2, size / 2);
      break;
    case 2: // Triangle
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 4);
      ctx.lineTo(size / 4, (3 * size) / 4);
      ctx.lineTo((3 * size) / 4, (3 * size) / 4);
      ctx.closePath();
      ctx.fill();
      break;
    case 3: // Cross
      ctx.fillRect(size / 2 - 2, size / 4, 4, size / 2);
      ctx.fillRect(size / 4, size / 2 - 2, size / 2, 4);
      break;
  }

  return canvas.toDataURL();
}

// Export the data
export { data };

