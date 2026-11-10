/* ------------------------------------------------------------------------------------------
* Purpose:          convert survey coordinates into svg coordinates
*
* Description:      this module is responsible for creating one shared coordinate transformation;
*                   it receives terrain data from app.js and converts survey coordinates
*                   in svg coordinates to display on a screen
------------------------------------------------------------------------------------------*/

import { TERRAIN } from "./config.js";

let minX = 0;
let maxX = 0;
let minY = 0;
let maxY = 0;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let configured = false;

// calculates a shared coordinate transformation for the loaded survey
export function configureTerrainTransform(points) {

    if (!Array.isArray(points) || points.length === 0) {
        throw new Error("Cannot configure coordinates without survey points.");
    }

    // calculate survey boundaries
    const xValues = points.map(point => point.x);
    const yValues = points.map(point => point.y);

    const dataMinX = Math.min(...xValues);
    const dataMaxX = Math.max(...xValues);
    const dataMinY = Math.min(...yValues);
    const dataMaxY = Math.max(...yValues);

    // Calculate the center of the survey.
    const centerX = (dataMinX + dataMaxX) / 2;
    const centerY = (dataMinY + dataMaxY) / 2;

    // Add a margin around the survey boundaries.
    const margin = TERRAIN.margin;

    const rangeX = Math.max(dataMaxX - dataMinX, 1);
    const rangeY = Math.max(dataMaxY - dataMinY, 1);

    const expandedMinX = centerX - rangeX * (0.5 + margin);
    const expandedMaxX = centerX + rangeX * (0.5 + margin);

    const expandedMinY = centerY - rangeY * (0.5 + margin);
    const expandedMaxY = centerY + rangeY * (0.5 + margin);

    minX = expandedMinX;
    maxX = expandedMaxX;
    minY = expandedMinY;
    maxY = expandedMaxY;

    // Calculate the available drawing area.
    const availableWidth = TERRAIN.width - 2 * TERRAIN.padding;
    const availableHeight = TERRAIN.height - 2 * TERRAIN.padding;

    // Use one scale to preserve real-world proportions.
    scale = Math.min(availableWidth / (maxX - minX), availableHeight / (maxY - minY));

    // Center the expanded survey area in the SVG viewport.
    offsetX = TERRAIN.width / 2 - centerX * scale;
    offsetY = TERRAIN.height / 2 + centerY * scale;

    configured = true;
}

function isConfigured() {

    if(!configured) {
        throw new Error("Terrain coordinate transformation is not configured.");
    }
}

// converts survey x coordinate into svg x coordinate
export function toSvgX(x) {

    isConfigured();

    if (maxX === minX) {
        return TERRAIN.width / 2;
    }

    return offsetX + x * scale;
}

// converts survey y coordinate into svg y coordinate
export function toSvgY(y) {

    isConfigured();

    if (maxY === minY) {
        return TERRAIN.height / 2;
    }

    return offsetY - y * scale;
}

// converts svg x coordinate into survey x coordinate
export function toSurveyX(svgX) {

    isConfigured();

    if (maxX === minX) {
        return minX;
    }

    return (svgX - offsetX) / scale;
}

// converts svg y coordinate into survey y coordinate
export function toSurveyY(svgY) {

    isConfigured();

    const usableHeight = TERRAIN.height - 2 * TERRAIN.padding;

    if (maxY === minY) {
        return minY;
    }

    return (offsetY - svgY) / scale;
}
