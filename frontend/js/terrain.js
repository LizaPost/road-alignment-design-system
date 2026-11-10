/* ------------------------------------------------------------------------------------------
* Purpose:          terrain rendering and topographic visualization
*
* Description:      this module is responsible for drawing the survey terrain;
*                   it receives terrain data from app.js and converts survey coordinates
*                   in svg coordinates to display on a screen
* Responsibilities:
*                   1. Calculate the survey coordinate boundaries
*                   2. Convert survey x,y coordinates to svg screen coordinates
*                   3. Draw TIN (Triangulated Irregular Network) triangle edges
*                   4. Draw survey points and their elevation labels
*                   5. Draw contour lines and contour elevation labels
*                   6. Create layers:
*                                   - terrainLayer: TIN triangle edges
*                                   - pointLayer: survey points and elevation labels
*                                   - contourLayer: contour lines and their labels
------------------------------------------------------------------------------------------*/

import { TERRAIN, COLORS, STYLES, SVG_NS, CONTOURS, LABELS } from "./config.js";
import { toSvgX, toSvgY } from "./coordinateTransform.js";

export function drawTerrain(points, triangles, contours, showTriangles=false) {

    const terrainLayer = document.getElementById("terrainLayer");
    const contourLayer = document.getElementById("contourLayer");
    const pointLayer = document.getElementById("pointLayer");

    // clears previous terrain drawing
    terrainLayer.innerHTML = "";
    contourLayer.innerHTML = "";
    pointLayer.innerHTML = "";

    // stops if no survey data available
    if (!Array.isArray(points) || points.length === 0) {
        return;
    }

    // calculates survey boundaries
    const xValues = points.map(point => point.x);
    const yValues = points.map(point => point.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // draw TIN in case it's requested
    if (showTriangles && triangles) {
        drawTriangles(triangles, toSvgX, toSvgY);
    }

    // draw survey points
    drawPoints(points, toSvgX, toSvgY);

    // draw contour lines
    drawContours(contours, toSvgX, toSvgY);
}

// draws edges of TIN
function drawTriangles(triangles, convertX, convertY) {

    console.log("drawTriangles called:", triangles.length);

    const layer = document.getElementById("terrainLayer");

    triangles.forEach(triangle => {
        const trianglePoints = [triangle.a, triangle.b, triangle.c];

        for (let i = 0; i < 3; i++) {
            const point1 = trianglePoints[i];
            const point2 = trianglePoints[(i + 1) % 3];
            const line = document.createElementNS(SVG_NS, "line");

            line.setAttribute("x1", convertX(point1.x));
            line.setAttribute("y1", convertY(point1.y));
            line.setAttribute("x2", convertX(point2.x));
            line.setAttribute("y2", convertY(point2.y));
            line.setAttribute("stroke", COLORS.tin);
            line.setAttribute("stroke-width", STYLES.tinLineWidth);

            layer.appendChild(line);
        }
    });
}

// draws survey points and their elevation labels
function drawPoints(points, convertX, convertY) {

    const layer = document.getElementById("pointLayer");

    points.forEach(point => {
        const x = convertX(point.x);
        const y = convertY(point.y);
        const circle = document.createElementNS(SVG_NS, "circle");

        circle.setAttribute("cx", convertX(point.x));
        circle.setAttribute("cy", convertY(point.y));
        circle.setAttribute("r", STYLES.surveyPointRadius);
        circle.setAttribute("fill", COLORS.terrainPoint);

        layer.appendChild(circle);

        // elevation label
        const elevationLabel = document.createElementNS(SVG_NS, "text");

        elevationLabel.setAttribute("x", x + LABELS.surveyOffsetX);
        elevationLabel.setAttribute("y", y - LABELS.surveyOffsetY);
        elevationLabel.setAttribute("font-size", STYLES.surveyLabelFontSize);
        elevationLabel.setAttribute("fill", COLORS.terrainElevationLabel);
        elevationLabel.textContent = Number(point.z).toFixed(2);

        layer.appendChild(elevationLabel);
    });
}

// draws contour polylines and labels every fifth-meter index contour
function drawContours(contours, convertX, convertY) {

    const layer = document.getElementById("contourLayer");

    contours.forEach(contour => {

        if(!contour.points || contour.points.length < 2) {
            return;
        }

        const polyline = document.createElementNS( SVG_NS, "polyline" );
        const screenPoints = contour.points.map(point => ({ x: convertX(point.x), y: convertY(point.y) }));

        // Every 5th contour is an index contour
        const isIndexContour = Math.abs(contour.elevation % CONTOURS.indexInterval) < 0.000001;
        polyline.setAttribute( "points", screenPoints.map(point => `${point.x},${point.y}`).join(" ") );
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", COLORS.contour);
        polyline.setAttribute("stroke-linejoin", "round");
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute( "stroke-width", isIndexContour ? STYLES.indexContourLineWidth : STYLES.contourLineWidth );

        layer.appendChild(polyline);

        // Add elevation label only to index contours
        if (isIndexContour) {

            const contourLabelInfo = getContourLabelInfo( contour, contours, convertX, convertY );

            if (!contourLabelInfo) {
                return;
            }

            const { point, angle } = contourLabelInfo;

            // White background behind the contour label
            const background = document.createElementNS( SVG_NS, "rect" );

            background.setAttribute("x", point.x - LABELS.contourOffsetX);
            background.setAttribute("y", point.y - LABELS.contourOffsetY);
            background.setAttribute("width", LABELS.contourBackgroundWidth);
            background.setAttribute("height", LABELS.contourBackgroundHeight);
            background.setAttribute("fill", COLORS.contourLabelBackground);

            layer.appendChild(background);

            // Contour label
            const contourLabel = document.createElementNS(SVG_NS, "text");

            contourLabel.setAttribute("x", point.x);
            contourLabel.setAttribute("y", point.y + LABELS.contourTextOffsetY);
            contourLabel.setAttribute("text-anchor", "middle");
            contourLabel.setAttribute("font-size", STYLES.contourLabelFontSize);
            contourLabel.setAttribute("fill", COLORS.contour);
            contourLabel.textContent = Number(contour.elevation).toFixed(0);
            contourLabel.setAttribute( "transform", `rotate(${angle} ${point.x} ${point.y})` );

            layer.appendChild(contourLabel);

        }
    });
}

// calculates a label position and rotation for index contours
function getContourLabelInfo(contour, contours, convertX, convertY ) {

    if (!contour.points || contour.points.length < 3) {
        return null;
    }

    // Use the middle point of the contour for the label
    const middleIndex = Math.floor(contour.points.length / 2);

    //
    if (middleIndex === 0 || middleIndex === contour.points.length - 1) {
        return null;
    }

    const contourLabelPoint = contour.points[middleIndex];
    const previousContour = contour.points[middleIndex - 1];
    const nextContour = contour.points[middleIndex + 1];

    // calculate two possible normals to the contour
    const tangentX = nextContour.x - previousContour.x;
    const tangentY = nextContour.y - previousContour.y;

    const normal1X = -tangentY;
    const normal1Y = tangentX;
    const normal2X = tangentY;
    const normal2Y = -tangentX;

    // find the closest contour with different elevation
    // use contour above if one exists, otherwise use the closest contour below
    let referenceContour = null;
    let directionMultiplier = 1;

    let lowerContour = null;
    let higherContour = null;

    let lowerDifference = Infinity;
    let higherDifference = Infinity;

    // Find the closest elevation contour below and above
    contours.forEach(otherContour => {

        if (otherContour === contour) { return; }
        const elevationDifference = otherContour.elevation - contour.elevation;

        // Find nearest higher contour
        if ( elevationDifference > 0 && elevationDifference < higherDifference ) {
            higherDifference = elevationDifference;
            higherContour = otherContour; }

        // Find nearest lower contour
        if ( elevationDifference < 0 && Math.abs(elevationDifference) < lowerDifference ) {
            lowerDifference = Math.abs(elevationDifference);
            lowerContour = otherContour;
        }
    });

    // prefer a higher contour to estimate the uphill direction

    if (higherContour) {
        referenceContour = higherContour;
        directionMultiplier = 1;
    } else if (lowerContour) {
        referenceContour = lowerContour;
        directionMultiplier = -1;
    } else { return null; }

    // find the closest point on the reference contour
    let closestPoint = null;
    let closestDistance = Infinity;

    referenceContour.points.forEach(point => {
        const dx = point.x - contourLabelPoint.x;
        const dy = point.y - contourLabelPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
        }
    });

    if (!closestPoint) { return null; }

    // estimate the uphill direction: from the label point toward the reference contour
    // for a higher contour, this is already uphill.
    // for a lower contour, reverse it because uphill is in the opposite direction.
    let referenceDirectionX = closestPoint.x - contourLabelPoint.x;
    let referenceDirectionY = closestPoint.y - contourLabelPoint.y;
    referenceDirectionX *= directionMultiplier;
    referenceDirectionY *= directionMultiplier;

    // determine which of the two contour normals points toward increasing elevation
    const dotProduct = normal1X * referenceDirectionX + normal1Y * referenceDirectionY;
    let uphillX;
    let uphillY;

    if (dotProduct >= 0) {
        uphillX = normal1X;
        uphillY = normal1Y;
    } else {
        uphillX = normal2X;
        uphillY = normal2Y;
    }

    // convert the uphill direction to screen coordinates
    const screenX = convertX(contourLabelPoint.x);
    const screenY = convertY(contourLabelPoint.y);
    const screenUphillX = convertX(contourLabelPoint.x + uphillX);
    const screenUphillY = convertY(contourLabelPoint.y + uphillY);
    const screenDx = screenUphillX - screenX;
    const screenDy = screenUphillY - screenY;

    // calculate the rotation angle
    // the top of the elevation number points toward increasing terrain elevation
    const angle = Math.atan2(screenDy, screenDx) * 180 / Math.PI + 90 - 10;
    return {
        point: {
            x: screenX,
            y: screenY
        },
        angle: angle
    };
}