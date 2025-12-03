// Content script to inject faculty ratings into various pages
// Related to: sidebar/facultyRatings.js

(function() {
  // Configuration for different page types and their faculty name column identifiers
  const PAGE_CONFIGS = {
    'attendance': {
      titleKeywords: ['Student Attendance Details'],
      tableIdKeywords: ['attendance'],
      facultyColumnNames: ['Faculty Name', 'Faculty\n\t\t\t\t\t\t\t\t\t\t\t\t\tName']
    },
    'timetable': {
      titleKeywords: ['Time Table'],
      tableIdKeywords: [],
      facultyColumnNames: ['Faculty Details', 'Faculty\n\t\t\t\t\t\t\t\t\t\t\t\t\tDetails']
    }
  };

  // Store faculty ratings data globally
  let globalFacultyRatingsData = null;

  // Listen for messages from the sidebar
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Content script received message:', request);
    
    if (request.type === 'FACULTY_RATINGS_UPDATED') {
      console.log('Received updated faculty ratings from sidebar:', request.data);
      globalFacultyRatingsData = request.data;
      
      // Inject ratings immediately if we're on a supported page
      if (detectPageType()) {
        setTimeout(() => {
          injectFacultyRatingsIntoPage(globalFacultyRatingsData);
        }, 1000);
      }
      
      sendResponse({ status: 'received' });
      return true;
    }
    
    // Handle requests for faculty ratings (from sidebar)
    if (request.type === 'GET_FACULTY_RATINGS') {
      console.log('Sidebar requested faculty ratings, sending:', globalFacultyRatingsData);
      sendResponse({ facultyRatings: globalFacultyRatingsData || [] });
      return true;
    }
  });

  // Function to get faculty rating by ID or exact name match
  function getFacultyRatingByIdOrName(identifier, facultyRatingsData) {
    console.log('Attempting to match faculty:', identifier);
    console.log('Available faculty data count:', facultyRatingsData ? facultyRatingsData.length : 0);
    
    if (!facultyRatingsData || facultyRatingsData.length === 0) {
      console.log('No faculty ratings data available');
      return null;
    }
    
    // Normalize the identifier by removing extra whitespace and newlines
    const normalizedIdentifier = identifier.replace(/\s+/g, ' ').trim();
    console.log('Normalized identifier:', `"${normalizedIdentifier}"`);
    
    // Try different parsing approaches
    
    // Approach 1: Extract ID and name from formats like "51654 ASHOKA RAJAN R"
    let facultyId = null;
    let facultyName = null;
    
    const idNameMatch = normalizedIdentifier.match(/^(\d{5})\s+(.+)$/);
    if (idNameMatch) {
      facultyId = idNameMatch[1];
      facultyName = idNameMatch[2].trim();
      console.log('Parsed ID and Name - ID:', facultyId, 'Name:', `"${facultyName}"`);
    } else {
      // Approach 2: Just use the whole string as name
      facultyName = normalizedIdentifier;
      console.log('Using whole string as name:', `"${facultyName}"`);
    }
    
    // First try to match by faculty ID if available
    if (facultyId) {
      console.log('Searching for faculty by ID:', facultyId);
      const idMatch = facultyRatingsData.find(faculty => {
        const match = faculty.faculty_id.toString() === facultyId.toString();
        if (match) console.log('Found faculty by ID:', faculty);
        return match;
      });
      if (idMatch) {
        console.log('Returning faculty matched by ID:', idMatch);
        return idMatch;
      }
    }
    
    // If no ID match or no ID, try exact name match
    if (facultyName) {
      console.log('Searching for faculty by exact name:', `"${facultyName}"`);
      const exactNameMatch = facultyRatingsData.find(faculty => {
        const match = faculty.name.trim() === facultyName;
        if (match) console.log('Found faculty by exact name:', faculty);
        return match;
      });
      if (exactNameMatch) {
        console.log('Returning faculty matched by exact name:', exactNameMatch);
        return exactNameMatch;
      }
      
      // Try partial name matching (strip organization info like " - SCOPE")
      const cleanName = facultyName.split(' - ')[0].trim();
      if (cleanName !== facultyName) {
        console.log('Trying cleaned name:', `"${cleanName}"`);
        const cleanNameMatch = facultyRatingsData.find(faculty => {
          const match = faculty.name.trim() === cleanName;
          if (match) console.log('Found faculty by cleaned name:', faculty);
          return match;
        });
        if (cleanNameMatch) {
          console.log('Returning faculty matched by cleaned name:', cleanNameMatch);
          return cleanNameMatch;
        }
      }
      
      // Try matching just the name part (without organization)
      // Handle formats like "REVATHI A R - SCOPE" -> "REVATHI A R"
      const nameOnlyMatch = facultyName.split(' - ')[0].trim();
      if (nameOnlyMatch !== facultyName) {
        console.log('Trying name-only match:', `"${nameOnlyMatch}"`);
        const nameOnlyResult = facultyRatingsData.find(faculty => {
          const match = faculty.name.trim() === nameOnlyMatch;
          if (match) console.log('Found faculty by name-only:', faculty);
          return match;
        });
        if (nameOnlyResult) {
          console.log('Returning faculty matched by name-only:', nameOnlyResult);
          return nameOnlyResult;
        }
      }
    }
    
    console.log('No faculty match found for:', identifier);
    return null;
  }

  // Get color based on rating value (scale of 10)
  function getRatingColor(rating) {
    if (rating >= 9.0) return '#4CAF50';
    if (rating >= 8.0) return '#8BC34A';
    if (rating >= 7.0) return '#FFC107';
    if (rating >= 6.0) return '#FF9800';
    return '#F44336';
  }

  // Detect current page type
  function detectPageType() {
    const h3Text = document.querySelector('h3')?.textContent || '';
    const allHeadings = Array.from(document.querySelectorAll('h3, h2, h1')).map(h => h.textContent);
    
    console.log('Detecting page type. H3 text:', `"${h3Text}"`);
    console.log('All headings:', allHeadings);
    
    for (const [pageType, config] of Object.entries(PAGE_CONFIGS)) {
      // Check title keywords
      const titleMatch = config.titleKeywords.some(keyword => 
        h3Text.includes(keyword) || allHeadings.some(h => h.includes(keyword)));
      if (titleMatch) {
        console.log('Detected page type:', pageType);
        return pageType;
      }
      
      // Check table ID keywords
      if (config.tableIdKeywords.length > 0) {
        const tableMatch = config.tableIdKeywords.some(keyword => 
          document.querySelector(`table[id*="${keyword}"]`));
        if (tableMatch) {
          console.log('Detected page type by table ID:', pageType);
          return pageType;
        }
      }
    }
    
    console.log('No matching page type found');
    return null;
  }

  // Find faculty name column index in a table
  function findFacultyNameColumnIndex(headerRow, facultyColumnNames) {
    const headers = headerRow.querySelectorAll('th, td');
    console.log('Looking for faculty column in headers:', Array.from(headers).map(h => `"${h.textContent.trim()}"`));
    console.log('Target column names:', facultyColumnNames);
    
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i].textContent.trim();
      // Check for exact match or partial match (to handle whitespace differences)
      if (facultyColumnNames.some(targetName => 
        headerText === targetName || 
        headerText.includes(targetName) ||
        targetName.includes(headerText))) {
        console.log('Found faculty column at index:', i, 'with header:', `"${headerText}"`);
        return i;
      }
    }
    console.log('Faculty column not found');
    return -1;
  }

  // Extract clean faculty identifier from cell content
  function extractFacultyIdentifier(cellContent) {
    // Remove extra whitespace and normalize
    return cellContent.replace(/\s+/g, ' ').trim();
  }

  // Inject faculty ratings into page
  function injectFacultyRatingsIntoPage(facultyRatingsData) {
    console.log('Starting faculty ratings injection');
    console.log('Faculty ratings data count:', facultyRatingsData ? facultyRatingsData.length : 0);
    
    // Detect current page type
    const pageType = detectPageType();
    if (!pageType) {
      console.log('Not a supported page type, skipping injection');
      return;
    }
    
    const config = PAGE_CONFIGS[pageType];
    console.log('Using page config:', config);
    
    // Find tables in the page
    const tables = document.querySelectorAll('table');
    console.log('Found tables:', tables.length);
    
    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tr');
      console.log(`Table ${tableIndex} has rows:`, rows.length);
      
      if (rows.length > 1) {
        // Check header row for faculty name column
        const headerRow = rows[0];
        const facultyNameColumnIndex = findFacultyNameColumnIndex(headerRow, config.facultyColumnNames);
        
        // If we found the faculty name column, process the table
        if (facultyNameColumnIndex !== -1) {
          console.log(`Processing table ${tableIndex}, faculty column at index:`, facultyNameColumnIndex);
          
          // Process each data row
          for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length > facultyNameColumnIndex) {
              const facultyNameCell = cells[facultyNameColumnIndex];
              const rawCellContent = facultyNameCell.textContent;
              const facultyIdentifier = extractFacultyIdentifier(rawCellContent);
              
              console.log(`Row ${i} faculty cell content:`, `"${rawCellContent}"`);
              console.log(`Row ${i} extracted identifier:`, `"${facultyIdentifier}"`);
              
              // Skip if cell is empty
              if (!facultyIdentifier) {
                console.log(`Row ${i} skipped - empty cell`);
                continue;
              }
              
              // Check if we've already added a rating to this cell
              if (!facultyNameCell.querySelector('.faculty-rating-display')) {
                // Get the faculty rating
                const facultyRating = getFacultyRatingByIdOrName(facultyIdentifier, facultyRatingsData);
                
                console.log(`Row ${i} faculty rating result:`, facultyRating);
                
                // Create rating display element
                const ratingDisplay = document.createElement('span');
                ratingDisplay.className = 'faculty-rating-display';
                ratingDisplay.style.marginLeft = '10px';
                ratingDisplay.style.padding = '2px 6px';
                ratingDisplay.style.borderRadius = '4px';
                ratingDisplay.style.color = 'white';
                ratingDisplay.style.fontWeight = 'bold';
                ratingDisplay.style.fontSize = '12px';
                ratingDisplay.style.whiteSpace = 'nowrap';
                
                if (facultyRating) {
                  // Display the overall rating with appropriate color
                  ratingDisplay.textContent = facultyRating.overall_rating.toFixed(1);
                  ratingDisplay.style.backgroundColor = getRatingColor(facultyRating.overall_rating);
                  console.log(`Row ${i} displaying rating:`, facultyRating.overall_rating);
                } else {
                  // Display N/A for faculty not found
                  ratingDisplay.textContent = 'N/A';
                  ratingDisplay.style.backgroundColor = '#9E9E9E';
                  console.log(`Row ${i} displaying N/A`);
                }
                
                // Append the rating to the faculty name cell
                facultyNameCell.appendChild(ratingDisplay);
                console.log(`Row ${i} rating display added`);
              } else {
                console.log(`Row ${i} skipped - rating already present`);
              }
            }
          }
        }
      }
    });
    
    console.log('Finished faculty ratings injection');
  }

  // Function to initialize the injector
  function initFacultyRatingsInjector() {
    console.log('Initializing faculty ratings injector');
    
    // Try multiple approaches to get faculty ratings
    // Approach 1: Direct storage access
    chrome.storage.local.get(['facultyRatings'], function(result) {
      console.log('Attempt 1 - Retrieved faculty ratings from storage:', result);
      
      if (result.facultyRatings && result.facultyRatings.length > 0) {
        console.log('Found faculty ratings in storage, injecting...');
        globalFacultyRatingsData = result.facultyRatings;
        setTimeout(() => {
          injectFacultyRatingsIntoPage(result.facultyRatings);
        }, 1000);
      } else {
        // Approach 2: Try messaging to sidebar
        console.log('No faculty ratings found in storage, trying messaging approach...');
        
        try {
          chrome.runtime.sendMessage({
            type: 'GET_FACULTY_RATINGS'
          }, function(response) {
            console.log('Received response from sidebar:', response);
            if (response && response.facultyRatings && response.facultyRatings.length > 0) {
              console.log('Got faculty ratings from sidebar, injecting...');
              globalFacultyRatingsData = response.facultyRatings;
              setTimeout(() => {
                injectFacultyRatingsIntoPage(response.facultyRatings);
              }, 1000);
            } else {
              console.log('No faculty ratings received from sidebar');
              
              // Set up a MutationObserver to handle dynamic content
              const targetNode = document.body;
              const observer = new MutationObserver(function(mutations) {
                let shouldReinject = false;
                mutations.forEach(function(mutation) {
                  if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldReinject = true;
                  }
                });
                
                if (shouldReinject) {
                  // Try to get data again when DOM changes
                  chrome.storage.local.get(['facultyRatings'], function(storageResult) {
                    console.log('DOM change - Retrieved faculty ratings from storage:', storageResult);
                    if (storageResult.facultyRatings && storageResult.facultyRatings.length > 0) {
                      console.log('Found faculty ratings on DOM change, injecting...');
                      globalFacultyRatingsData = storageResult.facultyRatings;
                      setTimeout(() => {
                        injectFacultyRatingsIntoPage(storageResult.facultyRatings);
                      }, 500);
                    }
                  });
                }
              });
              
              // Start observing
              observer.observe(targetNode, { childList: true, subtree: true });
              
              // Approach 3: Periodic check
              const intervalId = setInterval(() => {
                chrome.storage.local.get(['facultyRatings'], function(periodicResult) {
                  console.log('Periodic check - Retrieved faculty ratings:', periodicResult);
                  if (periodicResult.facultyRatings && periodicResult.facultyRatings.length > 0) {
                    console.log('Found faculty ratings in periodic check, injecting...');
                    globalFacultyRatingsData = periodicResult.facultyRatings;
                    clearInterval(intervalId);
                    setTimeout(() => {
                      injectFacultyRatingsIntoPage(periodicResult.facultyRatings);
                    }, 500);
                  }
                });
              }, 3000);
              
              // Stop checking after 30 seconds
              setTimeout(() => {
                clearInterval(intervalId);
              }, 30000);
            }
          });
        } catch (error) {
          console.log('Messaging approach failed:', error);
        }
      }
    });
  }

  // Wait for the page to load completely
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM content loaded, initializing injector');
      setTimeout(initFacultyRatingsInjector, 1000);
    });
  } else {
    // Small delay to ensure page content is loaded
    console.log('Document already loaded, initializing injector');
    setTimeout(initFacultyRatingsInjector, 1000);
  }
})();