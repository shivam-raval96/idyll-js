// import { plotClusters } from './clusters'
import { init_ablation_plot } from './plotting'
import 'katex/dist/katex.min.css';
import katex from 'katex';

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    // plotClusters();
    init_ablation_plot();
}, { once: true });