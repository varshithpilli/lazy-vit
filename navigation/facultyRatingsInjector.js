(function () {
  let facultyRatings = [];

  function normalize(str) {
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function getRatingColor(r) {
    if (r >= 9) return '#4CAF50';
    if (r >= 8) return '#8BC34A';
    if (r >= 7) return '#FFC107';
    if (r >= 6) return '#FF9800';
    return '#F44336';
  }

  function createBadge(faculty) {
    const badge = document.createElement('span');
    badge.className = "faculty-rating-badge";
    badge.style.cssText = `
      margin-left: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      font-size: 11px;
      display: inline-block;
      white-space: nowrap;
    `;

    if (!faculty) {
      badge.textContent = "N/A";
      badge.style.backgroundColor = "#9E9E9E";
      return badge;
    }

    badge.textContent = `${faculty.overall_rating.toFixed(1)} ⭐`;
    badge.style.backgroundColor = getRatingColor(faculty.overall_rating);

    badge.title =
      `${faculty.name}\n` +
      `Teaching: ${faculty.teaching}\n` +
      `Attendance: ${faculty.attendance_flex}\n` +
      `Support: ${faculty.supportiveness}\n` +
      `Marks: ${faculty.marks}`;

    return badge;
  }

  //------------------------------------------------------------------
  //  ATTENDANCE MATCHING (ID first → fallback name)
  //------------------------------------------------------------------
  function findFacultyAttendance(text) {
    const n = normalize(text);

    // 1. Exact ID match
    for (const f of facultyRatings) {
      if (n.includes(String(f.faculty_id))) return f;
    }

    // 2. Exact name match
    for (const f of facultyRatings) {
      if (normalize(f.name) === n) return f;
      if (n.includes(normalize(f.name))) return f;
    }

    return null;
  }

  //------------------------------------------------------------------
  //  TIMETABLE MATCHING (EXACT name only)
  //------------------------------------------------------------------
  function cleanTimetableName(text) {
    return normalize(text.split('-')[0]); // remove "- SCOPE"
  }

  function findFacultyTimetable(text) {
    const cleaned = cleanTimetableName(text);

    for (const f of facultyRatings) {
      if (normalize(f.name) === cleaned) return f;
    }

    return null;
  }

  //------------------------------------------------------------------
  //  COMMON COLUMN FINDER
  //------------------------------------------------------------------
  function findFacultyColumn(row) {
    const cells = Array.from(row.querySelectorAll("th,td"));

    for (let i = 0; i < cells.length; i++) {
      if (normalize(cells[i].textContent).includes("faculty")) {
        return i;
      }
    }
    return -1;
  }

  //------------------------------------------------------------------
  //  INJECT INTO TIMETABLE PAGE
  //------------------------------------------------------------------
  function injectTimetable() {
    const tables = document.querySelectorAll("table.table");

    if (!tables.length) return;

    const table = tables[0]; // first big table
    const rows = table.querySelectorAll("tr");
    if (rows.length < 2) return;

    const facultyCol = findFacultyColumn(rows[0]);
    if (facultyCol === -1) return;

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");
      const cell = cells[facultyCol];

      if (!cell) continue;
      if (cell.querySelector(".faculty-rating-badge")) continue;

      const text = cell.innerText.trim();
      const faculty = findFacultyTimetable(text);

      cell.appendChild(createBadge(faculty));
    }
  }

  //------------------------------------------------------------------
  //  INJECT ON ATTENDANCE PAGE
  //------------------------------------------------------------------
  function injectAttendance() {
    const tables = document.querySelectorAll("table");

    tables.forEach(table => {
      const rows = table.querySelectorAll("tr");
      if (rows.length < 2) return;

      const facultyCol = findFacultyColumn(rows[0]);
      if (facultyCol === -1) return;

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        const cell = cells[facultyCol];

        if (!cell) continue;
        if (cell.querySelector(".faculty-rating-badge")) continue;

        const faculty = findFacultyAttendance(cell.innerText);
        cell.appendChild(createBadge(faculty));
      }
    });
  }

  //------------------------------------------------------------------
  // PAGE DETECTION
  //------------------------------------------------------------------
  function detectPage() {
    const text = document.body.innerText.toLowerCase();

    if (text.includes("attendance date") || text.includes("student attendance")) {
      return "attendance";
    }
    if (text.includes("time table") || text.includes("timetable")) {
      return "timetable";
    }
    return null;
  }

  //------------------------------------------------------------------
  //  MAIN INJECTION
  //------------------------------------------------------------------
  function tryInject() {
    if (!facultyRatings.length) return;

    const page = detectPage();
    if (!page) return;

    if (page === "timetable") injectTimetable();
    if (page === "attendance") injectAttendance();
  }

  //------------------------------------------------------------------
  //  LOAD FROM STORAGE + OBSERVER
  //------------------------------------------------------------------
  function load() {
    chrome.storage.local.get(["facultyRatings"], res => {
      facultyRatings = res.facultyRatings || [];
      setTimeout(tryInject, 800);
    });
  }

  chrome.runtime.onMessage.addListener((req) => {
    if (req.type === "FACULTY_RATINGS_UPDATED") {
      facultyRatings = req.data || [];
      setTimeout(tryInject, 400);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(load, 500));
  } else {
    setTimeout(load, 500);
  }

  // Observe AJAX content
  new MutationObserver(() => {
    setTimeout(tryInject, 400);
  }).observe(document.body, { childList: true, subtree: true });

})();
