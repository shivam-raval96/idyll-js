// import { plotClusters } from './clusters'
import { init_memory_plot } from './memory'
import { loadFragments } from './fragmentLoader'

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    loadFragments();
    init_memory_plot();
}, { once: true });
