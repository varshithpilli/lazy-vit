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

    if (
      h3Text.includes('Attendance Details') ||
      document.querySelector('table[id*="attendance"]')
    ) {
      isSelfMutating = true;
      try {
        view_attendance_page();
      } finally {
        isSelfMutating = false;
      }
    }

    if (h3Text.includes('Marks View')) {
      isSelfMutating = true;
      try {
        modify_marks_page();
      } finally {
        isSelfMutating = false;
      }
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
    setTimeout(() => detectPage(), 500);
    startObserving();
  });
} else {
  setTimeout(() => detectPage(), 500);
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
}, 1000);