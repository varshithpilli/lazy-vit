let facultyRatingsData = [];

// Get color based on rating value (scale of 10)
function getRatingColor(rating) {
  if (rating >= 9.0) return '#4CAF50';
  if (rating >= 8.0) return '#8BC34A';
  if (rating >= 7.0) return '#FFC107';
  if (rating >= 6.0) return '#FF9800';
  return '#F44336';
}

// Create a progress bar for rating (scale of 10)
function createRatingBar(rating) {
  const barContainer = document.createElement('div');
  barContainer.className = 'rating-bar-container';
  
  const bar = document.createElement('div');
  bar.className = 'rating-bar';
  bar.style.width = `${rating * 10}%`;
  bar.style.backgroundColor = getRatingColor(rating);
  
  barContainer.appendChild(bar);
  return barContainer;
}

// Display ratings sorted by overall rating (lowest to highest)
function displayRatings() {
  const ratingsList = document.getElementById('ratingsList');
  
  if (facultyRatingsData.length === 0) {
    ratingsList.innerHTML = '<div class="no-ratings">No ratings imported yet. Please import a JSON file.</div>';
    return;
  }
  
  // Sort ratings by overall rating (ascending order)
  const sortedRatings = [...facultyRatingsData].sort((a, b) => a.overall_rating - b.overall_rating);
  
  // Clear the list
  ratingsList.innerHTML = '';
  
  // Add each rating to the list
  sortedRatings.forEach(faculty => {
    const ratingItem = document.createElement('div');
    ratingItem.className = 'rating-item';
    
    // Faculty header with name and ID
    const facultyHeader = document.createElement('div');
    facultyHeader.className = 'faculty-header';
    
    const facultyInfo = document.createElement('div');
    facultyInfo.className = 'faculty-info';
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'faculty-name';
    nameSpan.textContent = faculty.name;
    
    const idSpan = document.createElement('div');
    idSpan.className = 'faculty-id';
    idSpan.textContent = faculty.faculty_id;
    
    facultyInfo.appendChild(nameSpan);
    facultyInfo.appendChild(idSpan);
    
    const ratingValue = document.createElement('div');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = faculty.overall_rating.toFixed(1);
    ratingValue.style.backgroundColor = getRatingColor(faculty.overall_rating);
    
    facultyHeader.appendChild(facultyInfo);
    facultyHeader.appendChild(ratingValue);
    
    // Rating details
    const ratingDetails = document.createElement('div');
    ratingDetails.className = 'rating-details';
    
    // Teaching quality
    const teachingRow = document.createElement('div');
    teachingRow.className = 'rating-row';
    const teachingLabelRow = document.createElement('div');
    teachingLabelRow.className = 'rating-label-row';
    const teachingLabel = document.createElement('span');
    teachingLabel.className = 'rating-label';
    teachingLabel.textContent = 'Teaching:';
    const teachingValue = document.createElement('span');
    teachingValue.className = 'rating-value-display';
    teachingValue.textContent = faculty.teaching.toFixed(1);
    teachingLabelRow.appendChild(teachingLabel);
    teachingLabelRow.appendChild(teachingValue);
    teachingRow.appendChild(teachingLabelRow);
    teachingRow.appendChild(createRatingBar(faculty.teaching));
    ratingDetails.appendChild(teachingRow);
    
    // Attendance flexibility
    const attendanceRow = document.createElement('div');
    attendanceRow.className = 'rating-row';
    const attendanceLabelRow = document.createElement('div');
    attendanceLabelRow.className = 'rating-label-row';
    const attendanceLabel = document.createElement('span');
    attendanceLabel.className = 'rating-label';
    attendanceLabel.textContent = 'Attendance:';
    const attendanceValue = document.createElement('span');
    attendanceValue.className = 'rating-value-display';
    attendanceValue.textContent = faculty.attendance_flex.toFixed(1);
    attendanceLabelRow.appendChild(attendanceLabel);
    attendanceLabelRow.appendChild(attendanceValue);
    attendanceRow.appendChild(attendanceLabelRow);
    attendanceRow.appendChild(createRatingBar(faculty.attendance_flex));
    ratingDetails.appendChild(attendanceRow);
    
    // Supportiveness
    const supportRow = document.createElement('div');
    supportRow.className = 'rating-row';
    const supportLabelRow = document.createElement('div');
    supportLabelRow.className = 'rating-label-row';
    const supportLabel = document.createElement('span');
    supportLabel.className = 'rating-label';
    supportLabel.textContent = 'Support:';
    const supportValue = document.createElement('span');
    supportValue.className = 'rating-value-display';
    supportValue.textContent = faculty.supportiveness.toFixed(1);
    supportLabelRow.appendChild(supportLabel);
    supportLabelRow.appendChild(supportValue);
    supportRow.appendChild(supportLabelRow);
    supportRow.appendChild(createRatingBar(faculty.supportiveness));
    ratingDetails.appendChild(supportRow);
    
    // Marks distribution
    const marksRow = document.createElement('div');
    marksRow.className = 'rating-row';
    const marksLabelRow = document.createElement('div');
    marksLabelRow.className = 'rating-label-row';
    const marksLabel = document.createElement('span');
    marksLabel.className = 'rating-label';
    marksLabel.textContent = 'Marks:';
    const marksValue = document.createElement('span');
    marksValue.className = 'rating-value-display';
    marksValue.textContent = faculty.marks.toFixed(1);
    marksLabelRow.appendChild(marksLabel);
    marksLabelRow.appendChild(marksValue);
    marksRow.appendChild(marksLabelRow);
    marksRow.appendChild(createRatingBar(faculty.marks));
    ratingDetails.appendChild(marksRow);
    
    // Total ratings
    const totalRow = document.createElement('div');
    totalRow.className = 'rating-row';
    const totalLabelRow = document.createElement('div');
    totalLabelRow.className = 'rating-label-row';
    const totalLabel = document.createElement('span');
    totalLabel.className = 'rating-label';
    totalLabel.textContent = 'Total Ratings:';
    const totalValue = document.createElement('span');
    totalValue.className = 'rating-value-display';
    totalValue.textContent = faculty.total_ratings;
    totalLabelRow.appendChild(totalLabel);
    totalLabelRow.appendChild(totalValue);
    totalRow.appendChild(totalLabelRow);
    ratingDetails.appendChild(totalRow);
    
    // Last updated
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    lastUpdated.textContent = `Updated: ${faculty.last_updated}`;
    
    ratingItem.appendChild(facultyHeader);
    ratingItem.appendChild(ratingDetails);
    ratingItem.appendChild(lastUpdated);
    
    ratingsList.appendChild(ratingItem);
  });
}

