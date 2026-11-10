/* ------------------------------------------------------------------------------------------
 * Purpose:
 *     Draw the longitudinal profile of a selected road alignment.
 *
 * Responsibilities:
 *     1. Validate the selected alignment profile.
 *     2. Calculate horizontal and vertical graph scales.
 *     3. Draw terrain and design elevation profiles.
 *     4. Draw grid lines, axes, labels, and legend.
 *     5. Draw the engineering profile table below the graph.
 * ------------------------------------------------------------------------------------------*/

import { SVG_NS, PROFILE_CONFIG, STYLES } from "./config.js";
import { drawProfileTable } from "./profileTable.js";

/* -------------------------------- Main drawing function --------------------------------- */

export function drawLongitudinalProfile(alternative) {
    const svg = document.getElementById("profileSvg");
    const profileLayer = document.getElementById("profileLayer");

    if (!svg || !profileLayer) {
        console.warn("Longitudinal profile SVG elements were not found.");
        return;
    }

    profileLayer.replaceChildren();

    if (!alternative || !Array.isArray(alternative.profile) ||
        alternative.profile.length < 2) {
        console.warn("The selected alternative does not contain a valid profile.");
        return;
    }

    const profile = alternative.profile;

    const dimensions = calculateDimensions(profile);

    svg.setAttribute(
        "viewBox",
        `0 0 ${PROFILE_CONFIG.width} ${dimensions.totalHeight}`
    );

    svg.setAttribute("width", PROFILE_CONFIG.width);
    svg.setAttribute("height", dimensions.totalHeight);

    drawBackground(profileLayer, dimensions);
    drawGrid(profileLayer, dimensions);
    drawProfiles(profileLayer, profile, dimensions);
    drawAxes(profileLayer, dimensions);
    drawLegend(profileLayer);

    drawProfileTable(alternative, dimensions, profileLayer);
}

/* -------------------------------- Graph dimensions -------------------------------------- */

function calculateDimensions(profile) {
    const width = PROFILE_CONFIG.width;
    const height = PROFILE_CONFIG.height;

    const margin = PROFILE_CONFIG.margin;

    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotTop = margin.top;
    const plotBottom = height - margin.bottom;

    const startStation = Number(profile[0].station);
    const endStation = Number(profile[profile.length - 1].station);

    const elevations = profile.flatMap(point => [
        Number(point.terrainElevation),
        Number(point.designElevation)
    ]).filter(Number.isFinite);

    let minElevation = Math.min(...elevations);
    let maxElevation = Math.max(...elevations);

    if (minElevation === maxElevation) {
        minElevation -= 1;
        maxElevation += 1;
    }

    const elevationPadding = Math.max(
        (maxElevation - minElevation) * 0.08,
        0.5
    );

    minElevation -= elevationPadding;
    maxElevation += elevationPadding;

    return {
        width,
        height,
        totalHeight: PROFILE_CONFIG.totalHeight,

        plotLeft,
        plotRight,
        plotTop,
        plotBottom,

        startStation,
        endStation,

        minElevation,
        maxElevation,

        plotWidth: plotRight - plotLeft,
        plotHeight: plotBottom - plotTop
    };
}

/* -------------------------------- Coordinate conversion --------------------------------- */

function getX(station, dimensions) {
    const stationRange = dimensions.endStation - dimensions.startStation;

    if (stationRange === 0) {
        return dimensions.plotLeft;
    }

    return dimensions.plotLeft +
        ((station - dimensions.startStation) / stationRange) *
        dimensions.plotWidth;
}

function getY(elevation, dimensions) {
    const elevationRange =
        dimensions.maxElevation - dimensions.minElevation;

    return dimensions.plotBottom -
        ((elevation - dimensions.minElevation) / elevationRange) *
        dimensions.plotHeight;
}

/* -------------------------------- Background -------------------------------------------- */

function drawBackground(parent, dimensions) {
    const background = createSvgElement("rect", {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.totalHeight,
        fill: PROFILE_CONFIG.colors.background
    });

    parent.appendChild(background);
}

/* -------------------------------- Grid -------------------------------------------------- */

function drawGrid(parent, dimensions) {
    const gridGroup = createSvgElement("g", {
        class: "profile-grid"
    });

    const elevationSteps = PROFILE_CONFIG.elevationGridSteps;

    for (let index = 0; index <= elevationSteps; index++) {
        const y = dimensions.plotTop +
            (dimensions.plotHeight / elevationSteps) * index;

        gridGroup.appendChild(createSvgElement("line", {
            x1: dimensions.plotLeft,
            y1: y,
            x2: dimensions.plotRight,
            y2: y,
            stroke: PROFILE_CONFIG.colors.grid,
            "stroke-width": STYLES.profileGridWidth
        }));

        const elevation = dimensions.maxElevation -
            ((dimensions.maxElevation - dimensions.minElevation) /
                elevationSteps) * index;

        addText(
            gridGroup,
            dimensions.plotLeft - 10,
            y + 4,
            elevation.toFixed(2),
            {
                class: "profile-axis-label",
                "text-anchor": "end"
            }
        );
    }

    const stationInterval = PROFILE_CONFIG.stationInterval;

    const stationRange = dimensions.endStation - dimensions.startStation;

    const stationCount = Math.floor(stationRange / stationInterval);

    for (let index = 0; index <= stationCount; index++) {
        const station = dimensions.startStation + index * stationInterval;
        const x = getX(station, dimensions);

        gridGroup.appendChild(createSvgElement("line", {
            x1: x,
            y1: dimensions.plotTop,
            x2: x,
            y2: dimensions.plotBottom,
            stroke: PROFILE_CONFIG.colors.grid,
            "stroke-width": STYLES.profileGridWidth,
            "stroke-dasharray": "3 4"
        }));
    }

    parent.appendChild(gridGroup);
}

