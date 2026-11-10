/* */

import { configureTerrainTransform } from "./coordinateTransform.js";
import { drawCoordinateGrid } from "./grid.js";
import { drawTerrain } from "./terrain.js";
import { setupTerrainViewport } from "./terrainViewport.js";
import { drawAlignmentAlternatives } from "./alignment.js";
import { drawLongitudinalProfile } from "./profile.js";
import { displayAlternativeResults } from "./analysis.js";
import {loadTerrainDatasets, loadTerrainDataset, importTerrainDataset, fetchJson} from "./terrainData.js";
import {initializeEndpointSelection, enableEndpointSelection, getSelectedEndpoints, clearEndpointSelection} from "./endpointSelection.js";
import {initializeAlternativeSelector, populateAlternativeSelect, clearAlternativeSelector, getSelectedAlternativeId} from "./alignmentUI.js";

/* ------------------------------ application state ------------------------------ */

let surveyPoints = [];
let tinTriangles = [];
let contourPolylines = [];
let generatedAlternatives = [];

let terrainLoading = false;
let alignmentGenerating = false;

/* -------------------------------- DOM references -------------------------------- */

const elements = {
    terrainDataset: document.getElementById("terrainDataset"),
    importTerrainButton: document.getElementById("importTerrainButton"),

    status: document.getElementById("status"),
    pointCount: document.getElementById("pointCount"),

    terrainSvg: document.getElementById("terrainSvg"),
    viewport: document.getElementById("viewport"),

    selectStartButton: document.getElementById("selectStartButton"),
    selectEndButton: document.getElementById("selectEndButton"),
    generateButton: document.getElementById("generateButton"),

    profileTitle: document.getElementById("profileTitle"),
    profileLayer: document.getElementById("profileLayer"),
    alternativeResults: document.getElementById("alternativeResults")
};

/* -------------------------------- application helpers -------------------------------- */

function setStatus(message) {
    if (elements.status) {
        elements.status.textContent = message;
    }
}

function updateGenerateButton() {
    const { start, end } = getSelectedEndpoints();

    elements.generateButton.disabled = !(start && end) || alignmentGenerating;
}

function clearDisplayedAlternativeResults() {
    elements.profileTitle.textContent = "Longitudinal Profile";
    elements.profileLayer.replaceChildren();
    elements.alternativeResults.replaceChildren();

    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "Generate alternatives to view the analysis.";

    elements.alternativeResults.appendChild(emptyMessage);
}

/* -------------------------------- terrain loading -------------------------------- */
async function loadTerrain() {
    if (terrainLoading) {
        return false;
    }

    terrainLoading = true;
    elements.importTerrainButton.disabled = true;
    elements.terrainDataset.disabled = true;

    try {
        const datasetId = elements.terrainDataset.value;

        if (!datasetId) {
            throw new Error("No terrain dataset selected.");
        }

        setStatus("Loading terrain dataset...");
        console.log("Loading terrain dataset:", datasetId);

        const terrain = await loadTerrainDataset(datasetId);

        // Validate the complete response before changing application state.
        if (
            !terrain ||
            !Array.isArray(terrain.points) ||
            !Array.isArray(terrain.triangles) ||
            !Array.isArray(terrain.contours)
        ) {
            throw new Error("Invalid terrain data returned by backend.");
        }

        if (terrain.points.length === 0) {
            throw new Error("Selected terrain dataset contains no points.");
        }

        console.log("Terrain data received:", {
            datasetId: terrain.datasetId,
            points: terrain.points.length,
            triangles: terrain.triangles.length,
            contours: terrain.contours.length
        });

        // Commit the complete terrain model only after validation.
        surveyPoints = terrain.points;
        tinTriangles = terrain.triangles;
        contourPolylines = terrain.contours;

        configureTerrainTransform(surveyPoints);

        if (elements.pointCount) {
            elements.pointCount.textContent = surveyPoints.length;
        }

        drawCoordinateGrid();

        // false means that TIN triangles are hidden in the normal plan view.
        drawTerrain(surveyPoints, tinTriangles, contourPolylines, false);

        if (generatedAlternatives.length > 0) {
            drawAlignmentAlternatives(generatedAlternatives, surveyPoints);
        }

        setStatus(`Terrain loaded: ${surveyPoints.length} survey points.`);

        console.info("Terrain loaded successfully.", {
            points: surveyPoints.length,
            triangles: tinTriangles.length,
            contours: contourPolylines.length
        });

        return true;
    } catch (error) {
        console.error("Error loading terrain:", error);
        setStatus(`Could not load terrain: ${error.message}`);
        return false;
    } finally {
        terrainLoading = false;
        elements.importTerrainButton.disabled = false;
        elements.terrainDataset.disabled = false;
    }
}

