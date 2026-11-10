/*--------------------------------------------------------------------------------
Purpose:          Zooming and panning in the Terrain Plan.

Description:      Applies navigation transformations to the shared SVG viewport,
                  keeping terrain, contours, points, and road alignments together.

Responsibilities:
                  1. Zoom in and out using toolbar buttons.
                  2. Zoom toward the mouse cursor using the mouse wheel.
                  3. Pan the terrain by dragging.
                  4. Reset the view using Fit to View.
--------------------------------------------------------------------------------*/

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 1.2;

export function setupTerrainViewport() {
    const svg = document.getElementById("terrainSvg");
    const viewport = document.getElementById("viewport");

    const zoomInButton = document.getElementById("zoomInButton");
    const zoomOutButton = document.getElementById("zoomOutButton");
    const fitButton = document.getElementById("fitTerrainButton");

    if (!svg || !viewport) {
        console.error("Terrain SVG or viewport group was not found.");
        return;
    }

    // Current navigation state.
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    // Drag state.
    let isDragging = false;
    let dragMoved = false;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;

    // Convert browser mouse coordinates to SVG coordinates.
    function getSvgPosition(event) {
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        return point.matrixTransform(svg.getScreenCTM().inverse());
    }

    // Update the shared viewport transformation.
    function updateViewport() {
        viewport.setAttribute(
            "transform",
            `translate(${translateX} ${translateY}) scale(${scale})`
        );
    }

    // Zoom around a specific SVG position.
    function zoomAt(position, factor) {
        const newScale = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, scale * factor)
        );

        // Do nothing if the zoom limit has been reached.
        if (newScale === scale) {
            return;
        }

        // Keep the position under the cursor stationary.
        const ratio = newScale / scale;

        translateX = position.x - (position.x - translateX) * ratio;
        translateY = position.y - (position.y - translateY) * ratio;

        scale = newScale;
        updateViewport();
    }

    // Zoom buttons use the center of the visible SVG.
    function zoomAtCenter(factor) {
        const bounds = svg.viewBox.baseVal;

        zoomAt(
            {
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
            },
            factor
        );
    }

    zoomInButton?.addEventListener("click", () => {
        zoomAtCenter(ZOOM_FACTOR);
    });

    zoomOutButton?.addEventListener("click", () => {
        zoomAtCenter(1 / ZOOM_FACTOR);
    });

    // Reset to the original full-survey view.
    fitButton?.addEventListener("click", () => {
        scale = 1;
        translateX = 0;
        translateY = 0;

        updateViewport();
    });

    // Zoom toward the pointer position.
    svg.addEventListener("wheel", event => {
        event.preventDefault();

        const position = getSvgPosition(event);
        const factor = event.deltaY < 0
            ? ZOOM_FACTOR
            : 1 / ZOOM_FACTOR;

        zoomAt(position, factor);
    }, { passive: false });

    // Start panning when the user presses the mouse button.
    svg.addEventListener("pointerdown", event => {
        if (event.button !== 0) {
            return;
        }

        const position = getSvgPosition(event);

        isDragging = true;
        dragMoved = false;

        startX = position.x;
        startY = position.y;

        originalX = translateX;
        originalY = translateY;

        svg.dataset.panMoved = "false";
        svg.setPointerCapture(event.pointerId);
    });

    // Move the viewport while dragging.
    svg.addEventListener("pointermove", event => {
        if (!isDragging) {
            return;
        }

        const position = getSvgPosition(event);
        const dx = position.x - startX;
        const dy = position.y - startY;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            dragMoved = true;
        }

        translateX = originalX + dx;
        translateY = originalY + dy;

        updateViewport();
    });

    // End panning.
    function stopDragging() {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        // Let app.js distinguish a drag from a normal click.
        svg.dataset.panMoved = String(dragMoved);

        svg.style.cursor = "grab";
    }

    svg.addEventListener("pointerup", stopDragging);
    svg.addEventListener("pointercancel", stopDragging);

    svg.addEventListener("pointerleave", () => {
        if (!isDragging) {
            svg.style.cursor = "grab";
        }
    });

    svg.style.cursor = "grab";
}