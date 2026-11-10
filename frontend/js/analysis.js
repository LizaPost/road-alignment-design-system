/* ------------------------------------------------------------------------------------------
* Purpose:          display road alignment analysis results
*
* Description:      this module creates the Alternative Analysis section
*                   to represent metrics calculated and returned by backend
*
* Responsibilities:
*                   1. Display the selected alternative's ID
*                   2. Show alignment length
*                   3. Show maximum longitudinal grade
*                   4. Show estimated cut volume
*                   5. Show estimated fill volume
*                   6. Show the net cut/fill volume
*
------------------------------------------------------------------------------------------*/

export function displayAlternativeResults(alternatives) {

    const container = document.getElementById("alternativeResults");

    // clear previous analysis
    container.innerHTML = "";

    if (!alternatives || alternatives.length === 0) {

        container.textContent = "No alternatives selected.";
        return;
    }

    alternatives.forEach(alternative => {
        const heading = document.createElement("h3");
        heading.textContent = alternative.id;

        const details = document.createElement("div");
        details.className = "result-details";

        const earthwork = alternative.earthwork;

        // metrics for display
        const values = [
            ["Alignment length: ", `${alternative.length.toFixed(2)} m`],
            ["Road width: ", `${alternative.roadWidth.toFixed(2)} m`],
            ["Maximum grade: ", `${alternative.maximumGrade.toFixed(2)}%`],
            ["Cut volume: ", `${earthwork.cutVolume.toFixed(2)} m³`],
            ["Fill volume: ", `${earthwork.fillVolume.toFixed(2)} m³`],
            ["Net cut/fill: ", `${earthwork.netVolume.toFixed(2)} m³`]
        ];

        values.forEach(([label, value]) => {

            const row = document.createElement("p");
            const name = document.createElement("span");
            const result = document.createElement("strong");

            name.textContent = label;
            result.textContent = value;

            row.append(name, result);
            details.appendChild(row);
        });

        container.append(heading, details);
    });
}

// formats a numeric value to two decimal places
// if backend has not supplied a value, display "N/A" instead of throwing error or NaN
function formatNumber(value, unit) {

    const number = Number(value);

    if (value === null || value === undefined || !Number.isFinite(number)) {
        return "N/A";
    }
}