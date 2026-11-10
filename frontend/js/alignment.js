/* ------------------------------------------------------------------------------------------
* Purpose:          renders generated road alignment alternatives on the terrain plan
*
* Description:      this module takes the alternatives generated on backend
*                   and draws their paths as colored svg polylines
*
* Responsibilities:
*                   1. Convert survey coordinates into svg coordinates
*                   2. Draw every generated alternative
*                   3. Assign a distinct, repeatable color to each alternative
*                   4. Clear old alignment lines before drawing a new set
*                   5. Keep all alignment polylines inside alignmentLayer
*
------------------------------------------------------------------------------------------*/

import { SVG_NS, COLORS, STYLES } from "./config.js";
import { toSvgX, toSvgY } from "./coordinateTransform.js";

// returns color of an alternative
export function getAlignmentColor(index) {
    return COLORS.alignments[index % COLORS.alignments.length];
}

// draws all generated alternatives on the terrain plan
export function drawAlignmentAlternatives(alternatives, surveyPoints) {

    const svg = document.getElementById("terrainSvg");

    // find or create SVG layer for alignment alternatives
    let layer = document.getElementById("alignmentLayer");

    // create the alignment layer if it doesn't exist
    if (!layer) {
        layer = document.createElementNS(SVG_NS, "g");
        layer.setAttribute("id", "alignmentLayer");
        svg.appendChild(layer);
    }

    // remove alternatives from previous generation
    layer.innerHTML = "";

    // use the same coordinate bounds as the terrain drawing
    const xValues = surveyPoints.map(point => point.x);
    const yValues = surveyPoints.map(point => point.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // draw each alternative as a separate polyline
    alternatives.forEach((alternative, index) => {
        const points = alternative.alignmentPoints;

        if (!points || points.length === 0) {
            return;
        }

        const polyline = document.createElementNS(SVG_NS, "polyline");
        const coordinates = points.map(point => `${toSvgX(point.x)}, ${toSvgY(point.y)}`).join(" ");

        polyline.setAttribute("points", coordinates);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", getAlignmentColor(index));
        polyline.setAttribute("stroke-width", "1.5");
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute("stroke-linejoin", "round");

        // keep alternative's identity available for future interactions
        polyline.dataset.alternativeId = alternative.id;

        layer.appendChild(polyline);
    });
}