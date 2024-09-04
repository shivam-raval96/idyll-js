// import { plotClusters } from './clusters'
import { init_ablation_plot } from './plotting'
import { init_memory_plot } from './memory'


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    // plotClusters();
    init_ablation_plot();
    init_memory_plot();
}, { once: true });
