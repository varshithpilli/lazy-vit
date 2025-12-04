document.addEventListener('DOMContentLoaded', function() {
  // Add click event listeners to all feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      if (target) {
        window.location.href = target;
      }
    });
  });
});