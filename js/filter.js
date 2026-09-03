/**
 * Filter module for KolpingHaus application.
 * Manages the current view filter (alle, stadt, gastro).
 */
window.Filter = (function() {
  let currentFilter = 'alle';
  let onChangeCallback = null;

  function updateUI() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-filter') === currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  return {
    init: function(defaultFilter, onChange) {
      currentFilter = defaultFilter || 'alle';
      onChangeCallback = onChange;
      
      const buttons = document.querySelectorAll('.filter-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const filter = e.currentTarget.getAttribute('data-filter');
          this.setFilter(filter);
        });
      });

      updateUI();
    },

    getCurrentFilter: function() {
      return currentFilter;
    },

    setFilter: function(filter) {
      if (currentFilter !== filter) {
        currentFilter = filter;
        updateUI();
        if (typeof onChangeCallback === 'function') {
          onChangeCallback(currentFilter);
        }
      }
    }
  };
})();
