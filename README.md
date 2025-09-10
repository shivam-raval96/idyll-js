---
title: The Distill Template
emoji: 🌌
colorFrom: yellow
colorTo: purple
sdk: static
pinned: true
license: apache-2.0
header: mini
app_file: dist/index.html
thumbnail: https://huggingface.co/spaces/nanotron/distill-blog-template/resolve/main/thumbnail.png
short_description: Craft Beautiful Blogs
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

Instruction to install and run locally

```bash
npm install
npm run build
npm run dev

// If you want to change something change it in src/....

// Once you are finished
npm run build
// And commit the dist folder
```

## Adding Interactive Content

You can add interactive content directly to your blog by including HTML, CSS, and JavaScript inline in your `src/index.html` file. For complex visualizations, you can:

- Include external libraries via CDN (like Plotly, D3, etc.)
- Add custom JavaScript in the `<script>` tags
- Use CSS for styling your interactive components

### Example:

```html
<script src="https://cdn.plot.ly/plotly-3.0.0.min.js"></script>
<div id="myVisualization"></div>
<script>
  // Your interactive code here
</script>
```
