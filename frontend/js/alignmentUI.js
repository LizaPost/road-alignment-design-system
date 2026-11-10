/* ------------------------------------------------------------------------------------------
Manages alignment alternative selector
- initializes the alternative dropdown
- populates it with generated alternatives
------------------------------------------------------------------------------------------*/

import { getAlignmentColor } from "./alignment.js";

/* ------------------------------------- DOM elements ------------------------------------- */

let alternativeSelect = null;
let dropdown = null;
let dropdownTrigger = null;
let dropdownValue = null;
let dropdownMenu = null;
let selectedAlternativeColor = null;

let selectionCallback = () => {};

/* -------------------------------- Initialization ---------------------------------------- */

export function initializeAlternativeSelector(onSelectionChange) {
    alternativeSelect = document.getElementById("alternativeSelect");
    dropdown = document.getElementById("alternativeDropdown");
    dropdownTrigger = document.getElementById("alternativeDropdownTrigger");
    dropdownValue = document.getElementById("alternativeDropdownValue");
    dropdownMenu = document.getElementById("alternativeDropdownMenu");
    selectedAlternativeColor = document.getElementById("selectedAlternativeColor");

    selectionCallback = onSelectionChange || (() => {});

    if (!alternativeSelect || !dropdownTrigger || !dropdownMenu || !dropdownValue) {
        console.warn("Alternative selector elements were not found.");
        return;
    }

    alternativeSelect.addEventListener("change", handleNativeSelectionChange);
    dropdownTrigger.addEventListener("click", toggleDropdown);

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    updateSelectedDisplay();
}

/* ------------------------------- Populate alternatives ---------------------------------- */

export function populateAlternativeSelect(alternatives) {
    if (!alternativeSelect || !dropdownMenu) {
        return null;
    }

    alternativeSelect.replaceChildren();
    dropdownMenu.replaceChildren();

    closeDropdown();

    if (!Array.isArray(alternatives) || alternatives.length === 0) {
        updateSelectedDisplay();
        return null;
    }

    alternatives.forEach((alternative, index) => {
        const alternativeId = String(alternative.id);
        const alternativeName = alternative.id || `Alternative ${index + 1}`;
        const color = getAlignmentColor(index);

        addNativeOption(alternativeId, alternativeName, color);
        addDropdownOption(alternativeId, alternativeName, color);
    });

    alternativeSelect.selectedIndex = 0;

    updateSelectedDisplay();

    return alternativeSelect.value;
}

/* -------------------------------- Native select option ---------------------------------- */

function addNativeOption(id, name, color) {
    const option = document.createElement("option");

    option.value = id;
    option.textContent = name;
    option.style.color = color;

    alternativeSelect.appendChild(option);
}

/* -------------------------------- Custom dropdown option ------------------------------- */

function addDropdownOption(id, name, color) {
    const option = document.createElement("button");

    option.type = "button";
    option.className = "custom-select-option";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.alternativeId = id;

    const colorLine = document.createElement("span");
    colorLine.className = "alternative-color-line";
    colorLine.style.backgroundColor = color;

    const label = document.createElement("span");
    label.textContent = name;

    option.append(colorLine, label);

    option.addEventListener("click", () => {
        selectAlternative(id);
    });

    dropdownMenu.appendChild(option);
}

/* ----------------------------------- Selection ------------------------------------------ */

function selectAlternative(alternativeId) {
    if (!alternativeSelect) {
        return;
    }

    alternativeSelect.value = alternativeId;

    if (alternativeSelect.value !== alternativeId) {
        return;
    }

    updateSelectedDisplay();
    closeDropdown();

    alternativeSelect.dispatchEvent(
        new Event("change", { bubbles: true })
    );
}

function handleNativeSelectionChange() {
    updateSelectedDisplay();
    selectionCallback();
}

/* ------------------------------- Selected alternative display -------------------------- */

function updateSelectedDisplay() {
    if (!alternativeSelect || !dropdownValue || !dropdownMenu) {
        return;
    }

    const selectedOption = alternativeSelect.selectedOptions[0];

    if (!selectedOption) {
        dropdownValue.textContent = "Select an alternative";

        if (selectedAlternativeColor) {
            selectedAlternativeColor.style.backgroundColor = "transparent";
        }

        dropdownMenu.querySelectorAll(".custom-select-option").forEach(option => {
            option.setAttribute("aria-selected", "false");
        });

        return;
    }

    dropdownValue.textContent = selectedOption.textContent;

    if (selectedAlternativeColor) {
        selectedAlternativeColor.style.backgroundColor =
            selectedOption.style.color || "transparent";
    }

    dropdownMenu.querySelectorAll(".custom-select-option").forEach(option => {
        const isSelected =
            option.dataset.alternativeId === alternativeSelect.value;

        option.setAttribute("aria-selected", String(isSelected));
    });
}

/* -------------------------------- Dropdown visibility ----------------------------------- */

function toggleDropdown() {
    if (!dropdownMenu || !dropdownTrigger) {
        return;
    }

    const isOpen = !dropdownMenu.hidden;

    if (isOpen) {
        closeDropdown();
    } else {
        openDropdown();
    }
}

function openDropdown() {
    if (!dropdownMenu || !dropdownTrigger) {
        return;
    }

    dropdownMenu.hidden = false;
    dropdownTrigger.setAttribute("aria-expanded", "true");
}

function closeDropdown() {
    if (!dropdownMenu || !dropdownTrigger) {
        return;
    }

    dropdownMenu.hidden = true;
    dropdownTrigger.setAttribute("aria-expanded", "false");
}

function handleOutsideClick(event) {
    if (dropdown && !dropdown.contains(event.target)) {
        closeDropdown();
    }
}

function handleKeyDown(event) {
    if (event.key === "Escape") {
        closeDropdown();
        dropdownTrigger?.focus();
    }
}

/* -------------------------------- Clear selection --------------------------------------- */

export function clearAlternativeSelector() {
    if (alternativeSelect) {
        alternativeSelect.replaceChildren();
    }

    if (dropdownMenu) {
        dropdownMenu.replaceChildren();
    }

    closeDropdown();
    updateSelectedDisplay();
}

/* -------------------------------- Get selected ID --------------------------------------- */

export function getSelectedAlternativeId() {
    if (!alternativeSelect || !alternativeSelect.value) {
        return null;
    }

    return alternativeSelect.value;
}
