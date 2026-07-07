import clovasApi from './api.js';
import { addToCart, toggleWishlist, getWishlist } from './main.js';

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
  
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const clearFiltersBtn = document.getElementById('clear-filters');

  let currentPage = 1;

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
    
    // Checkboxes for category
    const checkedCategories = urlParams.getAll('category');
    const checkboxes = document.querySelectorAll('input[name="category"]');
    checkboxes.forEach(cb => {
      if (checkedCategories.includes(cb.value)) {
        cb.checked = true;
      }
    });
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

    // Accumulate checked categories
    const checkedCategories = [];
    const checkboxes = document.querySelectorAll('input[name="category"]:checked');
    checkboxes.forEach(cb => checkedCategories.push(cb.value));
    
    if (checkedCategories.length > 0) {
      // If we checked boxes, query backend. MDB route handles single category param or multiple.
      // Let's pass the first category or serialize correctly
      filters.category = checkedCategories[0]; // simplistic fallback for client query
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
      <div class="shimmer h-[380px] rounded-3xl"></div>
      <div class="shimmer h-[380px] rounded-3xl"></div>
      <div class="shimmer h-[380px] rounded-3xl"></div>
    `;

    const filters = getActiveFilters();

    clovasApi.getProducts(filters)
      .then(data => {
        const products = data.products || [];
        resultsCount.textContent = data.total || 0;

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
          card.className = 'group flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/40 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative animate-fade-in';
          card.innerHTML = `
            <!-- Image -->
            <div class="h-64 overflow-hidden relative">
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
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">${prod.category} • ${prod.subCategory}</span>
                <a href="product.html?id=${prod._id}">
                  <h3 class="font-serif text-lg font-bold text-slate-800 dark:text-white leading-snug hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1">${prod.title}</h3>
                </a>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">${prod.description}</p>
              </div>
              
              <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                <div class="flex flex-col">
                  ${priceHtml}
                </div>
                
                <button class="add-to-cart-btn h-11 w-11 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 shadow-md transition-colors" data-id="${prod._id}">
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
              svg.classList.add('fill-red-500', 'text-red-500');
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

  clearFiltersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    filterSearch.value = '';
    filterGender.value = 'All';
    filterSubcategory.value = 'All';
    filterMinPrice.value = '';
    filterMaxPrice.value = '';
    
    const checkboxes = document.querySelectorAll('input[name="category"]');
    checkboxes.forEach(cb => cb.checked = false);

    currentPage = 1;
    fetchAndRenderProducts();
  });

  // Initial load
  initFiltersFromUrl();
  fetchAndRenderProducts();
});
