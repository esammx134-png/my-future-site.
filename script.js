// Track page visits
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname || '/';
  fetch('/api/track-visit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page: currentPage })
  }).catch(err => console.log('Tracking failed', err));
});