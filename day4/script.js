
// 1. Select the HTML elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// 2. Update the character and word counters
function updateCounts() {
    const text = noteText.value;
    const characters = text.length;

    const trimmedText = text.trim();
    const words = trimmedText === ""
        ? 0
        : trimmedText.split(/\s+/).length;

    charCount.textContent = characters + " / 200 characters";
    wordCount.textContent = words + " words";

    charCount.classList.remove("warning", "over");

    if (characters > 200) {
        charCount.classList.add("over");
    } else if (characters > 180) {
        charCount.classList.add("warning");
    }
}

// 3. Save the draft whenever the user types
noteText.addEventListener("input", function () {
    updateCounts();
    localStorage.setItem("notesDraft", noteText.value);
});

// 4. Clear the note and remove its saved draft
function clearNote() {
    noteText.value = "";
    localStorage.removeItem("notesDraft");
    updateCounts();
}

clearBtn.addEventListener("click", clearNote);

// 5. Clear the note when Escape is pressed
noteText.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        clearNote();
    }
});

// 6. Update the theme button label
function updateThemeButton() {
    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "Light mode";
    } else {
        themeToggle.textContent = "Dark mode";
    }
}

// 7. Toggle the theme and remember the choice
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "notesTheme",
        isDark ? "dark" : "light"
    );

    updateThemeButton();
});

// 8. Restore the saved draft
const savedDraft = localStorage.getItem("notesDraft");

if (savedDraft !== null) {
    noteText.value = savedDraft;
}

// 9. Restore the saved theme
const savedTheme = localStorage.getItem("notesTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

// 10. Initialize the page
updateThemeButton();
updateCounts();
