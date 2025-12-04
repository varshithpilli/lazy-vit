const targetNode =
  document.getElementById('page-wrapper') ||
  document.getElementById('content') ||
  document.querySelector('.main-content') ||
  document.getElementById('fixedNavbar') ||
  document.body;

let isDetecting = false;
let isSelfMutating = false;
let isObserverActive = false;
let debounceHandle = null;

const observer = new MutationObserver((mutations) => {
  if (isSelfMutating) return;

  if (debounceHandle) {
    clearTimeout(debounceHandle);
    debounceHandle = null;
  }
  debounceHandle = setTimeout(() => {
    if (!isDetecting) detectPage();
  }, 300);
});

function startObserving() {
  if (isObserverActive) return;
  observer.observe(targetNode, { childList: true, subtree: true });
  isObserverActive = true;
}

function stopObserving() {
  if (!isObserverActive) return;
  observer.disconnect();
  isObserverActive = false;
}

function detectPage() {
  if (isDetecting) return;
  isDetecting = true;

  stopObserving();

  try {
    const h3Text = document.querySelector('h3')?.textContent || '';
    const allHeadings = Array.from(document.querySelectorAll('h3, h2, h1')).map(h => h.textContent);

    // Check for attendance page
    const isAttendancePage = 
      h3Text.includes('Attendance Details') ||
      allHeadings.some(h => h.includes('Student Attendance Details')) ||
      document.querySelector('table[id*="attendance"]');

    if (isAttendancePage) {
      isSelfMutating = true;
      try {
        view_attendance_page();
      } finally {
        isSelfMutating = false;
      }
    }

    // Check for marks page
    if (h3Text.includes('Marks View')) {
      isSelfMutating = true;
      try {
        modify_marks_page();
      } finally {
        isSelfMutating = false;
      }
    }
    
    // Check for timetable page
    const isTimetablePage = 
      h3Text.includes('Time Table') ||
      allHeadings.some(h => h.includes('Time Table'));
      
    if (isTimetablePage) {
      // Timetable page detected - faculty ratings will be injected by facultyRatingsInjector.js
      console.log('Timetable page detected');
    }
  } finally {
    if (debounceHandle) {
      clearTimeout(debounceHandle);
      debounceHandle = null;
    }
    startObserving();
    isDetecting = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => detectPage(), 1000);
    startObserving();
  });
} else {
  setTimeout(() => detectPage(), 1000);
  startObserving();
}

setTimeout(() => {
  isSelfMutating = true;
  try {
    nav();
    console.log('nav displayed');
  } finally {
    isSelfMutating = false;
  }
}, 1500);