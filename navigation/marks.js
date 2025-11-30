let modify_marks_page = () => {
    const blue_header = document.querySelector(".tableHeader");
    if (blue_header) {
        const blue_header_elements = Array.from(blue_header.querySelectorAll("td"));
        [0, 1, 5, 8].forEach(idx => {
            if (blue_header_elements[idx]) blue_header_elements[idx].style.display = "none";
        });
    }

    const all_outer_rows = Array.from(document.querySelectorAll(".tableContent"));
    all_outer_rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll(":scope > td"));
        if (cells.length && cells[0].hasAttribute("colspan")) return;
        [0, 1, 5, 8].forEach(idx => {
            if (cells[idx]) cells[idx].style.display = "none";
        });
    });

    const useful_tables = Array.from(document.querySelectorAll(".customTable-level1 > tbody"));

    useful_tables.forEach(tbody => {
        const header = tbody.querySelector(".tableHeader-level1");
        if (header) {
            const hdrCells = Array.from(header.querySelectorAll("td"));
            [0, 4, 7, 8, 9].forEach(idx => {
                if (hdrCells[idx]) hdrCells[idx].style.display = "none";
            });
        }

        let tot_max_marks = 0;
        let tot_weightage_percent = 0;
        let tot_scored = 0;
        let tot_weightage_equi = 0;

        const rows = Array.from(tbody.querySelectorAll(".tableContent-level1"));
        rows.forEach(row => {
            if (row.style.background && row.style.background !== "") return;

            const cells = Array.from(row.querySelectorAll("td, output"));

            [0, 4, 7, 8, 9].forEach(idx => {
                const td = row.querySelector(`td:nth-child(${idx + 1})`);
                if (td) td.style.display = "none";
            });

            const getNum = (el) => {
                const txt = (el?.textContent || "").replace(/[^0-9.]+/g, "");
                return txt ? parseFloat(txt) : 0;
            };

            const maxMarks = getNum(cells[4]);
            const weightagePercent = getNum(cells[6]);

            const scoredMark = getNum(cells[10]);
            const weightageEqui = getNum(cells[12]);

            tot_max_marks += maxMarks;
            tot_weightage_percent += weightagePercent;
            tot_scored += scoredMark;
            tot_weightage_equi += weightageEqui;
        });

        const totalsRow = document.createElement("tr");
        totalsRow.className = "tableContent-level1";
        totalsRow.style.background = "rgba(60,141,188,0.8)";
        totalsRow.innerHTML = `
      <td style="display:none;"></td>
      <td><b>Total:</b></td>
      <td><b></b></td>
      <td><b>${tot_weightage_percent.toFixed(2)}</b></td>
      <td style="display:none;"></td>
      <td style="display:none;"></td>
      <td><b></b></td>
      <td><b>${tot_weightage_equi.toFixed(2)}</b></td>
      <td style="display:none;"></td>
      <td style="display:none;"></td>
      <td style="display:none;"></td>
    `;
        tbody.appendChild(totalsRow);
    });
};