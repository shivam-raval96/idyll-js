import * as d3 from 'd3';

export function activationMemory(
    a, // attention heads
    b, // micro batch size
    h, // hidden dimension size
    h_ff, // feedforward dimension size (often h_ff = 4h)
    L, // number of layers
    s, // sequence length
    v, // vocab size
    mixed = true,
    recomputation = "none",
    ff_activation = "relu"
) {
    console.log('activationMemory called with:', { a, b, h, h_ff, L, s, v, mixed, recomputation, ff_activation });
    // https://arxiv.org/pdf/2205.05198
    const bytesPerValue = mixed ? 2 : 4;

    const oneLayerAttention = s * b * h * (bytesPerValue * 5 + 1) + ((2 * bytesPerValue + 1) * a * s * s * b); // eq (2)

    let oneLayerFeedforward;
    if (ff_activation === "relu") {
        oneLayerFeedforward = (s * b * h * bytesPerValue + (s * b * h_ff * bytesPerValue) // inputs of 1st/2nd linear layers
            + s * b * h);  // dropout
    } else if (ff_activation === "gelu") {
        oneLayerFeedforward = (s * b * h * bytesPerValue + (s * b * h_ff * bytesPerValue) // inputs of 1st/2nd linear layers
            + s * b * h_ff * bytesPerValue // inputs of activation function (not really necessary for Relu)
            + s * b * h);  // dropout
    } else if (ff_activation === "swiglu") {
        oneLayerFeedforward = (s * b * h * bytesPerValue + (s * b * h_ff * bytesPerValue) // inputs of input/output linear layers
            + s * b * h_ff * bytesPerValue * 3 // inputs of activation function
            + s * b * h);  // dropout (note that dropout is lower-precision - boolean)
    }

    const layerNorm = s * b * h * bytesPerValue;

    const inputDropout = s * b * h; // section 4.3
    const outputLayerNorm = s * b * h * bytesPerValue;
    const outputLayerProjection = s * b * h * bytesPerValue;
    const outputCrossEntropy = s * b * v * 4;  // In FP32


    let oneLayer;
    if (recomputation === "none") {
        oneLayer = oneLayerAttention + oneLayerFeedforward + 2 * layerNorm; // eq (2)
    } else if (recomputation === "selective") {
        oneLayer = s * b * h * 34; // eq (6)
    } else if (recomputation === "full") {
        oneLayer = s * b * h * 2;
    } else {
        throw new Error("Invalid recomputation value");
    }

    const data = {
        name: "activationMemory",
        children: [
            ...Array.from({ length: L }, (_, index) => ({
                name: `Layer ${index + 1}`,
                children: [
                    { name: 'Attention', value: oneLayerAttention },
                    { name: 'Feedforward', value: oneLayerFeedforward },
                    { name: 'LayerNorm', value: 2 * layerNorm },
                ]
            })),
            { name: 'Dropout', value: inputDropout },
            { name: 'LayerNorm', value: outputLayerNorm },
            { name: 'Projection', value: outputLayerProjection },
            { name: 'Cross Entropy', value: outputCrossEntropy }
        ]
    };

    const total = L * oneLayer + inputDropout + outputLayerNorm + outputLayerProjection + outputCrossEntropy;

    return data;
}

export function paramGradsOpt(h, L, s, v, k = 8, mixed = true) {
    console.log('paramGradsOpt called with:', { h, L, s, v, k, mixed });
    const emb = h * (v + s);
    const oneLayer = 12 * h ** 2 + 13 * h;
    const other = 2 * h;

    const n = emb + L * oneLayer + other;

    if (mixed) {
        k += 4;
    }
    const bytesPerParameter = mixed ? 2 : 4;

    const result = [bytesPerParameter * n, bytesPerParameter * n, k * n];
    console.log('paramGradsOpt result:', result);
    return result;
}

