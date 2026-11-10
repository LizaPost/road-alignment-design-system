/* ------------------------------------------------------------------------------------------
Handles communication with the backend terrain API
- loads available terrain dataset options
- retrieves terrain dataset
- imports a selected terrain dataset
------------------------------------------------------------------------------------------*/

import { API_BASE_URL } from "./config.js";

// sends HTTP request and returns the parsed JSON response
export async function fetchJson(endpoint, options = {}) {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || `HTTP error: ${response.status}`);
    }

    return response.json();
}

// loads available terrain datasets into dropdown
export async function loadTerrainDatasets(selectElement) {

    const datasets = await fetchJson("/terrain/datasets");

    if (!Array.isArray(datasets)) {
        throw new Error("Invalid terrain dataset list returned by backend.");
    }

    selectElement.replaceChildren();

    datasets.forEach(dataset => {
        const option = document.createElement("option");
        option.value = dataset.id;
        option.textContent = dataset.label;
        selectElement.appendChild(option);
    });

    if (datasets.length === 0) {
        throw new Error("No terrain datasets are available. ");
    }
}

// retrieves terrain model for selected dataset
export async function loadTerrainDataset(datasetId) {

    if (!datasetId) {
        throw new Error("Dataset ID is required.");
    }

    return fetchJson(`/terrain/datasets/${encodeURIComponent(datasetId)}`);
}

// imports selected terrain dataset from backend
export async function importTerrainDataset(datasetId) {

    if (!datasetId) {
        throw new Error("Dataset ID is required.");
    }

    return fetchJson(`/terrain/import/${encodeURIComponent(datasetId)}`, {method: "POST"});
}