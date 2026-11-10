/* ------------------------------------------------------------------------------------------
 * Purpose:
 *     Draw the engineering data table below the longitudinal profile.
 *
 * Responsibilities:
 *     1. Generate stations starting from the alignment start.
 *     2. Include the exact alignment end station.
 *     3. Interpolate terrain and design elevations.
 *     4. Calculate distance, cut/fill, and design grade.
 *     5. Draw station lines and the six-row engineering table.
 * ------------------------------------------------------------------------------------------*/

import { SVG_NS, PROFILE_CONFIG, PROFILE_TABLE } from "./config.js";

/* -------------------------------- Main drawing function --------------------------------- */

export function drawProfileTable(alternative, dimensions, parentLayer) {
    if (!alternative || !Array.isArray(alternative.profile) ||
        alternative.profile.length < 2 || !parentLayer) {
        return;
    }

    const profile = alternative.profile;
    const stations = generateStations(profile);

    if (stations.length === 0) {
        return;
    }

    const tableData = stations.map((station, index) => {
        const terrainElevation =
            interpolateProfileValue(profile, station, "terrainElevation");

        const designElevation =
            interpolateProfileValue(profile, station, "designElevation");

        const previousStation = stations[index - 1];

        let grade = null;

        if (previousStation !== undefined) {
            const previousDesignElevation =
                interpolateProfileValue(
                    profile,
                    previousStation,
                    "designElevation"
                );

            const distance = station - previousStation;

            if (distance > 0) {
                grade = (
                    (designElevation - previousDesignElevation) / distance
                ) * 100;
            }
        }

        return {
            station,
            distanceFromStart: station - dimensions.startStation,
            terrainElevation,
            designElevation,
            cutFill: terrainElevation - designElevation,
            grade
        };
    });

    drawTable(parentLayer, tableData, dimensions);
}

/* -------------------------------- Generate stations ------------------------------------- */

function generateStations(profile) {
    const startStation = Number(profile[0].station);
    const endStation = Number(profile[profile.length - 1].station);
    const interval = PROFILE_TABLE.stationInterval;
    const tolerance = PROFILE_TABLE.stationTolerance;

    if (!Number.isFinite(startStation) ||
        !Number.isFinite(endStation) ||
        endStation < startStation ||
        interval <= 0) {
        return [];
    }

    const stations = [startStation];

    let nextStation = startStation + interval;

    while (nextStation < endStation - tolerance) {
        stations.push(nextStation);
        nextStation += interval;
    }

    if (Math.abs(stations[stations.length - 1] - endStation) > tolerance) {
        stations.push(endStation);
    }

    return stations;
}

/* -------------------------------- Interpolation ----------------------------------------- */

function interpolateProfileValue(profile, station, property) {
    if (station <= Number(profile[0].station)) {
        return Number(profile[0][property]);
    }

    const lastPoint = profile[profile.length - 1];

    if (station >= Number(lastPoint.station)) {
        return Number(lastPoint[property]);
    }

    for (let index = 0; index < profile.length - 1; index++) {
        const firstPoint = profile[index];
        const secondPoint = profile[index + 1];

        const firstStation = Number(firstPoint.station);
        const secondStation = Number(secondPoint.station);

        if (station >= firstStation && station <= secondStation) {
            const firstValue = Number(firstPoint[property]);
            const secondValue = Number(secondPoint[property]);

            const stationRange = secondStation - firstStation;

            if (stationRange === 0) {
                return firstValue;
            }

            const fraction = (station - firstStation) / stationRange;

            return firstValue + fraction * (secondValue - firstValue);
        }
    }

    return Number(lastPoint[property]);
}

/* -------------------------------- Draw table --------------------------------------------- */

function drawTable(parent, tableData, dimensions) {
    const group = createSvgElement("g", {
        class: "profile-table"
    });

    const tableTop = PROFILE_TABLE.top;
    const rowHeight = PROFILE_TABLE.rowHeight;
    const tableBottom = tableTop + rowHeight * PROFILE_TABLE.rowCount;

    const labelLeft = PROFILE_TABLE.labelLeft;
    const labelRight = dimensions.plotLeft - PROFILE_TABLE.labelGap;

    const rows = [
        {
            label: "Station",
            value: item => formatStation(item.station),
            className: "station"
        },
        {
            label: "Distance from Start (m)",
            value: item => formatNumber(item.distanceFromStart, 2)
        },
        {
            label: "Existing Elev. (m)",
            value: item => formatNumber(item.terrainElevation, 2),
            color: PROFILE_TABLE.colors.terrain
        },
        {
            label: "Design Elev. (m)",
            value: item => formatNumber(item.designElevation, 2),
            color: PROFILE_TABLE.colors.design
        },
        {
            label: "Cut / Fill (m)",
            value: item => formatSignedNumber(item.cutFill, 2),
            color: item => item.cutFill >= 0
                ? PROFILE_TABLE.colors.cut
                : PROFILE_TABLE.colors.fill
        },
        {
            label: "Grade (%)",
            value: item => item.grade === null
                ? "—"
                : formatSignedNumber(item.grade, 2)
        }
    ];

    drawTableBackground(group, tableTop, tableBottom, dimensions);
    drawTableHeaders(group, rows, labelLeft, labelRight, tableTop, rowHeight);
    drawHorizontalLines(group, tableTop, tableBottom, dimensions);
    drawStationLines(group, tableData, dimensions, tableBottom);
    drawStationValues(group, tableData, rows, dimensions, tableTop, rowHeight);

    parent.appendChild(group);
}

/* -------------------------------- Background -------------------------------------------- */

