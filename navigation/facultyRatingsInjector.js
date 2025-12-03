(function() {
  let facultyRatings = [];

  const PAGE_CONFIGS = {
    attendance: {
      keywords: ['Student Attendance Details', 'Attendance Details'],
      facultyColumns: ['Faculty Name', 'Faculty\n\t\t\t\t\t\t\t\t\t\t\t\t\tName']
    },
    timetable: {
      keywords: ['Time Table', 'Timetable'],
      facultyColumns: ['Faculty Details', 'Faculty\n\t\t\t\t\t\t\t\t\t\t\t\t\tDetails']
    }
  };

  function getRatingColor(rating) {
    if (rating >= 9.0) return '#4CAF50';
    if (rating >= 8.0) return '#8BC34A';
    if (rating >= 7.0) return '#FFC107';
    if (rating >= 6.0) return '#FF9800';
    return '#F44336';
  }

  function normalizeName(name) {
    return name.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function findFacultyRating(cellText) {
    if (!cellText || !facultyRatings.length) return null;
    
    const normalized = normalizeName(cellText);
    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
    
    for (const faculty of facultyRatings) {
      const facultyName = normalizeName(faculty.name);
      const facultyId = faculty.faculty_id.toString();
      
      if (normalized.includes(facultyId) || 
          normalized.includes(facultyName) ||
          lines.some(line => line.includes(facultyName) || line.includes(facultyId))) {
        return faculty;
      }
    }
    return null;
  }

  function findFacultyColumn(headerRow, columnNames) {
    const headers = Array.from(headerRow.querySelectorAll('th, td'));
    return headers.findIndex(th => {
      const text = normalizeName(th.textContent);
      return columnNames.some(col => text.includes(normalizeName(col)));
    });
  }

  function injectRatings() {
    if (!facultyRatings.length) return;

    const h3Text = document.querySelector('h3')?.textContent || '';
    const pageType = Object.entries(PAGE_CONFIGS).find(([_, config]) => 
      config.keywords.some(kw => h3Text.includes(kw))
    )?.[0];

    if (!pageType) return;

    const config = PAGE_CONFIGS[pageType];
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) return;

      const facultyColIdx = findFacultyColumn(rows[0], config.facultyColumns);
      if (facultyColIdx === -1) return;

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length <= facultyColIdx) continue;

        const cell = cells[facultyColIdx];
        if (cell.querySelector('.faculty-rating-badge')) continue;

        const faculty = findFacultyRating(cell.textContent);
        
        const badge = document.createElement('span');
        badge.className = 'faculty-rating-badge';
        badge.style.cssText = `
          margin-left: 8px;
          padding: 2px 6px;
          border-radius: 3px;
          color: white;
          font-weight: bold;
          font-size: 11px;
          white-space: nowrap;
          display: inline-block;
        `;

        if (faculty) {
          badge.textContent = faculty.overall_rating.toFixed(1);
          badge.style.backgroundColor = getRatingColor(faculty.overall_rating);
          badge.title = `Teaching: ${faculty.teaching.toFixed(1)}\nAttendance: ${faculty.attendance_flex.toFixed(1)}\nSupport: ${faculty.supportiveness.toFixed(1)}\nMarks: ${faculty.marks.toFixed(1)}`;
        } else {
          badge.textContent = 'N/A';
          badge.style.backgroundColor = '#9E9E9E';
        }

        cell.appendChild(badge);
      }
    });
  }

  function loadAndInject() {
    chrome.storage.local.get(['facultyRatings'], result => {
      if (result.facultyRatings?.length) {
        facultyRatings = result.facultyRatings;
        setTimeout(injectRatings, 500);
      }
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FACULTY_RATINGS_UPDATED') {
      facultyRatings = request.data || [];
      setTimeout(injectRatings, 500);
      sendResponse({ status: 'received' });
    }
    return true;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadAndInject, 1000));
  } else {
    setTimeout(loadAndInject, 1000);
  }

  const observer = new MutationObserver(() => {
    if (facultyRatings.length) {
      setTimeout(injectRatings, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();