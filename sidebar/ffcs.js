(function() {
    'use strict';

    // ============= SHARED STATE & UTILITIES =============
    let facultyRatings = [];
    let settings = {
        maxSubjects: 0,
        viewShowRatings: true,
        viewShowDetails: false,
        viewSortRating: false,
        registerShowRatings: true,
        registerShowDetails: false,
        registerSortRating: false
    };

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

    function findFaculty(name) {
        const n = normalize(name);
        return facultyRatings.find(f => normalize(f.name) === n) || null;
    }

    // ============= PAGE DETECTION (Simplified) =============
    function isFFCSPage() {
        return window.location.href.includes('vtopregcc.vit.ac.in/RegistrationNew');
    }

    function getPageType() {
        // Quick check for tables - if no tables, page not ready
        const tables = document.querySelectorAll('table.w3-table-all');
        if (!tables.length) {
            return null;
        }

        // Check for course list page (has both View Slot and Proceed buttons)
        const viewSlotButtons = document.querySelectorAll('button[onclick*="callViewSlots"]');
        const proceedButtons = document.querySelectorAll('button[onclick*="callCourseRegistration"]');
        if (viewSlotButtons.length > 0 && proceedButtons.length > 0) {
            console.log('[FFCS] Detected: Course List Page');
            return 'courseList';
        }

        // Check for register page (has radio buttons for class selection and Register/Go Back buttons)
        const radioButtons = document.querySelectorAll('input[type="radio"][name*="classnbr"]');
        const hasRegisterButton = !!document.querySelector('button[onclick*="registerCourse"]');
        const hasGoBack = !!document.querySelector('button[onclick*="goBack"]');
        if (radioButtons.length > 0 && (hasRegisterButton || hasGoBack)) {
            console.log('[FFCS] Detected: Register Course Page');
            return 'register';
        }

        // Check for view slot page (has slot/venue/faculty columns and no radio buttons)
        for (const table of tables) {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
            const hasSlot = headers.some(h => h.includes('slot'));
            const hasVenue = headers.some(h => h.includes('venue'));
            const hasFaculty = headers.some(h => h.includes('faculty'));
            
            if (hasSlot && hasVenue && hasFaculty && radioButtons.length === 0) {
                console.log('[FFCS] Detected: View Slot Page');
                return 'viewSlot';
            }
        }

        return null;
    }

    // ============= BADGE CREATION =============
    function createBadge(faculty, showDetails) {
        const badge = document.createElement('span');
        badge.className = 'faculty-rating-badge';
        badge.style.cssText = `
            margin-left: 6px;
            padding: 3px 7px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
            font-size: 11px;
            display: inline-block;
            white-space: nowrap;
            vertical-align: middle;
        `;

        if (!faculty) {
            badge.textContent = 'N/A';
            badge.style.backgroundColor = '#9E9E9E';
            return badge;
        }

        const rating = faculty.overall_rating.toFixed(1);

        if (showDetails) {
            badge.innerHTML = `${rating}⭐ T:${faculty.teaching} A:${faculty.attendance_flex} S:${faculty.supportiveness} M:${faculty.marks}`;
            badge.style.whiteSpace = 'nowrap';
        } else {
            badge.textContent = `${rating}⭐`;
            badge.title = `${faculty.name}\nTeaching: ${faculty.teaching}\nAttendance: ${faculty.attendance_flex}\nSupport: ${faculty.supportiveness}\nMarks: ${faculty.marks}\nTotal Ratings: ${faculty.total_ratings}`;
        }

        badge.style.backgroundColor = getRatingColor(faculty.overall_rating);
        return badge;
    }

    // ============= UNIFIED INJECTION =============
    function injectRatings() {
        if (!isFFCSPage()) return;

        const pageType = getPageType();
        if (!pageType) {
            console.log('[FFCS] Page type not detected - tables may not be loaded yet');
            return;
        }

        console.log(`[FFCS] Injecting ratings for ${pageType} page...`);

        const tables = document.querySelectorAll('table.w3-table-all');
        const dataRows = [];
        let injectedCount = 0;

        // Determine which settings to use based on page type
        const showRatings = (pageType === 'viewSlot') ? settings.viewShowRatings : 
                          (pageType === 'register') ? settings.registerShowRatings : false;
        const showDetails = (pageType === 'viewSlot') ? settings.viewShowDetails : 
                          (pageType === 'register') ? settings.registerShowDetails : false;
        const sortRating = (pageType === 'viewSlot') ? settings.viewSortRating : 
                         (pageType === 'register') ? settings.registerSortRating : false;

        if (!showRatings) {
            console.log('[FFCS] Ratings disabled for this page type');
            // Remove existing badges if disabled
            document.querySelectorAll('.faculty-rating-badge').forEach(el => el.remove());
            return;
        }

        tables.forEach(table => {
            const rows = Array.from(table.querySelectorAll('tr'));
            let facultyColIndex = -1;
            let availableColIndex = -1;

            // Find column indices from headers
            rows.forEach((row, idx) => {
                const headerCells = row.querySelectorAll('th');
                if (headerCells.length > 0 && facultyColIndex === -1) {
                    headerCells.forEach((cell, i) => {
                        const headerText = cell.textContent.trim().toLowerCase();
                        if (headerText.includes('faculty')) {
                            facultyColIndex = i;
                            console.log('[FFCS] Found faculty column at index:', i);
                        }
                        if (headerText.includes('available')) {
                            availableColIndex = i;
                        }
                    });
                }
            });

            if (facultyColIndex === -1) {
                console.log('[FFCS] No faculty column found in this table');
                return;
            }

            // Process data rows
            rows.forEach((row, idx) => {
                if (idx === 0) return; // Skip header row

                const cells = row.querySelectorAll('td');
                if (cells.length <= facultyColIndex) return;

                // Skip section header rows (like "Embedded Theory", "Theory Slots", "Lab Only")
                const rowText = row.textContent.toLowerCase();
                if (rowText.includes('embedded theory') ||
                    rowText.includes('embedded lab') ||
                    rowText.includes('theory only') ||
                    rowText.includes('lab only') ||
                    rowText.includes('theory slots') ||
                    rowText.includes('lab slots') ||
                    rowText.includes('course option')) {
                    return;
                }

                const facultyCell = cells[facultyColIndex];
                if (!facultyCell || cells[0].tagName === 'TH') return;

                // Remove existing badges to avoid duplicates
                facultyCell.querySelectorAll('.faculty-rating-badge').forEach(b => b.remove());

                const facultyName = facultyCell.textContent.replace(/\s+/g, ' ').trim();
                if (!facultyName || facultyName.length === 0) return;

                // Apply max subjects limit for course list page
                if (pageType === 'courseList' && settings.maxSubjects > 0 && injectedCount >= settings.maxSubjects) {
                    row.style.display = 'none';
                    return;
                }

                const faculty = findFaculty(facultyName);
                const badge = createBadge(faculty, showDetails);
                facultyCell.appendChild(badge);
                injectedCount++;

                // Collect rows for sorting
                if (faculty) {
                    let availSeats = 0;
                    if (availableColIndex !== -1 && cells[availableColIndex]) {
                        const availText = cells[availableColIndex].textContent.trim();
                        const isFull = /full|seat\(s\) are full/i.test(availText);
                        availSeats = isFull || availText === '' ? 0 : parseInt(availText) || 0;
                    }
                    
                    dataRows.push({
                        row,
                        faculty,
                        availSeats
                    });
                }
            });
        });

        console.log(`[FFCS] Injected ${injectedCount} rating badges`);

        // Sort rows if enabled
        if (sortRating && dataRows.length > 1) {
            console.log('[FFCS] Sorting by rating...');
            const tbody = dataRows[0].row.parentElement;

            // Sort by rating, with available seats as secondary factor for register page
            dataRows.sort((a, b) => {
                if (pageType === 'register') {
                    // Full slots go to bottom
                    if (a.availSeats === 0 && b.availSeats > 0) return 1;
                    if (a.availSeats > 0 && b.availSeats === 0) return -1;
                }
                // Otherwise sort by rating
                return b.faculty.overall_rating - a.faculty.overall_rating;
            });

            dataRows.forEach(item => {
                tbody.appendChild(item.row);
            });
        }
    }

    // ============= MAIN APPLICATION LOGIC =============
    function observeAndInject() {
        console.log('[FFCS] Starting observer and initial injection...');
        
        // Initial injection with delay for AJAX content
        setTimeout(() => {
            console.log('[FFCS] Running initial injection...');
            injectRatings();
        }, 1000);

        // Watch for dynamic content changes (AJAX updates)
        const observer = new MutationObserver((mutations) => {
            // Check if significant content was added
            const hasSignificantChange = mutations.some(mutation => 
                mutation.addedNodes.length > 0 && 
                Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && // Element node
                    (node.tagName === 'TABLE' || 
                     node.tagName === 'DIV' || 
                     node.id === 'page-wrapper' ||
                     node.querySelector && (node.querySelector('table') || node.querySelector('.w3-table-all')))
                )
            );

            if (hasSignificantChange) {
                console.log('[FFCS] Significant DOM change detected, reinjecting after delay...');
                setTimeout(() => {
                    injectRatings();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        console.log('[FFCS] Observer active');
    }

    // ============= SIDEBAR (POPUP) LOGIC =============
    function initSidebar() {
        loadSettings();
        loadRatings();

        // Max subjects save button
        document.getElementById('saveMaxSubjects')?.addEventListener('click', () => {
            settings.maxSubjects = parseInt(document.getElementById('maxSubjectsInput').value) || 0;
            saveSettings();
            updateStatus('Max subjects saved!', '#28a745');
        });

        // Toggle listeners for View Slot Page
        ['viewShowRatings', 'viewShowDetails', 'viewSortRating'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                settings[id] = e.target.checked;
                saveSettings();
            });
        });

        // Toggle listeners for Register Course Page
        ['registerShowRatings', 'registerShowDetails', 'registerSortRating'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                settings[id] = e.target.checked;
                saveSettings();
            });
        });

        // Import button
        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput')?.addEventListener('change', e => {
            if (e.target.files.length) importFile(e.target.files[0]);
        });

        // Back button
        document.getElementById('backButton')?.addEventListener('click', () => {
            window.location.href = 'sidebar.html';
        });
    }

    function loadSettings() {
        chrome.storage.local.get([
            'maxSubjects', 'viewShowRatings', 'viewShowDetails', 'viewSortRating',
            'registerShowRatings', 'registerShowDetails', 'registerSortRating'
        ], result => {
            settings.maxSubjects = parseInt(result.maxSubjects) || 0;
            settings.viewShowRatings = result.viewShowRatings !== false;
            settings.viewShowDetails = result.viewShowDetails === true;
            settings.viewSortRating = result.viewSortRating === true;
            settings.registerShowRatings = result.registerShowRatings !== false;
            settings.registerShowDetails = result.registerShowDetails === true;
            settings.registerSortRating = result.registerSortRating === true;

            // Update UI if on settings page
            if (document.getElementById('maxSubjectsInput')) {
                document.getElementById('maxSubjectsInput').value = settings.maxSubjects || 0;
                document.getElementById('viewShowRatings').checked = settings.viewShowRatings;
                document.getElementById('viewShowDetails').checked = settings.viewShowDetails;
                document.getElementById('viewSortRating').checked = settings.viewSortRating;
                document.getElementById('registerShowRatings').checked = settings.registerShowRatings;
                document.getElementById('registerShowDetails').checked = settings.registerShowDetails;
                document.getElementById('registerSortRating').checked = settings.registerSortRating;
            }
        });
    }

    function saveSettings() {
        chrome.storage.local.set({
            maxSubjects: settings.maxSubjects,
            viewShowRatings: settings.viewShowRatings,
            viewShowDetails: settings.viewShowDetails,
            viewSortRating: settings.viewSortRating,
            registerShowRatings: settings.registerShowRatings,
            registerShowDetails: settings.registerShowDetails,
            registerSortRating: settings.registerSortRating
        }, () => {
            chrome.tabs.query({}, tabs => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'SETTINGS_CHANGED',
                        settings: settings
                    }).catch(() => {});
                });
            });
        });
    }

    function loadRatings() {
        chrome.storage.local.get(['facultyRatings'], result => {
            facultyRatings = result.facultyRatings || [];
            updateStats();
        });
    }

    function importFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data) && data.length > 0) {
                    facultyRatings = data;
                    chrome.storage.local.set({
                        facultyRatings: data
                    }, () => {
                        updateStatus('Imported successfully!', '#28a745');
                        updateStats();

                        chrome.tabs.query({}, tabs => {
                            tabs.forEach(tab => {
                                chrome.tabs.sendMessage(tab.id, {
                                    type: 'RATINGS_UPDATED',
                                    data: data
                                }).catch(() => {});
                            });
                        });
                    });
                } else {
                    updateStatus('Invalid JSON format', '#dc3545');
                }
            } catch (error) {
                updateStatus('Error: ' + error.message, '#dc3545');
            }
        };
        reader.readAsText(file);
    }

    function updateStatus(msg, color) {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.color = color;
            if (color !== '#666') {
                setTimeout(() => {
                    statusEl.textContent = 'Click to import ratings data';
                    statusEl.style.color = '#666';
                }, 3000);
            }
        }
    }

    function updateStats() {
        const statsBox = document.getElementById('statsBox');

        if (statsBox) {
            if (facultyRatings.length > 0) {
                const avg = (facultyRatings.reduce((sum, f) => sum + f.overall_rating, 0) / facultyRatings.length).toFixed(1);
                statsBox.innerHTML = `<strong>${facultyRatings.length}</strong> faculty loaded | Avg: <strong>${avg}</strong>`;
                statsBox.style.display = 'block';
            } else {
                statsBox.style.display = 'none';
            }
        }
    }

    // ============= MESSAGE LISTENER =============
    chrome.runtime?.onMessage.addListener((req) => {
        if (req.type === 'RATINGS_UPDATED' || req.type === 'FACULTY_RATINGS_UPDATED') {
            console.log('[FFCS] Ratings updated via message');
            facultyRatings = req.data || [];
            setTimeout(() => injectRatings(), 200);
        }
        if (req.type === 'SETTINGS_CHANGED' || req.type === 'FFCS_SETTINGS_CHANGED') {
            console.log('[FFCS] Settings updated via message');
            settings = req.settings || settings;
            setTimeout(() => injectRatings(), 200);
        }
    });

    // ============= INITIALIZATION =============
    if (typeof chrome !== 'undefined' && chrome.storage) {
        // Content script for FFCS pages
        if (isFFCSPage()) {
            console.log('[FFCS] Initializing content script for FFCS page');
            chrome.storage.local.get([
                'facultyRatings', 'maxSubjects', 'viewShowRatings', 'viewShowDetails',
                'viewSortRating', 'registerShowRatings', 'registerShowDetails', 'registerSortRating'
            ], result => {
                facultyRatings = result.facultyRatings || [];
                settings.maxSubjects = parseInt(result.maxSubjects) || 0;
                settings.viewShowRatings = result.viewShowRatings !== false;
                settings.viewShowDetails = result.viewShowDetails === true;
                settings.viewSortRating = result.viewSortRating === true;
                settings.registerShowRatings = result.registerShowRatings !== false;
                settings.registerShowDetails = result.registerShowDetails === true;
                settings.registerSortRating = result.registerSortRating === true;

                console.log('[FFCS] Loaded settings:', settings);
                console.log('[FFCS] Loaded faculty ratings:', facultyRatings.length, 'records');

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('[FFCS] DOM loaded, starting observer');
                        setTimeout(observeAndInject, 500);
                    });
                } else {
                    console.log('[FFCS] DOM already loaded, starting observer immediately');
                    setTimeout(observeAndInject, 500);
                }
            });
        }
        // Sidebar/Settings page
        else if (document.getElementById('importBtn')) {
            console.log('[FFCS] Initializing sidebar/settings page');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initSidebar);
            } else {
                initSidebar();
            }
        }
    }
})();
