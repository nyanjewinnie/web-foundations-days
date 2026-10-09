let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];

// 1. Search notes
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

console.log(searchNotes("JavaScript")); // Expected: note with id 4
console.log(searchNotes("pizza")); // Expected: []

// 2. Find the longest note
function longestNote(noteList = notes) {
    if (noteList.length === 0) {
        return null;
    }

    let longest = noteList[0];

    for (let note of noteList) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}

console.log(longestNote()); // Expected: note with id 3
console.log(longestNote([])); // Expected: null

// 3. Count notes by category
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}

console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

let savedNotes = notes;
notes = [];

console.log(countByCategory()); // Expected: {}

notes = savedNotes;

// 4. Create a summary
function getSummary() {
    let counts = countByCategory();
    let total = notes.length;
    let noteWord = total === 1 ? "note" : "notes";

    return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

let savedNotesForSummary = notes;
notes = [];

console.log(getSummary());
// Expected: "0 notes: 0 personal, 0 work, 0 study."

notes = savedNotesForSummary;

// 5. Check for duplicate notes
function isDuplicate(text) {
    return notes.some(note =>
        note.text.trim().toLowerCase() === text.trim().toLowerCase()
    );
}

console.log(isDuplicate("Call mum")); // Expected: true
console.log(isDuplicate("  CALL MUM  ")); // Expected: true
console.log(isDuplicate("Walk the dog")); // Expected: false

// 6. Add a new note
function addNote(text, category) {
    if (typeof text !== "string") {
        console.log("Note rejected: text must be a string.");
        return false;
    }

    let cleanText = text.trim();
    let validCategories = ["personal", "work", "study"];

    if (cleanText.length < 1 || cleanText.length > 200) {
        console.log("Note rejected: text must be 1–200 characters.");
        return false;
    }

    if (isDuplicate(cleanText)) {
        console.log("Note rejected: duplicate note.");
        return false;
    }

    if (!validCategories.includes(category)) {
        console.log("Note rejected: invalid category.");
        return false;
    }

    let newId = notes.length > 0
        ? Math.max(...notes.map(note => note.id)) + 1
        : 1;

    notes.push({
        id: newId,
        text: cleanText,
        category: category
    });

    console.log("Note added successfully.");
    return true;
}

console.log(addNote("Walk the dog", "personal"));
// Expected: true

console.log(addNote("Walk the dog", "personal"));
// Expected: false (duplicate)

console.log(addNote("", "work"));
// Expected: false (empty text)

console.log(addNote("Study JavaScript", "invalid"));
// Expected: false (invalid category)

console.log(addNote("Read a book", "study"));
// Expected: true

console.log(addNote("   ", "personal"));
// Expected: false (blank text)