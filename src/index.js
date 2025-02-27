// import { plotClusters } from './clusters'
import { init_memory_plot } from './memory'
import { loadFragments } from './fragmentLoader'
import { syncHFSpacesURLHash } from './syncHFSpacesURLHash'

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    loadFragments();
    init_memory_plot();
    syncHFSpacesURLHash();
}, { once: true });