export function updateGraph() {
    console.log('updateGraph called');
    const a = +document.getElementById('a').value;
    const b = +document.getElementById('b').value;
    const h = +document.getElementById('h').value;
    const h_ff = +document.getElementById('h_ff').value;
    const L = +document.getElementById('L').value;
    const s = +document.getElementById('s').value;
    const v = +document.getElementById('v').value;
    const mixed = document.getElementById('mixed').checked;
    const recomputation = document.getElementById('recomputation').value;
    const ff_activation = document.getElementById('ff_activation').value;

    console.log('Slider values:', { a, b, h, h_ff, L, s, v, mixed, recomputation, ff_activation });

    const fixedSize100GB = 100 * 1024 * 1024 * 1024; // 100GB in bytes
    const activationMemoryData = activationMemory(a, b, h, h_ff, L, s, v, mixed, recomputation, ff_activation);
    const paramGradsOptValue = paramGradsOpt(h, L, s, v)[0];

    const data = {
        name: "root",
        children: [
            {
                name: 'Total',
                value: 0,
                children: [
                    activationMemoryData,
                    { name: 'paramGradsOpt', value: paramGradsOptValue }
                ]
            }
        ]
    };

    console.log('Data for treemap:', data);

    const width = 700;
    const height = 450;
    const legendHeight = 50;

    const svg = d3.select("#graph").select("svg");
    svg.selectAll("*").remove();
    svg.attr("width", width)
       .attr("height", height + legendHeight);

    const treemap = d3.treemap()
        .size([width, height])
        .paddingOuter(3)
        .paddingTop(19)
        .paddingInner(1)
        .round(true);

    const root = d3.hierarchy(data)
        .sum(d => d.value);
        // .sort((a, b) => b.value - a.value);

    if (root.children[0].value < fixedSize100GB) {
        root.children[0].value = fixedSize100GB;
    }

    console.log('Treemap root:', root);

    treemap(root);

    const color = d => {
        switch(d.data.name) {
            case 'paramGradsOpt': return '#4e79a7';  // Blue
            case 'activationMemory': return '#f28e2c';  // Orange
            case 'fixed100GB': return '#59a14f';  // Green
            case 'Attention': return '#e15759';  // Red
            case 'Feedforward': return '#f28e2c';  // Orange
            case 'LayerNorm': return '#9b59b6';  // Purple
            case 'Dropout': return '#e15759';  // Red
            case 'Projection': return '#f28e2c';  // Orange
            case 'Cross Entropy': return '#e15759';  // Red
            default: return '#59a14f';  // Red (for unexpected cases)
        }
    };

    const cell = svg.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => d.depth === 1 ? "none" : color(d))
        .attr("stroke", d => d.depth === 1 ? color(d) : "none")
        .attr("stroke-width", 2);

    const fontSize = 10;
    const padding = 2;

    cell.append("text")
        .attr("font-size", `${fontSize}px`)
        .attr("font-family", "sans-serif")
        .each(function(d) {
            if (d.depth === 0) return; // Skip root node

            const node = d3.select(this);
            
            const name = d.data.name;
            const value = formatBytes(d.value);
            
            if (d.depth === 1) {
                // Parent node (fixed100GB)
                node.attr("transform", `translate(${padding},${fontSize + padding})`)
                    .attr("font-weight", "bold")
                    .text(`${name}: ${value}`);
            } else {
                // Child nodes
                node.attr("transform", `translate(${padding},${fontSize + padding})`)
                    .text(name[0].toUpperCase())  // Display only the first letter
                    .append("title")  // Add title for hover effect
                    .text(`${name}: ${value}`);
            }
        });

    // Add invisible rect for better hover area
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .append("title")
        .text(d => `${d.data.name}: ${formatBytes(d.value)}`);

    // Adjust legend positioning
    const legendData = root.children[0].children.concat(root.children[0]);
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("transform", `translate(0, ${height})`)
        .selectAll("g")
        .data(legendData)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * 240}, 0)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => d.data.name === 'fixed100GB' ? 'none' : color(d))
        .attr("stroke", d => d.data.name === 'fixed100GB' ? color(d) : 'none')
        .attr("stroke-width", 2);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => `${d.data.name}: ${formatBytes(d.value)}`);

    console.log('Treemap nodes created');
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}

const presets = {
    "Tiny": { a: 16, b: 3, h: 1024, h_ff: 4096, L: 1, s: 7, v: 30522, mixed: true, recomputation: "none", ff_activation: "gelu" },
    "8B": { a: 32, b: 32, h: 4096, h_ff: 16384, L: 32, s: 256, v: 30522, mixed: true, recomputation: "none", ff_activation: "swiglu" },
    "70B": { a: 64, b: 32, h: 8192, h_ff: 32768, L: 80, s: 256, v: 30522, mixed: true, recomputation: "none", ff_activation: "swiglu" },
    "405B": { a: 128, b: 32, h: 16384, h_ff: 65536, L: 126, s: 256, v: 30522, mixed: true, recomputation: "none", ff_activation: "swiglu" }
};

function setPresetValues(preset) {
    if (preset === "custom") return;

    const values = presets[preset];
    Object.keys(values).forEach(key => {
        const element = document.getElementById(key);
        const inputElement = document.getElementById(`${key}_input`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = values[key];
            } else {
                element.value = values[key];
            }
        }
        if (inputElement) {
            inputElement.value = values[key];
        }
    });

    updateGraph();
}

function syncSliderAndInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    slider.addEventListener('input', () => {
        input.value = slider.value;
        updateGraph();
    });

    input.addEventListener('input', () => {
        let value = parseInt(input.value);
        if (isNaN(value)) {
            value = parseInt(slider.min);
        }
        value = Math.max(parseInt(slider.min), Math.min(parseInt(slider.max), value));
        slider.value = value;
        input.value = value;
        updateGraph();
    });
}

export const init_memory_plot = function () {
    console.log('DOM fully loaded and parsed');
    
    const sliderIds = ['a', 'b', 'h', 'h_ff', 'L', 's', 'v'];  // Added 'v'
    sliderIds.forEach(id => {
        syncSliderAndInput(id, `${id}_input`);
    });

    const recomputationSelect = document.getElementById('recomputation');
    recomputationSelect.addEventListener('change', updateGraph);

    const ffActivationSelect = document.getElementById('ff_activation');
    ffActivationSelect.addEventListener('change', updateGraph);

    const mixedCheckbox = document.getElementById('mixed');
    mixedCheckbox.addEventListener('change', updateGraph);

    const presetSelect = document.getElementById('presets');
    presetSelect.addEventListener('change', (event) => {
        setPresetValues(event.target.value);
    });

    // Set max values for sliders based on the highest values in the presets
    document.getElementById('a').max = 128;
    document.getElementById('b').max = 53248;
    document.getElementById('h').max = 16384;
    document.getElementById('h_ff').max = 65536;
    document.getElementById('L').max = 126;
    document.getElementById('s').max = 128000;
    document.getElementById('v').max = 100000;  // Set a reasonable max for vocabulary size

    console.log('Adding svg');
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", 960)
        .attr("height", 500);

    updateGraph();
};