/* -------------------------------- terrain import -------------------------------- */
async function importTerrain() {
    const datasetId = elements.terrainDataset.value;

    if (!datasetId) {
        setStatus("Please select a terrain dataset first.");
        return;
    }

    if (terrainLoading || alignmentGenerating) {
        setStatus("Wait for the current operation to finish.");
        return;
    }

    elements.importTerrainButton.disabled = true;

    try {
        setStatus("Importing survey data...");

        const result = await importTerrainDataset(datasetId);

        // Clear endpoint selections and alternatives from the previous terrain.
        clearEndpointSelection();
        generatedAlternatives = [];

        updateGenerateButton();
        clearAlternativeSelector();
        clearDisplayedAlternativeResults();

        document.getElementById("alignmentLayer").replaceChildren();

        setStatus(`Imported ${result.pointCount} survey points. Loading terrain...`);

        const refreshed = await loadTerrain();

        if (!refreshed) {
            throw new Error("The dataset was imported, but the terrain display could not be refreshed.");
        }
    } catch (error) {
        console.error("Terrain import failed:", error);
        setStatus(`Terrain import failed: ${error.message}`);
    } finally {
        elements.importTerrainButton.disabled = false;
    }
}

/* -------------------------------- display controls -------------------------------- */
function setupDisplayControls() {
    const controls = [
        { checkboxId: "showPoints", layerId: "pointLayer" },
        { checkboxId: "showContours", layerId: "contourLayer" },
        { checkboxId: "showAlignments", layerId: "alignmentLayer" }
    ];

    controls.forEach(({ checkboxId, layerId }) => {
        const checkbox = document.getElementById(checkboxId);
        const layer = document.getElementById(layerId);

        if (!checkbox || !layer) {
            console.warn(`Display control or SVG layer not found: ${checkboxId}, ${layerId}`);
            return;
        }

        const updateVisibility = () => {
            layer.style.display = checkbox.checked ? "" : "none";
        };

        checkbox.addEventListener("change", updateVisibility);
        updateVisibility();
    });
}

/* ---------------------------- alignment generation ---------------------------- */
async function generateAlternatives() {
    const { start, end } = getSelectedEndpoints();

    if (!start || !end) {
        setStatus("Please select both start and end points.");
        return;
    }

    if (alignmentGenerating) {
        return;
    }

    alignmentGenerating = true;
    elements.generateButton.disabled = true;

    try {
        setStatus("Generating road alignment alternatives...");

        // Send only X/Y. The backend calculates terrain elevations.
        const requestBody = {
            datasetId: elements.terrainDataset.value,
            start: {
                x: start.x,
                y: start.y
            },
            end: {
                x: end.x,
                y: end.y
            }
        };

        console.log("Alignment request payload:", requestBody);

        const alternatives = await fetchJson(
            "/alignments/generate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!Array.isArray(alternatives)) {
            throw new Error("The backend returned an invalid alternatives response.");
        }

        generatedAlternatives = alternatives;

        drawAlignmentAlternatives(generatedAlternatives, surveyPoints);

        const firstAlternativeId =
            populateAlternativeSelect(generatedAlternatives);

        if (firstAlternativeId === null) {
            elements.profileTitle.textContent = "No alternatives available";
            elements.profileLayer.replaceChildren();
            elements.alternativeResults.replaceChildren();
        } else {
            displaySelectedAlternative();
        }

        setStatus(`Generated ${generatedAlternatives.length} alternatives.`);
    } catch (error) {
        console.error("Failed to generate alternatives:", error);
        setStatus(`Failed to generate alternatives: ${error.message}`);
    } finally {
        alignmentGenerating = false;
        updateGenerateButton();
    }
}

function displaySelectedAlternative() {
    const selectedId = getSelectedAlternativeId();

    const alternative = generatedAlternatives.find(
        item => String(item.id) === selectedId
    );

    if (!alternative) {
        return;
    }

    drawLongitudinalProfile(alternative);
    displayAlternativeResults([alternative]);
}

/* ------------------------------ application setup ------------------------------ */

async function initializeApp() {
    // Initialize endpoint selection and connect its state changes to the UI.
    initializeEndpointSelection({
        terrainSvg: elements.terrainSvg,
        viewport: elements.viewport,
        onStatus: setStatus,
        onSelectionChange: updateGenerateButton
    });

    // Initialize the custom alternative dropdown.
    initializeAlternativeSelector(displaySelectedAlternative);

    // Terrain import.
    elements.importTerrainButton.addEventListener("click", importTerrain);

    // Start and End selection.
    elements.selectStartButton.addEventListener("click", () => {
        enableEndpointSelection("start");
    });

    elements.selectEndButton.addEventListener("click", () => {
        enableEndpointSelection("end");
    });

    // Generate alignment alternatives.
    elements.generateButton.addEventListener("click", generateAlternatives);

    // Terrain dataset selection.
    elements.terrainDataset.addEventListener("change", loadTerrain);

    // Initialize display controls and terrain viewport.
    setupDisplayControls();
    setupTerrainViewport();

    elements.generateButton.disabled = true;

    try {
        await loadTerrainDatasets(elements.terrainDataset);
        await loadTerrain();
    } catch (error) {
        console.error("Terrain initialization failed:", error);
        setStatus(`Could not initialize terrain: ${error.message}`);
    }
}

initializeApp();