// Import faculty ratings from JSON file
function importFacultyRatingsFromFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      if (Array.isArray(jsonData)) {
        facultyRatingsData = jsonData;
        console.log('Imported faculty ratings:', facultyRatingsData);
        // Save to Chrome storage with proper key
        chrome.storage.local.set({ facultyRatings: facultyRatingsData }, function() {
          console.log('Faculty ratings saved to storage successfully');
          // Verify the data was saved
          chrome.storage.local.get(['facultyRatings'], function(result) {
            console.log('Verification - Retrieved from storage:', result);
          });
          displayRatings();
          
          // Notify content scripts that ratings have been updated
          try {
            chrome.runtime.sendMessage({
              type: 'FACULTY_RATINGS_UPDATED',
              data: facultyRatingsData
            }, function(response) {
              if (chrome.runtime.lastError) {
                console.log('Message send error (expected if no content scripts are listening):', chrome.runtime.lastError.message);
              } else {
                console.log('Message sent to content scripts:', response);
              }
            });
          } catch (error) {
            console.log('Messaging error (expected if no content scripts are listening):', error);
          }
        });
      } else {
        alert('Invalid JSON format. Please provide an array of faculty objects.');
      }
    } catch (error) {
      alert('Error parsing JSON file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Load faculty ratings from Chrome storage
function loadFacultyRatings() {
  chrome.storage.local.get(['facultyRatings'], function(result) {
    console.log('Loading faculty ratings from storage:', result);
    if (result.facultyRatings) {
      facultyRatingsData = result.facultyRatings;
      console.log('Loaded faculty ratings data:', facultyRatingsData);
      displayRatings();
    } else {
      console.log('No faculty ratings found in storage');
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received message:', request);
  if (request.type === 'GET_FACULTY_RATINGS') {
    console.log('Sending faculty ratings data:', facultyRatingsData);
    sendResponse({ facultyRatings: facultyRatingsData });
    return true; // Keep the message channel open for async response
  }
});

// Initialize faculty ratings page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Faculty ratings page loaded');
  
  // Load existing ratings
  loadFacultyRatings();
  
  // Set up import button
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const backButton = document.getElementById('backButton');
  
  importBtn.addEventListener('click', function() {
    console.log('Import button clicked');
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    console.log('File selected:', e.target.files);
    if (e.target.files.length > 0) {
      importFacultyRatingsFromFile(e.target.files[0]);
    }
  });
  
  // Handle back button
  backButton.addEventListener('click', function() {
    window.location.href = 'sidebar.html';
  });
  
  // Handle window resize to adjust components dynamically
  let resizeTimeout;
  window.addEventListener('resize', function() {
    // Debounce the resize event to improve performance
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      displayRatings();
    }, 100);
  });
});