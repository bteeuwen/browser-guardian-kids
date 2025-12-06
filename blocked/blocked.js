// Display current time on blocked page
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();
  const timeElement = document.getElementById('timeInfo');

  if (timeElement) {
    timeElement.textContent = `${dateString} at ${timeString}`;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);
});
