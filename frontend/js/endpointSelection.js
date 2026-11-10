/* ------------------------------------------------------------------------------------------
Manages road alignment endpoints selection
- handles selection mode for Start and End points
- converts SVG click positions into survey coordinates
- displays selected endpoints markers
------------------------------------------------------------------------------------------*/

import { toSurveyX, toSurveyY, toSvgX, toSvgY } from "./coordinateTransform.js";
import { SVG_NS, COLORS, STYLES } from "./config.js";

// selection state
let terrainSvg = null;
let viewport = null;
let selectedStartPoint = null;
let selectedEndPoint = null;
let activeSelection = null;
let statusCallback = () => {};
let selectionChangeCallback = () => {};

// initializes endpoint selection
export function initializeEndpointSelection(options) {

    terrainSvg = options.terrainSvg;
    viewport = options.viewport;

    statusCallback = options.onStatus || (() => {});
    selectionChangeCallback = options.onSelectionChange || (() => {});

    terrainSvg.addEventListener("click", handleTerrainClick);
}

// activates start and end point selection mode
export function enableEndpointSelection(selectionType) {

    if (selectionType !== "start" && selectionType !== "end") {
        return;
    }

    activeSelection = selectionType;

    statusCallback(`Select the ${selectionType.toUpperCase()} point on terrain plan.`);
}

// returns currently selected endpoints
export function getSelectedEndpoints() {
    return {start: selectedStartPoint, end: selectedEndPoint};
}

// clears both selected endpoints and their svg markers
export function clearEndpointSelection() {
    selectedStartPoint = null;
    selectedEndPoint = null;
    activeSelection = null;

    clearEndpointMarkers();
    selectionChangeCallback();
}

// handles a click on terrain
function handleTerrainClick(event) {

    if (!activeSelection) {
        return;
    }

    const svgPoint = terrainSvg.createSVGPoint();

    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;

    const viewportMatrix = viewport.getScreenCTM();

    if (!viewportMatrix) {
        statusCallback("Could not determine the viewport position.");
        return;
    }

    const terrainCoordinate = svgPoint.matrixTransform(
        viewportMatrix.inverse()
    );

    const selectedPoint = {
        x: toSurveyX(terrainCoordinate.x),
        y: toSurveyY(terrainCoordinate.y)
    };

    // temporary verification:
    /*console.log("Coordinate transformation:", {
        mouse: {
            clientX: event.clientX,
            clientY: event.clientY
        },
        svg: {
            x: terrainCoordinate.x,
            y: terrainCoordinate.y
        },
        viewport: {
            x: terrainCoordinate.x,
            y: terrainCoordinate.y
        },
        survey: {
            x: selectedPoint.x,
            y: selectedPoint.y
        },
        marker: {
            x: toSvgX(selectedPoint.x),
            y: toSvgY(selectedPoint.y)
        },
        viewportTransform: viewport.getAttribute("transform")
    });*/

    const selectionType = activeSelection;

    if (selectionType === "start") {
        selectedStartPoint = selectedPoint;
    } else {
        selectedEndPoint = selectedPoint;
    }

    activeSelection = null;

    drawEndpointMarkers();

    statusCallback(`${selectionType === "start" ? "Start point" : "End point"} selected: X = ${selectedPoint.x.toFixed(2)}, Y = ${selectedPoint.y.toFixed(2)}`);

    selectionChangeCallback();
}

// draws currently selected endpoints markers
function drawEndpointMarkers() {

    clearEndpointMarkers();

    if (selectedStartPoint) {
        drawMarker(selectedStartPoint, "startPointMarker", COLORS.endpointStartMarker, "S");
    }

    if (selectedEndPoint) {
        drawMarker(selectedEndPoint, "endPointMarker", COLORS.endpointEndMarker, "E");
    }
}

// draws endpoint marker
function drawMarker(point, markerId, color, label) {

    const markerLayer = document.getElementById("selectedPointLayer");

    if (!markerLayer) {
        return;
    }

    const circle = document.createElementNS(SVG_NS, "circle");

    circle.setAttribute("id", markerId);
    circle.setAttribute("cx", toSvgX(point.x));
    circle.setAttribute("cy", toSvgY(point.y));
    circle.setAttribute("r", STYLES.endpointMarkerRadius);
    circle.setAttribute("fill", color);
    circle.setAttribute("stroke", COLORS.endpointMarkerStroke);
    circle.setAttribute("stroke-width", STYLES.endpointMarkerBorderWidth);

    const text = document.createElementNS(SVG_NS, "text");

    text.setAttribute("x", toSvgX(point.x));
    text.setAttribute("y", toSvgY(point.y) - STYLES.endpointMarkerLabelOffsetY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-size", STYLES.selectedPointLabelFontSize);
    text.setAttribute("fill", color);
    text.textContent = label;

    markerLayer.append(circle, text);
}

function clearEndpointMarkers() {

    const markerLayer = document.getElementById("selectedPointLayer");

    if (markerLayer) {
        markerLayer.replaceChildren();
    }
}