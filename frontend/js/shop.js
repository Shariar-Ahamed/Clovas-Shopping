import clovasApi from './api.js';
import { addToCart, toggleWishlist, getWishlist } from './main.js';

const getProductColor = (prodId) => {
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown'];
  let hash = 0;
  if (prodId) {
    for (let i = 0; i < prodId.length; i++) {
      hash += prodId.charCodeAt(i);
    }
  }
  return colors[hash % colors.length];
};

document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('shop-products-grid');
  const resultsCount = document.getElementById('results-count');
  const sortSelect = document.getElementById('sort-select');
  const paginationContainer = document.getElementById('pagination-container');

  const filterSearch = document.getElementById('filter-search');
  const filterGender = document.getElementById('filter-gender');
  const filterSubcategory = document.getElementById('filter-subcategory');
  const filterMinPrice = document.getElementById('filter-min-price');
  const filterMaxPrice = document.getElementById('filter-max-price');
  const filterColor = document.getElementById('filter-color');

  const priceSliderMin = document.getElementById('price-slider-min');
  const priceSliderMax = document.getElementById('price-slider-max');
  const priceSliderTrack = document.getElementById('price-slider-track');
  const maxPriceLimit = 15000;

  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const clearFiltersBtn = document.getElementById('clear-filters');

  let currentPage = 1;

  // Dual price range slider synchronization
  const updateSliderTrack = () => {
    const minVal = parseInt(priceSliderMin.value);
    const maxVal = parseInt(priceSliderMax.value);
    
    const leftPercent = (minVal / maxPriceLimit) * 100;
    const rightPercent = 100 - (maxVal / maxPriceLimit) * 100;
    
    priceSliderTrack.style.left = leftPercent + '%';
    priceSliderTrack.style.right = rightPercent + '%';
    
    filterMinPrice.value = minVal;
    filterMaxPrice.value = maxVal;
  };

  priceSliderMin.addEventListener('input', () => {
    let minVal = parseInt(priceSliderMin.value);
    let maxVal = parseInt(priceSliderMax.value);
    
    if (minVal > maxVal) {
      priceSliderMin.value = maxVal;
      minVal = maxVal;
    }
    updateSliderTrack();
  });

  priceSliderMax.addEventListener('input', () => {
    let minVal = parseInt(priceSliderMin.value);
    let maxVal = parseInt(priceSliderMax.value);
    
    if (maxVal < minVal) {
      priceSliderMax.value = minVal;
      maxVal = minVal;
    }
    updateSliderTrack();
  });

  const syncInputsToSliders = () => {
    let minVal = parseInt(filterMinPrice.value) || 0;
    let maxVal = parseInt(filterMaxPrice.value) || maxPriceLimit;
    
    if (minVal < 0) minVal = 0;
    if (maxVal > maxPriceLimit) maxVal = maxPriceLimit;
    if (minVal > maxVal) minVal = maxVal;
    
    priceSliderMin.value = minVal;
    priceSliderMax.value = maxVal;
    
    filterMinPrice.value = minVal;
    filterMaxPrice.value = maxVal;
    
    const leftPercent = (minVal / maxPriceLimit) * 100;
    const rightPercent = 100 - (maxVal / maxPriceLimit) * 100;
    
    priceSliderTrack.style.left = leftPercent + '%';
    priceSliderTrack.style.right = rightPercent + '%';
  };

  filterMinPrice.addEventListener('change', syncInputsToSliders);
  filterMaxPrice.addEventListener('change', syncInputsToSliders);

  // Initialize track on start
  updateSliderTrack();

  // Initialize query parameters from URL
  const initFiltersFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('gender')) {
      filterGender.value = urlParams.get('gender');
    }
    if (urlParams.has('subCategory')) {
      filterSubcategory.value = urlParams.get('subCategory');
    }
    if (urlParams.has('search')) {
      filterSearch.value = urlParams.get('search');
    }
  };

  const getActiveFilters = () => {
    const filters = {
      page: currentPage,
      limit: 9,
      sort: sortSelect.value
    };

    if (filterSearch.value.trim()) {
      filters.search = filterSearch.value.trim();
    }

    if (filterGender.value && filterGender.value !== 'All') {
      filters.gender = filterGender.value;
    }

    if (filterSubcategory.value && filterSubcategory.value !== 'All') {
      filters.subCategory = filterSubcategory.value;
    }

    
    if (filterGender.value && filterGender.value !== 'All') {
      filters.category = filterGender.value; // Map gender selection directly to product category query
    }

    if (filterMinPrice.value) {
      filters.minPrice = filterMinPrice.value;
    }

    if (filterMaxPrice.value) {
      filters.maxPrice = filterMaxPrice.value;
    }

    return filters;
  };

  const fetchAndRenderProducts = () => {
    // Show Loading skeletons
    productsGrid.innerHTML = `
      <div class="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/40 p-4 h-[380px] justify-between shadow-sm animate-pulse">
        <div>
          <div class="h-48 w-full rounded-xl bg-slate-100 dark:bg-slate-800 shimmer mb-4"></div>
          <div class="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800 shimmer mb-2.5"></div>
          <div class="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 shimmer mb-2"></div>
          <div class="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800 shimmer"></div>
        </div>
        <div class="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/20">
          <div class="h-5 w-20 rounded bg-slate-100 dark:bg-slate-800 shimmer"></div>
          <div class="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 shimmer"></div>
        </div>
      </div>
    `.repeat(3);

    const filters = getActiveFilters();

    clovasApi.getProducts(filters)
      .then(data => {
        let products = data.products || [];
        
        // Filter by color in frontend
        if (filterColor && filterColor.value !== 'All') {
          products = products.filter(prod => getProductColor(prod._id) === filterColor.value);
        }
        
        resultsCount.textContent = products.length;

        if (products.length === 0) {
          productsGrid.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-550 dark:text-slate-400 font-semibold font-sans">
              No products match your filter search criteria. Try refining your filters!
            </div>
          `;
          paginationContainer.innerHTML = '';
          return;
        }

        productsGrid.innerHTML = '';
        const wishlist = getWishlist();

        products.forEach(prod => {
          const hasDiscount = prod.discountPrice && prod.discountPrice > 0;
          const priceHtml = hasDiscount 
            ? `<span class="font-bold text-slate-800 dark:text-white">${prod.discountPrice} BDT</span>
               <span class="text-xs text-slate-400 line-through ml-2">${prod.price} BDT</span>`
            : `<span class="font-bold text-slate-800 dark:text-white">${prod.price} BDT</span>`;

          const isWishlisted = wishlist.some(item => item._id === prod._id);

          const card = document.createElement('div');
          card.className = 'group flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/40 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative scroll-reveal-bottom';
          card.innerHTML = `
            <!-- Image -->
            <div class="h-52 overflow-hidden relative">
              <a href="product.html?id=${prod._id}">
                <img src="${prod.images[0]}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              </a>
              <!-- Wishlist Toggle -->
              <button class="wishlist-btn absolute top-4 right-4 h-10 w-10 rounded-xl glass flex items-center justify-center text-slate-700 dark:text-slate-350 hover:text-red-500 transition-colors" data-id="${prod._id}">
                <svg class="h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
              ${hasDiscount ? `
                <span class="absolute top-4 left-4 px-2.5 py-1 text-[10px] font-bold text-white bg-red-500 rounded-lg">SALE</span>
              ` : ''}
            </div>
            
            <!-- Content -->
            <div class="flex-1 flex flex-col justify-between">
              <div class="p-5 flex-1">
                <span class="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">${prod.category} • ${prod.subCategory} • Color: ${getProductColor(prod._id)}</span>
                <a href="product.html?id=${prod._id}">
                  <h3 class="font-serif text-base font-bold text-slate-800 dark:text-white leading-snug hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1">${prod.title}</h3>
                </a>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">${prod.description}</p>
              </div>
              
              <div class="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between">
                <div class="flex flex-col">
                  ${priceHtml}
                </div>
                
                <button class="add-to-cart-btn h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 shadow-md transition-colors" data-id="${prod._id}">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </button>
              </div>
            </div>
          `;

          // Card events
          card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.preventDefault();
            addToCart(prod, 1);
          });

          card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const isAdded = toggleWishlist(prod);
            const svg = e.currentTarget.querySelector('svg');
            if (isAdded) {
              svg.classList.add('fill-red-500', 'text-red-500', 'animate-heart-beat');
              setTimeout(() => svg.classList.remove('animate-heart-beat'), 600);
            } else {
              svg.classList.remove('fill-red-500', 'text-red-500');
            }
          });

          productsGrid.appendChild(card);
        });

        renderPagination(data.pages, data.page);
      })
      .catch(err => {
        console.error(err);
        productsGrid.innerHTML = `
          <div class="col-span-full py-16 text-center text-red-550 dark:text-red-400 font-semibold font-sans">
            Unable to load catalog products. Make sure the database is seeded.
          </div>
        `;
      });
  };

  const renderPagination = (totalPages, currentPageNum) => {
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `h-10 px-4 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
      currentPageNum === 1 
        ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800' 
        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPageNum === 1;
    prevBtn.addEventListener('click', () => {
      currentPage--;
      fetchAndRenderProducts();
      window.scrollTo(0, 0);
    });
    paginationContainer.appendChild(prevBtn);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `h-10 w-10 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
        i === currentPageNum
          ? 'bg-primary-600 border-primary-600 text-white shadow-md'
          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        fetchAndRenderProducts();
        window.scrollTo(0, 0);
      });
      paginationContainer.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `h-10 px-4 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
      currentPageNum === totalPages 
        ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800' 
        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPageNum === totalPages;
    nextBtn.addEventListener('click', () => {
      currentPage++;
      fetchAndRenderProducts();
      window.scrollTo(0, 0);
    });
    paginationContainer.appendChild(nextBtn);
  };

  // Wire controls
  applyFiltersBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchAndRenderProducts();
  });

  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    fetchAndRenderProducts();
  });

  if (filterColor) {
    filterColor.addEventListener('change', () => {
      currentPage = 1;
      fetchAndRenderProducts();
    });
  }

  clearFiltersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    filterSearch.value = '';
    filterGender.value = 'All';
    filterSubcategory.value = 'All';
    if (filterColor) {
      filterColor.value = 'All';
    }
    priceSliderMin.value = 0;
    priceSliderMax.value = 15000;
    updateSliderTrack();

    currentPage = 1;
    fetchAndRenderProducts();
  });

  // Mobile Filter Drawer Toggle
  const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
  const filtersSidebar = document.getElementById('filters-sidebar');
  if (toggleFiltersBtn && filtersSidebar) {
    toggleFiltersBtn.addEventListener('click', () => {
      filtersSidebar.classList.toggle('hidden');
      const isHidden = filtersSidebar.classList.contains('hidden');
      toggleFiltersBtn.innerHTML = isHidden 
        ? `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg> Show Filters & Sorting`
        : `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> Hide Filters & Sorting`;
    });
  }

  // Initial load
  initFiltersFromUrl();
  fetchAndRenderProducts();
});
