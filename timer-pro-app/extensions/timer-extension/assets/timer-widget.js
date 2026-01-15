document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("timer-pro-app-root");
  const display = container.querySelector(".timer-display");
  const shop = container.dataset.shop;

  // Requirement 4.5: Handle network failures/no active timers
  try {
    const response = await fetch(`https://your-app-url.com/api/timer-config?shop=${shop}`);
    const config = await response.json();

    if (!config || !config.active) {
      container.style.display = 'none';
      return;
    }

    let targetTime;

    // Requirement 25 & 26: Evergreen Session-based logic
    if (config.type === 'evergreen') {
      const storageKey = `timer_evergreen_${config._id}`;
      let saved = localStorage.getItem(storageKey);
      if (!saved) {
        saved = Date.now() + (config.durationMinutes * 60000);
        localStorage.setItem(storageKey, saved);
      }
      targetTime = parseInt(saved);
    } else {
      // Requirement 24: Fixed Timer
      targetTime = new Date(config.endDate).getTime();
    }

    const update = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        display.innerText = "PROMOTION EXPIRED";
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      // Requirement 46: Smooth animation without layout shifts
      display.innerText = `${m}m ${s}s remaining!`;
    };

    setInterval(update, 1000);
    update();
  } catch (err) {
    container.style.display = 'none';
  }
});