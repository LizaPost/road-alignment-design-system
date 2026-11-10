/* ------------------------------------------------------------------------------------------
Stores shared application settings and constants
- defines API and SVG configuration
- defines terrain and profile dimensions
- stores colors and drawing styles
- stores contour, label, profile-table settings
------------------------------------------------------------------------------------------*/

export const SVG_NS = "http://www.w3.org/2000/svg";

/* --------------------------------- API configuration ----------------------------------- */

export const API_BASE_URL = "http://localhost:8080/api";

/* ---------------------------------------- colors --------------------------------------- */

export const COLORS = {

    // coordinate grid
    coordinateGrid: "#FFFFFF",
    coordinateGridCross: "#267348",

    // survey terrain
    terrainPoint: "#263b31",
    terrainElevationLabel: "#333333",

    // Triangulated Irregular Network (TIN)
    tin: "#999999",

    // contour lines and labels
    contour: "#8B6F47",
    contourLabel: "#8B6F47",
    contourLabelBackground: "#FFFFFF",

    // selected project points
    startPoint: "#176b4d",
    endPoint: "#c0392b",

    // project points markers
    endpointStartMarker: "#176b4d",
    endpointEndMarker: "#8B6F47",
    endpointMarkerStroke: "#ffffff",

    // longitudinal profile
    terrainProfile: "#8B6F47",
    designProfile: "#176b4d",
    profileGrid: "#d7e2dc",
    profileAxis: "#52645a",
    profileBackground: "#ffffff",

    // profile table
    profileTableHeader: "#e7f1ec",
    profileTableBorder: "#cbd9d1",
    profileTableText: "#34483d",
    profileTableBackground: "#ffffff",

    // grid and axes
    grid: "#d9e2dc",
    stationGrid: "#e8eee9",
    axis: "#52635a",
    axisTitle: "#263b31",

    // road alignment alternatives
    alignments: ["#e63946", "#457b9d", "#f4a261", "#9b5de5", "#2a9d8f"]
};

/* ---------------------------------- coordinate grid ----------------------------------- */

export const GRID = {
    spacing: 250,
    crossSize: 5,
    lineWidth: 0.1,
    crossWidth: 0.8
};

/* ------------------------------ terrain plan dimensions ------------------------------- */

export const TERRAIN = {
    width: 800,
    height: 600,
    padding: 50,
    margin: 0.15
};

/* --------------------------- longitudinal profile dimensions -------------------------- */

export const PROFILE_CONFIG = {
    width: 1100,
    height: 300,
    totalHeight: 526,

    margin: {
        left: 145,
        right: 35,
        top: 42,
        bottom: 40
    },

    colors: {
        terrain: COLORS.terrainProfile,
        design: COLORS.designProfile,
        grid: COLORS.profileGrid,
        axis: COLORS.profileAxis,
        background: COLORS.profileBackground
    },

    stationInterval: 100,
    elevationGridSteps: 5,

    legend: {
        x: 260,
        y: 17,
        lineLength: 20,
        terrainLabelOffsetX: 26,
        designLineOffsetX: 150,
        designLabelOffsetX: 176
    }
};

export const PROFILE = {
    width: PROFILE_CONFIG.width,
    height: PROFILE_CONFIG.height,

    left: PROFILE_CONFIG.margin.left,
    right: PROFILE_CONFIG.margin.right,
    top: PROFILE_CONFIG.margin.top,
    bottom: PROFILE_CONFIG.margin.bottom,

    horizontalGridDivisions: 4,
    verticalGridDivision: 4,

    stationInterval: PROFILE_CONFIG.stationInterval,
    elevationGridSteps: PROFILE_CONFIG.elevationGridSteps,

    background: PROFILE_CONFIG.colors.background
};

export const PROFILE_TABLE = {
    top: 302,
    rowHeight: 34,
    rowCount: 6,

    stationInterval: PROFILE_CONFIG.stationInterval,
    stationTolerance: 1e-9,

    labelLeft: 8,
    labelGap: 8,
    labelPadding: 8,

    valueOffset: 5,
    minimumTextGap: 50,

    headerFontSize: 10,
    valueFontSize: 9,

    colors: {
        header: COLORS.profileTableHeader,
        border: COLORS.profileTableBorder,
        text: COLORS.profileTableText,
        background: COLORS.profileTableBackground,
        terrain: COLORS.terrainProfile,
        design: COLORS.designProfile,
        stationLine: "#c5d4ca",
        cut: "#b4533c",
        fill: "#176b4d"
    }
};

/* ----------------------------------- drawing styles ------------------------------------ */

export const STYLES = {

    // TIN
    tinLineWidth: 1,

    // survey points
    surveyPointRadius: 1,
    selectedPointRadius: 5,
    selectedPointBorderWidth: 2,

    // endpoint markers
    endpointMarkerRadius: 7,
    endpointMarkerBorderWidth: 2,
    endpointMarkerLabelOffsetY: 12,

    // contours
    contourLineWidth: 1,
    indexContourLineWidth: 2,

    // profile lines
    alignmentLineWidth: 2.5,
    profileLineWidth: 2.5,
    terrainProfileLineWidth: 2,

    profileGridWidth: 1,
    profileAxisWidth: 1.2,
    terrainProfileWidth: 2,
    designProfileWidth: 2.5,

    // profile axes and labels
    profileAxisLineWidth: 1.2,
    profileAxisLabelFontSize: 10,
    profileAxisTitleFontSize: 11,
    profileLegendFontSize: 10,

    // profile table
    profileTableBorderWidth: 0.8,
    profileTableHeaderFontWeight: "600",

    // text sizes
    surveyLabelFontSize: 5,
    contourLabelFontSize: 5,
    axisLabelFontSize: 11,
    axisTitleFontSize: 12,
    selectedPointLabelFontSize: 5
};

/* ---------------------------------- contour settings ----------------------------------- */

export const CONTOURS = {
    interval: 1,
    indexInterval: 5
};

/* --------------------------------- label positioning ----------------------------------- */

export const LABELS = {

    // survey elevation labels
    surveyOffsetX: 5,
    surveyOffsetY: -5,

    // index contour label background
    contourOffsetX: 15,
    contourOffsetY: -10,
    contourBackgroundWidth: 32,
    contourBackgroundHeight: 18,

    // position of the contour text relative to its center
    contourTextOffsetY: 4
}



