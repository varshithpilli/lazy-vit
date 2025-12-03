let view_attendance_page = () => {

    let table = document.querySelector("table.table");
    if (!table) return;

    let thead = table.querySelector("thead tr");
    let headers = Array.from(thead.children);

    // Find columns by name (case-insensitive)
    function findCol(name) {
        return headers.findIndex(th =>
            th.innerText.trim().toLowerCase().includes(name.toLowerCase())
        );
    }

    let colAttended = findCol("attended");
    let colTotal = findCol("total");
    let colType = findCol("course type");
    let colInsertBefore = findCol("status");

    // Create header only once
    if (!thead.querySelector("th.__attendance_alert")) {
        let alertHeader = document.createElement("th");
        alertHeader.innerText = "75% Attendance Alert";
        alertHeader.classList.add("__attendance_alert");
        alertHeader.style.cssText = headers[colAttended].style.cssText;
        thead.insertBefore(alertHeader, headers[colInsertBefore]);
    }

    // Process body rows
    let bodyRows = table.querySelectorAll("tbody tr");

    bodyRows.forEach(row => {

        // Skip if already inserted
        if (row.querySelector("td.__attendance_alert")) return;

        let cells = Array.from(row.children);

        if (cells.length < colTotal) return;

        let attended = parseFloat(cells[colAttended].innerText.trim());
        let total = parseFloat(cells[colTotal].innerText.trim());
        let type = cells[colType].innerText;

        if (isNaN(attended) || isNaN(total)) return;

        let percentage = attended / total;

        let alertCell = document.createElement("td");
        alertCell.classList.add("__attendance_alert");
        alertCell.style.cssText = cells[colAttended].style.cssText;

        let isLab = type.toLowerCase().includes("lab");
        let ratio = isLab ? 2 : 1;

        if (percentage < 0.7401) {
            let req = Math.ceil((0.7401 * total - attended) / 0.2599);
            req = Math.ceil(req / ratio);

            alertCell.innerHTML = `<p style="margin:0;">-${req}</p>`;
            alertCell.style.background = "rgba(238,75,43,0.7)";

        } else {
            let bunk = Math.floor((attended - 0.7401 * total) / 0.7401);
            bunk = Math.floor(bunk / ratio);
            if (bunk < 0) bunk = 0;

            let color = percentage <= 0.7499
                ? "rgb(255,171,16)"
                : "rgba(170,255,0,0.7)";

            alertCell.innerHTML = `<p style="margin:0;">+${bunk}</p>`;
            alertCell.style.background = color;
        }

        row.insertBefore(alertCell, cells[colInsertBefore]);
    });
};
