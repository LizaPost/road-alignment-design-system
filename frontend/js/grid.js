/* ------------------------------------------------------------------------------------------
* Purpose:          draw 1 km x 1 km coordinate grid on the Terrain Plan
------------------------------------------------------------------------------------------*/

import { SVG_NS, TERRAIN, GRID, COLORS } from "./config.js";
import { toSvgX, toSvgY, toSurveyX, toSurveyY } from "./coordinateTransform.js";


// draws coordinate grid inside the visible svg area
export function drawCoordinateGrid() {

    const layer = document.getElementById("gridLayer");

    if (!layer) {
        console.error("Coordinate grid layer was not found.");
        return;
    }

    layer.innerHTML = "";

    // determine survey coordinates at svg boundaries
    const left = toSurveyX(0);
    const right = toSurveyX(TERRAIN.width);
    const top = toSurveyY(0);
    const bottom = toSurveyY(TERRAIN.height);

    const minX = Math.min(left, right);
    const maxX = Math.max(left, right);
    const minY = Math.min(top, bottom);
    const maxY = Math.max(top, bottom);

    const spacing = GRID.spacing;

    // align grid lines
    const firstX = Math.ceil(minX / spacing) * spacing;
    const lastX = Math.floor(maxX / spacing) * spacing;

    const firstY = Math.ceil(minY / spacing) * spacing;
    const lastY = Math.floor(maxY / spacing) * spacing;

    const gridXs = [];
    const gridYs = [];

    // draw vertical grid lines
    for (let x = firstX; x < lastX; x += spacing) {

        const svgX = toSvgX(x);

        const line = document.createElementNS(SVG_NS, "line");

        line.setAttribute("x1", svgX);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", svgX);
        line.setAttribute("y2", TERRAIN.height);
        line.setAttribute("stroke", COLORS.coordinateGrid);
        line.setAttribute("stroke-width", GRID.lineWidth);
        line.setAttribute("stroke-opacity", "0.65");

        layer.appendChild(line);
        gridXs.push({ survey: x, svg: svgX});
    }

    // draw horizontal grid lines
    for (let y = firstY; y <= lastY; y += spacing) {

        const svgY = toSvgY(y);

        const line = document.createElementNS(SVG_NS, "line");

        line.setAttribute("x1", 0);
        line.setAttribute("y1", svgY);
        line.setAttribute("x2", TERRAIN.width);
        line.setAttribute("y2", svgY);
        line.setAttribute("stroke", COLORS.coordinateGrid);
        line.setAttribute("stroke-width", GRID.lineWidth);
        line.setAttribute("stroke-opacity", "0.65");

        layer.appendChild(line);
        gridYs.push({ survey: y, svg: svgY});
    }

    // draw green cross at every visible grid intersection
    gridXs.forEach(gridX => {
        gridYs.forEach(gridY => {
            drawCross(layer, gridX.svg, gridY.svg);
        });
    });
}

// draws green cross at grid intersections
function drawCross(layer, x, y) {

    const size = GRID.crossSize;

    const horizontal = document.createElementNS(SVG_NS, "line");

    horizontal.setAttribute("x1", x - size);
    horizontal.setAttribute("y1", y);
    horizontal.setAttribute("x2", x + size);
    horizontal.setAttribute("y2", y);
    horizontal.setAttribute("stroke", COLORS.coordinateGridCross);
    horizontal.setAttribute("stroke-width", GRID.crossWidth);

    const vertical = document.createElementNS(SVG_NS, "line");

    vertical.setAttribute("x1", x);
    vertical.setAttribute("y1", y - size);
    vertical.setAttribute("x2", x);
    vertical.setAttribute("y2", y + size);
    vertical.setAttribute("stroke", COLORS.coordinateGridCross);
    vertical.setAttribute("stroke-width", GRID.crossWidth);

    layer.appendChild(horizontal);
    layer.appendChild(vertical);
}

