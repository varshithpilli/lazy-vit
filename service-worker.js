// Service worker for Lazy VITC extension
// Handles side panel registration

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .catch((error) => console.error(error));