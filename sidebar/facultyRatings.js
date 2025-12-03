let facultyRatingsData = [];

function getRatingColor(rating) {
  if (rating >= 9.0) return '#4CAF50';
  if (rating >= 8.0) return '#8BC34A';
  if (rating >= 7.0) return '#FFC107';
  if (rating >= 6.0) return '#FF9800';
  return '#F44336';
}

function createRatingBar(rating) {
  const container = document.createElement('div');
  container.className = 'rating-bar-container';
  
  const bar = document.createElement('div');
  bar.className = 'rating-bar';
  bar.style.width = `${rating * 10}%`;
  bar.style.backgroundColor = getRatingColor(rating);
  
  container.appendChild(bar);
  return container;
}

function displayRatings() {
  const list = document.getElementById('ratingsList');
  
  if (!facultyRatingsData.length) {
    list.innerHTML = '<div class="no-ratings">No ratings imported yet.</div>';
    return;
  }
  
  const sorted = [...facultyRatingsData].sort((a, b) => a.overall_rating - b.overall_rating);
  list.innerHTML = '';
  
  sorted.forEach(faculty => {
    const item = document.createElement('div');
    item.className = 'rating-item';
    item.innerHTML = `
      <div class="faculty-header">
        <div class="faculty-info">
          <div class="faculty-name">${faculty.name}</div>
          <div class="faculty-id">${faculty.faculty_id}</div>
        </div>
        <div class="rating-value" style="background-color: ${getRatingColor(faculty.overall_rating)}">
          ${faculty.overall_rating.toFixed(1)}
        </div>
      </div>
      <div class="rating-details">
        <div class="rating-row">
          <div class="rating-label-row">
            <span class="rating-label">Teaching:</span>
            <span class="rating-value-display">${faculty.teaching.toFixed(1)}</span>
          </div>
        </div>
        <div class="rating-row">
          <div class="rating-label-row">
            <span class="rating-label">Attendance:</span>
            <span class="rating-value-display">${faculty.attendance_flex.toFixed(1)}</span>
          </div>
        </div>
        <div class="rating-row">
          <div class="rating-label-row">
            <span class="rating-label">Support:</span>
            <span class="rating-value-display">${faculty.supportiveness.toFixed(1)}</span>
          </div>
        </div>
        <div class="rating-row">
          <div class="rating-label-row">
            <span class="rating-label">Marks:</span>
            <span class="rating-value-display">${faculty.marks.toFixed(1)}</span>
          </div>
        </div>
        <div class="rating-row">
          <div class="rating-label-row">
            <span class="rating-label">Total Ratings:</span>
            <span class="rating-value-display">${faculty.total_ratings}</span>
          </div>
        </div>
      </div>
      <div class="last-updated">Updated: ${faculty.last_updated}</div>
    `;
    list.appendChild(item);
  });
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        facultyRatingsData = data;
        chrome.storage.local.set({ facultyRatings: data }, () => {
          displayRatings();
          chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                type: 'FACULTY_RATINGS_UPDATED',
                data: data
              }).catch(() => {});
            });
          });
        });
      } else {
        alert('Invalid JSON format.');
      }
    } catch (error) {
      alert('Error parsing JSON: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function loadRatings() {
  chrome.storage.local.get(['facultyRatings'], result => {
    if (result.facultyRatings) {
      facultyRatingsData = result.facultyRatings;
      displayRatings();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRatings();
  
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  
  document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files.length) importFile(e.target.files[0]);
  });
  
  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'sidebar.html';
  });
});