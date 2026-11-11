// Use each table's own headings as field labels on small screens.
for (const table of document.querySelectorAll("main .table-wrapper table")) {
    const headers = table.tHead?.rows[0]?.cells;
    if (!headers || headers.length < 4) continue;

    for (const row of table.tBodies[0].rows) {
        for (const cell of row.cells) {
            cell.dataset.label = headers[cell.cellIndex].textContent.trim();
        }
    }
    table.classList.add("comparison-table");
}