function drawTableBackground(parent, tableTop, tableBottom, dimensions) {
    parent.appendChild(createSvgElement("rect", {
        x: PROFILE_TABLE.labelLeft,
        y: tableTop,
        width: dimensions.plotRight - PROFILE_TABLE.labelLeft,
        height: tableBottom - tableTop,
        fill: PROFILE_TABLE.colors.background,
        stroke: PROFILE_TABLE.colors.border,
        "stroke-width": 1
    }));

    parent.appendChild(createSvgElement("rect", {
        x: PROFILE_TABLE.labelLeft,
        y: tableTop,
        width: dimensions.plotLeft - PROFILE_TABLE.labelGap -
            PROFILE_TABLE.labelLeft,
        height: tableBottom - tableTop,
        fill: PROFILE_TABLE.colors.header
    }));
}

/* -------------------------------- Row labels --------------------------------------------- */

function drawTableHeaders(parent, rows, labelLeft, labelRight, tableTop, rowHeight) {
    rows.forEach((row, index) => {
        const y = tableTop + index * rowHeight;

        const text = createSvgElement("text", {
            x: labelLeft + PROFILE_TABLE.labelPadding,
            y: y + rowHeight / 2 + 4,
            fill: PROFILE_TABLE.colors.text,
            "font-size": PROFILE_TABLE.headerFontSize,
            "font-weight": "600",
            "text-anchor": "start"
        });

        text.textContent = row.label;
        parent.appendChild(text);
    });
}

/* -------------------------------- Horizontal lines -------------------------------------- */

function drawHorizontalLines(parent, tableTop, tableBottom, dimensions) {
    for (let index = 0; index <= PROFILE_TABLE.rowCount; index++) {
        const y = tableTop + index * PROFILE_TABLE.rowHeight;

        parent.appendChild(createSvgElement("line", {
            x1: PROFILE_TABLE.labelLeft,
            y1: y,
            x2: dimensions.plotRight,
            y2: y,
            stroke: PROFILE_TABLE.colors.border,
            "stroke-width": 1
        }));
    }

    parent.appendChild(createSvgElement("line", {
        x1: dimensions.plotLeft - PROFILE_TABLE.labelGap,
        y1: tableTop,
        x2: dimensions.plotLeft - PROFILE_TABLE.labelGap,
        y2: tableBottom,
        stroke: PROFILE_TABLE.colors.border,
        "stroke-width": 1
    }));
}

/* -------------------------------- Station lines ----------------------------------------- */

function drawStationLines(parent, tableData, dimensions, tableBottom) {
    tableData.forEach(item => {
        const x = getStationX(item.station, dimensions);

        parent.appendChild(createSvgElement("line", {
            x1: x,
            y1: dimensions.plotTop,
            x2: x,
            y2: tableBottom,
            stroke: PROFILE_TABLE.colors.stationLine,
            "stroke-width": 1,
            "stroke-dasharray": "3 3"
        }));
    });
}

/* -------------------------------- Station values ---------------------------------------- */

function drawStationValues(parent, tableData, rows, dimensions, tableTop, rowHeight) {
    tableData.forEach((item, stationIndex) => {
        const stationX = getStationX(item.station, dimensions);

        const nextStation = tableData[stationIndex + 1];
        const previousStation = tableData[stationIndex - 1];

        let textX = stationX + PROFILE_TABLE.valueOffset;

        const nextX = nextStation
            ? getStationX(nextStation.station, dimensions)
            : null;

        const previousX = previousStation
            ? getStationX(previousStation.station, dimensions)
            : null;

        const nextGap = nextX === null ? Infinity : nextX - stationX;
        const previousGap = previousX === null ? Infinity : stationX - previousX;

        if (stationIndex === tableData.length - 1 &&
            previousGap < PROFILE_TABLE.minimumTextGap) {
            textX = stationX - PROFILE_TABLE.valueOffset;
        } else if (nextGap < PROFILE_TABLE.minimumTextGap) {
            textX = stationX + PROFILE_TABLE.valueOffset;
        }

        const anchor = stationIndex === tableData.length - 1 &&
        previousGap < PROFILE_TABLE.minimumTextGap
            ? "end"
            : "start";

        rows.forEach((row, rowIndex) => {
            const y = tableTop + rowIndex * rowHeight + rowHeight / 2 + 4;

            const text = createSvgElement("text", {
                x: textX,
                y,
                fill: typeof row.color === "function"
                    ? row.color(item)
                    : row.color || PROFILE_TABLE.colors.text,
                "font-size": PROFILE_TABLE.valueFontSize,
                "text-anchor": anchor
            });

            text.textContent = row.value(item);
            parent.appendChild(text);
        });
    });
}

/* -------------------------------- Coordinate helpers ------------------------------------ */

function getStationX(station, dimensions) {
    const stationRange = dimensions.endStation - dimensions.startStation;

    if (stationRange === 0) {
        return dimensions.plotLeft;
    }

    return dimensions.plotLeft +
        ((station - dimensions.startStation) / stationRange) *
        dimensions.plotWidth;
}

/* -------------------------------- Formatting -------------------------------------------- */

function formatStation(station) {
    const kilometers = Math.floor(station / 1000);
    const meters = station - kilometers * 1000;

    return `${kilometers}+${meters.toFixed(2).padStart(6, "0")}`;
}

function formatNumber(value, decimals) {
    return Number(value).toFixed(decimals);
}

function formatSignedNumber(value, decimals) {
    const number = Number(value);

    if (number > 0) {
        return `+${number.toFixed(decimals)}`;
    }

    return number.toFixed(decimals);
}

/* -------------------------------- SVG helper --------------------------------------------- */

function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);

    Object.entries(attributes).forEach(([name, value]) => {
        element.setAttribute(name, String(value));
    });

    return element;
}