/* -------------------------------- Terrain and design profiles --------------------------- */

function drawProfiles(parent, profile, dimensions) {
    const terrainPoints = [];
    const designPoints = [];

    profile.forEach(point => {
        const station = Number(point.station);
        const terrainElevation = Number(point.terrainElevation);
        const designElevation = Number(point.designElevation);

        if (!Number.isFinite(station) ||
            !Number.isFinite(terrainElevation) ||
            !Number.isFinite(designElevation)) {
            return;
        }

        terrainPoints.push(
            `${getX(station, dimensions)},${getY(terrainElevation, dimensions)}`
        );

        designPoints.push(
            `${getX(station, dimensions)},${getY(designElevation, dimensions)}`
        );
    });

    parent.appendChild(createSvgElement("polyline", {
        points: terrainPoints.join(" "),
        fill: "none",
        stroke: PROFILE_CONFIG.colors.terrain,
        "stroke-width": STYLES.terrainProfileWidth,
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
    }));

    parent.appendChild(createSvgElement("polyline", {
        points: designPoints.join(" "),
        fill: "none",
        stroke: PROFILE_CONFIG.colors.design,
        "stroke-width": STYLES.designProfileWidth,
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
    }));
}

/* -------------------------------- Axes -------------------------------------------------- */

function drawAxes(parent, dimensions) {
    const axisGroup = createSvgElement("g", {
        class: "profile-axes"
    });

    axisGroup.appendChild(createSvgElement("line", {
        x1: dimensions.plotLeft,
        y1: dimensions.plotTop,
        x2: dimensions.plotLeft,
        y2: dimensions.plotBottom,
        stroke: PROFILE_CONFIG.colors.axis,
        "stroke-width": STYLES.profileAxisWidth
    }));

    axisGroup.appendChild(createSvgElement("line", {
        x1: dimensions.plotLeft,
        y1: dimensions.plotBottom,
        x2: dimensions.plotRight,
        y2: dimensions.plotBottom,
        stroke: PROFILE_CONFIG.colors.axis,
        "stroke-width": STYLES.profileAxisWidth
    }));

    addText(
        axisGroup,
        18,
        (dimensions.plotTop + dimensions.plotBottom) / 2,
        "Elevation (m)",
        {
            class: "profile-axis-title",
            transform: `rotate(-90 18 ${(dimensions.plotTop + dimensions.plotBottom) / 2})`,
            "text-anchor": "middle"
        }
    );

    addText(
        axisGroup,
        (dimensions.plotLeft + dimensions.plotRight) / 2,
        dimensions.plotBottom + 35,
        "Station (m)",
        {
            class: "profile-axis-title",
            "text-anchor": "middle"
        }
    );

    parent.appendChild(axisGroup);
}

/* -------------------------------- Legend ------------------------------------------------ */

function drawLegend(parent) {
    const legend = PROFILE_CONFIG.legend;

    const group = createSvgElement("g", {
        class: "profile-legend"
    });

    group.appendChild(createSvgElement("line", {
        x1: legend.x,
        y1: legend.y,
        x2: legend.x + legend.lineLength,
        y2: legend.y,
        stroke: PROFILE_CONFIG.colors.terrain,
        "stroke-width": STYLES.terrainProfileWidth
    }));

    addText(
        group,
        legend.x + legend.terrainLabelOffsetX,
        legend.y + 4,
        "Existing Terrain",
        { class: "profile-legend-label" }
    );

    group.appendChild(createSvgElement("line", {
        x1: legend.x + legend.designLineOffsetX,
        y1: legend.y,
        x2: legend.x + legend.designLineOffsetX + legend.lineLength,
        y2: legend.y,
        stroke: PROFILE_CONFIG.colors.design,
        "stroke-width": STYLES.designProfileWidth
    }));

    addText(
        group,
        legend.x + legend.designLabelOffsetX,
        legend.y + 4,
        "Design Profile",
        { class: "profile-legend-label" }
    );

    parent.appendChild(group);
}

/* -------------------------------- SVG helpers ------------------------------------------- */

function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);

    Object.entries(attributes).forEach(([name, value]) => {
        element.setAttribute(name, String(value));
    });

    return element;
}

function addText(parent, x, y, content, attributes = {}) {
    const text = createSvgElement("text", {
        x,
        y,
        ...attributes
    });

    text.textContent = content;
    parent.appendChild(text);

    return text;
}

