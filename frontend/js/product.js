import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';
import { addToCart, toggleWishlist, getWishlist, showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }

  // DOM Elements
  const mainProductImg = document.getElementById('main-product-img');
  const productThumbnails = document.getElementById('product-thumbnails');
  const productCategory = document.getElementById('product-category');
  const stockBadge = document.getElementById('stock-badge');
  const productSkuBadge = document.getElementById('product-sku-badge');
  const productTitle = document.getElementById('product-title');
  const ratingStars = document.getElementById('rating-stars');
  const ratingValue = document.getElementById('rating-value');
  const reviewsCount = document.getElementById('reviews-count');
  const productPrice = document.getElementById('product-price');
  const productOldPrice = document.getElementById('product-old-price');
  const productDesc = document.getElementById('product-desc');

  const qtyInput = document.getElementById('qty-input');
  const qtyDec = document.getElementById('qty-dec');
  const qtyInc = document.getElementById('qty-inc');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const detailWishlistBtn = document.getElementById('detail-wishlist-btn');

  const reviewsList = document.getElementById('reviews-list');
  const reviewForm = document.getElementById('review-form');
  const selectedRating = document.getElementById('selected-rating');
  const ratingSelector = document.getElementById('rating-selector');
  const reviewComment = document.getElementById('review-comment');

  let activeProduct = null;

  // Star Rating Helper
  const generateStarsHtml = (rating) => {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) {
      starsHtml += '&#9733;';
    }
    if (halfStar) {
      starsHtml += '<span class="relative overflow-hidden inline-block">&#9733;</span>'; // simplistic half representation
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '&#9734;';
    }
    return starsHtml;
  };

  // Load details
  const loadProductDetails = () => {
    clovasApi.getProductDetails(productId)
      .then(data => {
        const prod = data.product;
        const reviews = data.reviews || [];
        activeProduct = prod;

        // Document Meta
        document.title = `${prod.title} - Clovas Shopping`;

        // Render Image Gallery
        mainProductImg.src = prod.images[0];
        mainProductImg.alt = prod.title;
        
        productThumbnails.innerHTML = '';
        prod.images.forEach((img, idx) => {
          const thumb = document.createElement('button');
          thumb.className = `h-20 w-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-colors ${
            idx === 0 ? 'border-primary-600' : 'border-slate-200 dark:border-slate-800'
          }`;
          thumb.innerHTML = `<img src="${img}" class="w-full h-full object-cover">`;
          thumb.addEventListener('click', () => {
            mainProductImg.src = img;
            // Highlight border
            document.querySelectorAll('#product-thumbnails button').forEach(b => b.classList.replace('border-primary-600', 'border-slate-200'));
            thumb.classList.replace('border-slate-200', 'border-primary-600');
          });
          productThumbnails.appendChild(thumb);
        });

        // Load metadata
        productCategory.textContent = `${prod.category} • ${prod.subCategory}`;
        productTitle.textContent = prod.title;
        productDesc.textContent = prod.description;
        if (productSkuBadge) {
          productSkuBadge.textContent = `CODE: ${prod.sku || 'N/A'}`;
        }

        // Stock badge
        if (prod.stock > 0) {
          stockBadge.textContent = 'In Stock';
          stockBadge.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30';
          addToCartBtn.disabled = false;
          addToCartBtn.textContent = 'Add to Bag';
          addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          stockBadge.textContent = 'Out of Stock';
          stockBadge.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-450 border border-red-100 dark:border-red-900/30';
          addToCartBtn.disabled = true;
          addToCartBtn.textContent = 'Out of Stock';
          addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Ratings & review stats
        ratingValue.textContent = (prod.ratings || 0).toFixed(1);
        reviewsCount.textContent = prod.reviewsCount || 0;
        ratingStars.innerHTML = generateStarsHtml(prod.ratings || 0);

        // Price
        const hasDiscount = prod.discountPrice && prod.discountPrice > 0;
        if (hasDiscount) {
          productPrice.textContent = `${prod.discountPrice} BDT`;
          productOldPrice.textContent = `${prod.price} BDT`;
          productOldPrice.classList.remove('hidden');
        } else {
          productPrice.textContent = `${prod.price} BDT`;
          productOldPrice.classList.add('hidden');
        }

        // Sync Wishlist Button State
        const wishlist = getWishlist();
        const isWishlisted = wishlist.some(item => item._id === prod._id);
        const wishSvg = detailWishlistBtn.querySelector('svg');
        if (isWishlisted) {
          wishSvg.classList.add('fill-red-500', 'text-red-500');
        } else {
          wishSvg.classList.remove('fill-red-500', 'text-red-500');
        }

        // Render Reviews
        renderReviews(reviews);
        
        // Load Related Products
        loadRelated();
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading product details.', 'error');
      });
  };

  const renderReviews = (reviews) => {
    reviewsList.innerHTML = '';
    if (reviews.length === 0) {
      reviewsList.innerHTML = `
        <div class="py-8 text-slate-500 dark:text-slate-400 font-sans italic">
          No reviews yet for this product. Be the first to share your thoughts!
        </div>
      `;
      return;
    }

    reviews.forEach(rev => {
      const revCard = document.createElement('div');
      revCard.className = 'bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40';
      revCard.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <div>
            <h4 class="font-bold text-sm text-slate-800 dark:text-white">${rev.userName}</h4>
            <span class="text-[10px] text-slate-400 font-sans">${new Date(rev.createdAt).toLocaleDateString()}</span>
          </div>
          <!-- Stars -->
          <div class="flex text-amber-400 text-sm">
            ${generateStarsHtml(rev.rating)}
          </div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">${rev.comment}</p>
      `;
      reviewsList.appendChild(revCard);
    });
  };

  const loadRelated = () => {
    const grid = document.getElementById('related-products-grid');
    grid.innerHTML = '<div class="shimmer h-[380px] rounded-3xl"></div>';

    clovasApi.getRelatedProducts(productId)
      .then(related => {
        grid.innerHTML = '';
        if (related.length === 0) {
          grid.innerHTML = '<p class="col-span-full text-slate-400 text-sm italic">No matching related items found.</p>';
          return;
        }

        const wishlist = getWishlist();
        related.forEach(prod => {
          const hasDiscount = prod.discountPrice && prod.discountPrice > 0;
          const isWishlisted = wishlist.some(item => item._id === prod._id);

          const card = document.createElement('div');
          card.className = 'group flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/45 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative';
          card.innerHTML = `
            <div class="h-56 overflow-hidden relative">
              <a href="product.html?id=${prod._id}">
                <img src="${prod.images[0]}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550">
              </a>
              <button class="wishlist-btn absolute top-3 right-3 h-9 w-9 rounded-lg glass flex items-center justify-center text-slate-700 dark:text-slate-350" data-id="${prod._id}">
                <svg class="h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <a href="product.html?id=${prod._id}">
                  <h4 class="font-serif text-sm font-bold hover:text-primary-600 transition-colors line-clamp-1">${prod.title}</h4>
                </a>
                <span class="text-xs font-bold text-slate-800 dark:text-white mt-1 block">${hasDiscount ? prod.discountPrice : prod.price} BDT</span>
              </div>
            </div>
          `;
          
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

          grid.appendChild(card);
        });
      });
  };

  // Quantity control
  qtyDec.addEventListener('click', () => {
    let val = Number(qtyInput.value);
    if (val > 1) {
      qtyInput.value = val - 1;
    }
  });

  qtyInc.addEventListener('click', () => {
    let val = Number(qtyInput.value);
    qtyInput.value = val + 1;
  });

  // Add to Bag
  addToCartBtn.addEventListener('click', () => {
    if (activeProduct) {
      addToCart(activeProduct, Number(qtyInput.value));
    }
  });

  // Wishlist Action
  detailWishlistBtn.addEventListener('click', (e) => {
    if (activeProduct) {
      const isAdded = toggleWishlist(activeProduct);
      const svg = e.currentTarget.querySelector('svg');
      if (isAdded) {
        svg.classList.add('fill-red-500', 'text-red-500');
      } else {
        svg.classList.remove('fill-red-500', 'text-red-500');
      }
    }
  });

  // Review Form Stars Picker
  const stars = ratingSelector.querySelectorAll('span');
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      const rate = e.currentTarget.getAttribute('data-star');
      selectedRating.value = rate;
      
      // highlight active stars
      stars.forEach(s => {
        const starRate = s.getAttribute('data-star');
        if (starRate <= rate) {
          s.classList.add('text-amber-400');
          s.classList.remove('text-slate-300');
        } else {
          s.classList.remove('text-amber-400');
          s.classList.add('text-slate-300');
        }
      });
    });
  });

  // Review Form Submit
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = await clovasAuth.getCurrentUser();
    if (!user) {
      showToast('You must be signed in to post reviews.', 'error');
      window.location.href = 'auth.html';
      return;
    }

    const ratingVal = Number(selectedRating.value);
    if (ratingVal === 0) {
      showToast('Please select a rating score.', 'error');
      return;
    }

    const commentVal = reviewComment.value.trim();

    try {
      await clovasApi.addProductReview(productId, {
        rating: ratingVal,
        comment: commentVal
      });

      showToast('Thank you! Review added successfully.');
      reviewForm.reset();
      selectedRating.value = 0;
      stars.forEach(s => s.classList.replace('text-amber-400', 'text-slate-300'));
      
      // Reload details to display updated averages
      loadProductDetails();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Goto Reviews link trigger scrolling
  document.getElementById('goto-reviews').addEventListener('click', () => {
    document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Initiate Details Loading
  loadProductDetails();
});
