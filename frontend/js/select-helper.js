/**
 * Select & Calendar Custom Enhancement Helper
 * Dynamically enhances all w-full select dropdowns and date inputs on Clovas Shopping website
 */

(function () {
  const loadFlatpickr = () => {
    return new Promise((resolve) => {
      if (window.flatpickr) {
        resolve();
        return;
      }

      // Load flatpickr CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
      document.head.appendChild(link);

      // If dark mode is active, load dark theme
      const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
      if (isDark) {
        const darkLink = document.createElement('link');
        darkLink.rel = 'stylesheet';
        darkLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';
        document.head.appendChild(darkLink);
      }

      // Load flatpickr JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const makeSelectCustom = (select) => {
    if (!select || select.classList.contains('hidden') || select.classList.contains('custom-applied')) return;
    select.classList.add('hidden', 'custom-applied');

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'relative w-full custom-select-wrapper';

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `${select.className.replace('hidden', '')} flex items-center justify-between transition-all`;
    trigger.classList.remove('focus:ring-2', 'focus:ring-primary-500');
    trigger.classList.add('focus:outline-none', 'focus:ring-4', 'focus:ring-primary-500/10');
    
    const selectedOption = select.options[select.selectedIndex];
    trigger.innerHTML = `
      <span class="truncate custom-select-text">${selectedOption ? selectedOption.textContent : ''}</span>
      <svg class="h-4 w-4 text-slate-400 transition-transform duration-200 ml-2 flex-shrink-0 custom-select-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    `;
    wrapper.appendChild(trigger);

    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden overflow-y-auto max-h-60';

    const updateUI = (val) => {
      const activeOption = Array.from(select.options).find(o => o.value === val);
      const textSpan = trigger.querySelector('.custom-select-text');
      if (textSpan) {
        textSpan.textContent = activeOption ? activeOption.textContent : val;
      }
      
      // Highlight active in options list
      optionsContainer.querySelectorAll('button').forEach(btn => {
        if (btn.getAttribute('data-val') === val) {
          btn.className = 'w-full px-4 py-2.5 text-left text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold focus:outline-none transition-colors border-b border-slate-100/50 dark:border-slate-800/40 last:border-0';
        } else {
          btn.className = 'w-full px-4 py-2.5 text-left text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none transition-colors border-b border-slate-100/50 dark:border-slate-800/40 last:border-0';
        }
      });
    };

    // Populate options
    const populateOptions = () => {
      optionsContainer.innerHTML = '';
      Array.from(select.options).forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-val', opt.value);
        btn.textContent = opt.textContent;
        
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          optionsContainer.classList.add('hidden');
          const arrow = trigger.querySelector('.custom-select-arrow');
          if (arrow) arrow.classList.remove('rotate-180');
        });

        optionsContainer.appendChild(btn);
      });
      updateUI(select.value);
    };

    populateOptions();

    // Listen to changes in options (like dynamic category/subcategory loading in filters)
    const observer = new MutationObserver(() => {
      populateOptions();
    });
    observer.observe(select, { childList: true });

    wrapper.appendChild(optionsContainer);
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Toggle options
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const arrow = trigger.querySelector('.custom-select-arrow');
      document.querySelectorAll('.custom-select-wrapper div').forEach(div => {
        if (div !== optionsContainer) div.classList.add('hidden');
      });
      document.querySelectorAll('.custom-select-wrapper svg').forEach(svg => {
        if (svg !== arrow) svg.classList.remove('rotate-180');
      });

      optionsContainer.classList.toggle('hidden');
      if (arrow) arrow.classList.toggle('rotate-180');
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
      optionsContainer.classList.add('hidden');
      const arrow = trigger.querySelector('.custom-select-arrow');
      if (arrow) arrow.classList.remove('rotate-180');
    });

    // Intercept select value updates
    const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (descriptor) {
      Object.defineProperty(select, 'value', {
        set: function(val) {
          descriptor.set.call(this, val);
          updateUI(val);
        },
        get: function() {
          return descriptor.get.call(this);
        }
      });
    }
  };

  const initCustomSelects = () => {
    // Select all non-hidden selects
    document.querySelectorAll('select').forEach(makeSelectCustom);
  };

  const initCalendar = async () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length === 0) return;

    await loadFlatpickr();

    dateInputs.forEach(input => {
      // Clear native webkit date indicators to prevent double calendar trigger
      input.classList.add('flatpickr-input-enhanced');
      
      // Load flatpickr
      window.flatpickr(input, {
        dateFormat: "Y-m-d",
        minDate: "today",
        disableMobile: "true" // Force customized premium calendar overlay on mobile instead of native datetime picker
      });
    });
  };

  // Run on load
  const runInit = () => {
    initCustomSelects();
    initCalendar();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
  } else {
    runInit();
  }

  // Safe MutationObserver that only scans for new select elements to avoid infinite loops
  const observer = new MutationObserver((mutations) => {
    let hasNewSelect = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'SELECT' || node.querySelector('select')) {
            hasNewSelect = true;
            break;
          }
        }
      }
      if (hasNewSelect) break;
    }
    if (hasNewSelect) {
      initCustomSelects();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
