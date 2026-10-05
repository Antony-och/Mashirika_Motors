// ============================================================
//  Mashirika Motors – Main Site JS
// ============================================================

var hotDealsSlide = 0;
var hotDealsTimer = null;
var hotDealsResizeTimer = null;
var hotDealsResizeBound = false;
var catalogPage = 1;
var catalogPageSize = 16;

document.addEventListener('DOMContentLoaded', function() {
  migrateOldData();
  var savedHotDeals = null;
  try {
    var rawHotDeals = localStorage.getItem('mm_hot_deals');
    if (rawHotDeals !== null) savedHotDeals = JSON.parse(rawHotDeals);
  } catch (e) { savedHotDeals = []; }
  var approvedCars = getApprovedCars();
  var hotDeals = Array.isArray(savedHotDeals)
   ? savedHotDeals.slice(0, 6).map(function(id) { return approvedCars.find(function(car) { return car.id === id; }); }).filter(Boolean)
    : approvedCars.filter(function(car) { return String(car.badge || '').toLowerCase() === 'hot deal'; }).slice(0, 6);
  renderCars(hotDeals);
  var hotCount = document.getElementById('results-count');
  if (hotCount) hotCount.textContent = hotDeals.length + (hotDeals.length === 1? ' hand-picked deal' : ' hand-picked deals');
  if (!hotDeals.length) setEmptyCarsMessage('No hot deals selected yet', 'Our admin team has not picked any hot deals. Browse the full inventory to see every available car.');
  setupNavbar();
  setupHamburger();
  setupSellerPhotos();
});

// Wipe old emoji-based seed data
function migrateOldData() {
  try {
    var raw = localStorage.getItem('mm_cars');
    if (raw) {
      var cars = JSON.parse(raw);
      var hasEmoji = cars.some(function(c) {
        return c.img && c.img.length <= 2;
      });
      if (hasEmoji) { DB.reset(); }
    }
  } catch(e) {}
}

function getApprovedCars() {
  return DB.getAll().filter(function(c) {
    return !c.status || c.status === 'approved';
  });
}

function setEmptyCarsMessage(title, message) {
  var empty = document.getElementById('no-results');
  if (!empty) return;
  var heading = empty.querySelector('h3');
  var copy = empty.querySelector('p');
  if (heading) heading.textContent = title;
  if (copy) copy.textContent = message;
}
function setupNavbar() {
  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  });
}
function setupHamburger() {
  var btn  = document.getElementById('hamburger');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobile-menu');
  btn.addEventListener('click', function() {
    var isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
  menu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Render Cars ───────────────────────────────────────────────
function renderCars(cars) {
  var grid  = document.getElementById('cars-grid');
  var noRes = document.getElementById('no-results');
  var count = document.getElementById('results-count');
  var isCatalogPage = !!document.getElementById('catalog-count');

  if (isCatalogPage) {
    var totalPages = Math.max(1, Math.ceil(cars.length / catalogPageSize));
    if (catalogPage > totalPages) catalogPage = totalPages;
    var startIndex = (catalogPage - 1) * catalogPageSize;
    var visibleCars = cars.slice(startIndex, startIndex + catalogPageSize);

    if (grid) grid.innerHTML = visibleCars.map(carCard).join('');
    if (noRes) noRes.style.display = 'none';
    renderCatalogPagination(totalPages);
    if (count) count.textContent = cars.length + ' listing' + (cars.length !== 1 ? 's' : '') + ' found';
    return;
  }

  if (count) count.textContent = cars.length + ' listing' + (cars.length !== 1? 's' : '') + ' found';
  if (!cars.length) {
    if (grid)  grid.innerHTML = '';
    if (noRes) noRes.style.display = 'block';
    setupHotDealsCarousel(0);
    return;
  }
  if (noRes) noRes.style.display = 'none';
  if (grid)  grid.innerHTML = cars.map(carCard).join('');
  setupHotDealsCarousel(cars.length);
}

function renderCatalogPagination(totalPages) {
  var container = document.getElementById('catalog-pagination');
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  var buttons = [];
  buttons.push('<button type="button" class="catalog-page-btn" data-page="' + (catalogPage - 1) + '" ' + (catalogPage === 1 ? 'disabled' : '') + '>Prev</button>');
  for (var i = 1; i <= totalPages; i++) {
    buttons.push('<button type="button" class="catalog-page-btn' + (i === catalogPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>');
  }
  buttons.push('<button type="button" class="catalog-page-btn" data-page="' + (catalogPage + 1) + '" ' + (catalogPage === totalPages ? 'disabled' : '') + '>Next</button>');
  container.innerHTML = buttons.join('');
  container.style.display = 'flex';

  container.querySelectorAll('.catalog-page-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var nextPage = Number(this.dataset.page);
      if (!nextPage || nextPage < 1 || nextPage > totalPages) return;
      catalogPage = nextPage;
      if (typeof window.catalogCars !== 'undefined') renderCars(window.catalogCars);
    });
  });
}

function hotDealsVisibleCount() {
  if (window.matchMedia('(max-width: 640px)').matches) return 1;
  if (window.matchMedia('(max-width: 960px)').matches) return 2;
  return 3;
}
function setupHotDealsCarousel(total) {
  var grid=document.getElementById('cars-grid'),controls=document.getElementById('hot-deals-controls'),dots=document.getElementById('hot-deals-dots'),shell=document.getElementById('hot-deals-carousel');
  if(!grid||!controls||!dots||!shell)return;
  if(!hotDealsResizeBound){hotDealsResizeBound=true;window.addEventListener('resize',function(){clearTimeout(hotDealsResizeTimer);hotDealsResizeTimer=setTimeout(function(){setupHotDealsCarousel(grid.children.length);},120);});}
  clearInterval(hotDealsTimer);hotDealsSlide=0;
  grid.style.transform='translateX(0)';
  var pages=Math.max(0,total-hotDealsVisibleCount());
  controls.style.display=pages>0?'flex':'none';
  dots.innerHTML='';
  for(var i=0;i<=pages;i++){
    var dot=document.createElement('button');dot.type='button';dot.className='hot-deals-dot'+(i===0?' active':'');dot.setAttribute('aria-label','Show hot deals slide '+(i+1));dot.setAttribute('role','tab');dot.addEventListener('click',function(index){return function(){goToHotDeals(index);};}(i));dots.appendChild(dot);
  }
  if(pages>0&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){hotDealsTimer=setInterval(function(){goToHotDeals(hotDealsSlide>=pages?0:hotDealsSlide+1);},5000);}
  shell.onmouseenter=function(){clearInterval(hotDealsTimer);};
  shell.onmouseleave=function(){if(pages>0&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)hotDealsTimer=setInterval(function(){goToHotDeals(hotDealsSlide>=pages?0:hotDealsSlide+1);},5000);};
}
function goToHotDeals(index){
  var grid=document.getElementById('cars-grid'),dots=document.querySelectorAll('#hot-deals-dots .hot-deals-dot');if(!grid||!grid.children.length)return;
  var max=Math.max(0,grid.children.length-hotDealsVisibleCount());hotDealsSlide=Math.max(0,Math.min(index,max));
  var card=grid.children[0],gap=parseFloat(getComputedStyle(grid).gap)||0,step=card.getBoundingClientRect().width+gap;
  grid.style.transform='translateX(-'+(hotDealsSlide*step)+'px)';
  dots.forEach(function(dot,i){dot.classList.toggle('active',i===hotDealsSlide);dot.setAttribute('aria-selected',String(i===hotDealsSlide));});
}
function moveHotDeals(direction){var max=Math.max(0,document.getElementById('cars-grid').children.length-hotDealsVisibleCount());goToHotDeals(hotDealsSlide+direction>max?0:hotDealsSlide+direction<0?max:hotDealsSlide+direction);}

function representativePhoto(car) {
  var name = ((car.make || '') + ' ' + (car.model || '')).toLowerCase();
  if (/hilux|pickup|truck/.test(name)) return 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=82';
  if (/land cruiser|forester|x-trail|cx-5|suv|cr-v/.test(name)) return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=82';
  if (/mercedes|c200|sedan/.test(name)) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=82';
  return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=82';
}
function carCard(car) {
  var imgs = Array.isArray(car.images)? car.images.filter(function(i){return i&&i.length>4;}) : [];
  var cover = imgs.length? imgs[0] : '';
  var photo = representativePhoto(car);
  var thumbInner = cover
   ? '<img src="' + cover + '" class="car-img" alt="' + car.make + ' ' + car.model + '" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"/><img src="' + photo + '" class="car-img car-img-fallback" alt="' + car.make + ' ' + car.model + '" style="display:none" loading="lazy"/>'
    : '<img src="' + photo + '" class="car-img" alt="' + car.make + ' ' + car.model + '" loading="lazy"/>';
  return '<div class="car-card" onclick="openModal(' + car.id + ')">' +
    '<div class="car-thumb">' + thumbInner +
    '</div>' +
    '<div class="car-body">' +
      '<div class="car-title">' + car.year + ' ' + car.make + ' ' + car.model + '</div>' +
      '<div class="car-meta">' +
        '<span>Location: ' + car.location + '</span>' +
        '<span>Mileage: ' + Number(car.mileage||0).toLocaleString() + ' km</span>' +
        '<span>Fuel: ' + car.fuel + '</span>' +
      '</div>' +
      '<div class="car-footer">' +
        '<div class="car-price">' + fmtPrice(car.price) + '</div>' +
        '<div class="car-btn">View Details</div>' +
      '</div>' +
    '</div></div>';
}
// ── Search ────────────────────────────────────────────────────
function searchCars() {
  var params = new URLSearchParams();

  var query = document.getElementById('catalog-query');
  if (query && query.value.trim()) params.set('q', query.value.trim());

  var makeField = document.getElementById('f-make') || document.getElementById('catalog-make');
  if (makeField && makeField.value) params.set('make', makeField.value);

  var conditionField = document.getElementById('f-condition') || document.getElementById('catalog-condition');
  if (conditionField && conditionField.value) params.set('condition', conditionField.value);

  var locationField = document.getElementById('f-location') || document.getElementById('catalog-location');
  if (locationField && locationField.value) params.set('location', locationField.value);

  var priceField = document.getElementById('f-price') || document.getElementById('catalog-price');
  if (priceField && priceField.value) params.set('price', priceField.value);

  var sortField = document.getElementById('f-sort') || document.getElementById('catalog-sort');
  if (sortField && sortField.value) params.set('sort', sortField.value);

  var target = 'cars.html';
  if (params.toString()) target += '?' + params.toString();
  window.location.href = target;
}

// ── Modal ─────────────────────────────────────────────────────
var _modalCarId = null;
var _modalImgIdx = 0;

function openModal(id) {
  var car = DB.getById(id);
  if (!car) return;
  _modalCarId = id;
  _modalImgIdx = 0;

  var imgs = Array.isArray(car.images)? car.images.filter(function(i){return i&&i.length>4;}) : [];
  var galleryHtml = imgs.length
   ? '<div class="modal-gallery">' +
        '<div class="modal-gallery-main" ontouchstart="galleryTouchStart(event)" ontouchend="galleryTouchEnd(event)">' +
          '<img id="modal-main-img" src="' + imgs[0] + '" alt="' + car.year + ' ' + car.make + ' ' + car.model + '" onerror="this.style.display=\'none\';document.getElementById(\'modal-img-fb\').style.display=\'flex\'">' +
          '<div id="modal-img-fb" class="modal-img-fallback" style="display:none"><img src="' + representativePhoto(car) + '" alt="Representative vehicle photo"></div>' +
          (imgs.length > 1? '<button class="gal-arrow gal-prev" type="button" aria-label="Previous photo" onclick="modalImg(-1)">&#8249;</button><button class="gal-arrow gal-next" type="button" aria-label="Next photo" onclick="modalImg(1)">&#8250;</button><div class="gal-counter" id="gal-counter" aria-live="polite">Photo 1 of ' + imgs.length + '</div>' : '') +
        '</div>' +
        (imgs.length > 1? '<div class="modal-thumbs">' + imgs.map(function(src,i){return '<button class="modal-thumb-button' + (i===0?' active':'') + '" type="button" onclick="setModalImg(' + i + ')" aria-label="Show photo ' + (i+1) + '" aria-pressed="' + (i===0?'true':'false') + '"><img src="' + src + '" class="modal-thumb-sm" loading="lazy" alt="Photo ' + (i+1) + '"></button>';}).join('') + '</div>' : '') +
      '</div>'
    : '<div class="modal-gallery modal-gallery-representative"><div class="modal-gallery-main"><img src="' + representativePhoto(car) + '" class="modal-representative-img" alt="Representative photo for ' + car.make + ' ' + car.model + '"><span class="modal-image-label">Representative photo · seller photos not supplied</span></div></div>';

  var details = [
    ['Location', car.location || '—'], ['Condition', car.condition || '—'],
    ['Fuel', car.fuel || '—'], ['Transmission', car.transmission || '—'],
    ['Mileage', Number(car.mileage||0).toLocaleString()+' km'], ['Color', car.color||'—']
  ];
  if (car.drive) details.push(['Drive', car.drive]);
  if (car.engine) details.push(['Engine', car.engine + ' cc']);

  var phone = car.sellerPhone || '+254 700 123 456';
  var cleanPhone = phone.replace(/[^+\d]/g, '');
  var whatsappPhone = phone.replace(/\D/g, '');
  var title = [car.year, car.make, car.model].filter(Boolean).join(' ');
  document.getElementById('modal-content').innerHTML =
    galleryHtml +
    '<div class="modal-info">' +
      '<div class="modal-kicker">' + (car.condition || 'Quality') + ' vehicle' + (car.location? ' · ' + car.location : '') + '</div>' +
      '<h2>' + title + '</h2>' +
      '<div class="modal-price-row"><div class="modal-price">' + fmtPrice(car.price) + '</div><span>Asking price</span></div>' +
      '<div class="modal-details">' + details.map(function(d){return '<div class="detail-item"><small>' + d[0] + '</small><strong>' + d[1] + '</strong></div>';}).join('') + '</div>' +
      (car.description? '<div class="modal-description"><h3>About this car</h3><p class="modal-desc">' + car.description + '</p></div>' : '') +
      '<div class="modal-contact"><a href="tel:' + cleanPhone + '" class="btn-call">Call seller <span>' + phone + '</span></a>' +
      '<a href="https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent('Hi, I’m interested in the ' + title + ' listed for ' + fmtPrice(car.price) + '.') + '" class="btn-whatsapp" target="_blank" rel="noopener">WhatsApp seller</a></div>' +
      '<p class="modal-note">Mention this listing: <strong>MM-' + car.id + '</strong></p>' +
    '</div>';

  var modal = document.getElementById('car-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  var close = modal.querySelector('.modal-close');
  if (close) close.focus();
}
var _galleryTouchX = null;
function galleryTouchStart(e) {
  _galleryTouchX = e.changedTouches && e.changedTouches.length? e.changedTouches[0].clientX : null;
}
function galleryTouchEnd(e) {
  if (_galleryTouchX === null || !e.changedTouches || !e.changedTouches.length) return;
  var delta = e.changedTouches[0].clientX - _galleryTouchX;
  _galleryTouchX = null;
  if (Math.abs(delta) > 45) modalImg(delta < 0? 1 : -1);
}
function modalImg(dir) {
  var car  = DB.getById(_modalCarId);
  if (!car) return;
  var imgs = Array.isArray(car.images)? car.images.filter(function(i){return i&&i.length>4;}) : [];
  if (!imgs.length) return;
  _modalImgIdx = (_modalImgIdx + dir + imgs.length) % imgs.length;
  setModalImg(_modalImgIdx);
}

function setModalImg(idx) {
  var car  = DB.getById(_modalCarId);
  if (!car) return;
  var imgs = Array.isArray(car.images)? car.images.filter(function(i){return i&&i.length>4;}) : [];
  if (!imgs[idx]) return;
  _modalImgIdx = idx;

  var main = document.getElementById('modal-main-img');
  if (main) { main.style.display = 'block'; main.src = imgs[idx]; }

  var fb = document.getElementById('modal-img-fb');
  if (fb) fb.style.display = 'none';

  var counter = document.getElementById('gal-counter');
  if (counter) counter.textContent = 'Photo ' + (idx + 1) + ' of ' + imgs.length;

  document.querySelectorAll('.modal-thumb-button').forEach(function(t, i) {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-pressed', String(i === idx));
    if (i === idx) {
      var rail = t.parentElement;
      if (t.offsetLeft < rail.scrollLeft) rail.scrollLeft = t.offsetLeft;
      else if (t.offsetLeft + t.offsetWidth > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = t.offsetLeft + t.offsetWidth - rail.clientWidth;
    }
  });
}

function closeModal(e) {
  if (e && e.target.id !== 'car-modal') return;
  document.getElementById('car-modal').classList.remove('active');
  document.body.style.overflow = '';
  _modalCarId = null;
}document.addEventListener('keydown', function(e) {
  var modal = document.getElementById('car-modal');
  if (!modal || !modal.classList.contains('active')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') modalImg(1);
  if (e.key === 'ArrowLeft')  modalImg(-1);
});

// ── Sell / Contact Form ───────────────────────────────────────
var _sellerPhotos = [];
var _sellerPhotoBusy = false;
var SELLER_PHOTO_LIMIT = 5;

function setupSellerPhotos() {
  var input = document.getElementById('seller-photo-files');
  if (input) input.addEventListener('change', function() { addSellerPhotoFiles(Array.from(input.files || [])); input.value = ''; });
  var urlInput = document.getElementById('seller-photo-url');
  if (urlInput) urlInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addSellerPhotoUrl(); } });
  renderSellerPhotoGrid();
}

function sellerPhotoStatus(message, isError) {
  var status = document.getElementById('seller-photo-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', !!isError);
}

function renderSellerPhotoGrid() {
  var grid = document.getElementById('seller-photo-grid');
  if (!grid) return;
  grid.replaceChildren();
  _sellerPhotos.forEach(function(src, index) {
    var item = document.createElement('div');
    item.className = 'sell-photo-item';
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Vehicle photo ' + (index + 1);
    img.loading = 'lazy';
    img.onerror = function() { item.classList.add('is-invalid'); sellerPhotoStatus('A photo URL could not load. Remove it or paste a direct image link.', true); };
    var tag = document.createElement('span');
    tag.className = 'sell-photo-tag';
    tag.textContent = index === 0? 'Cover photo' : 'Photo ' + (index + 1);
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'sell-photo-remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove photo ' + (index + 1));
    remove.addEventListener('click', function() { _sellerPhotos.splice(index, 1); renderSellerPhotoGrid(); });
    item.appendChild(img);
    item.appendChild(tag);
    item.appendChild(remove);
    grid.appendChild(item);
  });
  var full = _sellerPhotos.length >= SELLER_PHOTO_LIMIT;
  var fileInput = document.getElementById('seller-photo-files');
  if (fileInput) fileInput.disabled = full || _sellerPhotoBusy;
  var urlInput = document.getElementById('seller-photo-url');
  var urlButton = document.querySelector('.sell-url-add button');
  if (urlInput) urlInput.disabled = full || _sellerPhotoBusy;
  if (urlButton) urlButton.disabled = full || _sellerPhotoBusy;
  var submit = document.querySelector('#sell-form [type=submit]');
  if (submit) submit.disabled = _sellerPhotoBusy;
}

function addSellerPhotoUrl() {
  var input = document.getElementById('seller-photo-url');
  var value = input? input.value.trim() : '';
  if (!value) { sellerPhotoStatus('Paste a direct image URL to add a photo.', true); return; }
  var url;
  try { url = new URL(value); } catch(e) { sellerPhotoStatus('Enter a valid image URL.', true); return; }
  if (url.protocol !== 'https:') { sellerPhotoStatus('Use a secure image URL that starts with https://.', true); return; }
  if (_sellerPhotos.length >= SELLER_PHOTO_LIMIT) { sellerPhotoStatus('You can attach up to 5 photos.', true); return; }
  if (_sellerPhotos.indexOf(value) !== -1) { sellerPhotoStatus('That photo URL is already attached.', true); return; }
  _sellerPhotos.push(value);
  if (input) input.value = '';
  sellerPhotoStatus('Photo URL added. Make sure it links directly to an image.', false);
  renderSellerPhotoGrid();
}

async function sellerImageData(file) {
  var bitmap = await createImageBitmap(file);
  var maxSide = 1400;
  var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  var width = Math.max(1, Math.round(bitmap.width * scale));
  var height = Math.max(1, Math.round(bitmap.height * scale));
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var result = '';
  for (var attempt = 0; attempt < 5; attempt++) {
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    var quality = Math.max(.48, .76 - attempt * .07);
    result = canvas.toDataURL('image/jpeg', quality);
    if (result.length * .75 <= 220 * 1024 || attempt === 4) break;
    width = Math.max(1, Math.round(width * .82));
    height = Math.max(1, Math.round(height * .82));
  }
  bitmap.close();
  return result;
}

async function addSellerPhotoFiles(files) {
  if (!files.length) return;
  var accepted = 0;
  var rejected = 0;
  _sellerPhotoBusy = true;
  renderSellerPhotoGrid();
  sellerPhotoStatus('Preparing photos…', false);
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (_sellerPhotos.length >= SELLER_PHOTO_LIMIT) { rejected += files.length - i; break; }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || file.size > 8 * 1024 * 1024) { rejected++; continue; }
    try {
      _sellerPhotos.push(await sellerImageData(file));
      accepted++;
      renderSellerPhotoGrid();
    } catch(e) { rejected++; }
  }
  _sellerPhotoBusy = false;
  renderSellerPhotoGrid();
  if (rejected) sellerPhotoStatus(accepted + ' photo' + (accepted === 1? '' : 's') + ' added. ' + rejected + ' could not be added; use JPG, PNG or WebP up to 8 MB.', true);
  else sellerPhotoStatus(_sellerPhotos.length + ' of ' + SELLER_PHOTO_LIMIT + ' photos attached. First photo is the cover.', false);
}

function resetSellerForm() {
  var form = document.getElementById('sell-form');
  if (form) { form.reset(); form.style.display = 'grid'; }
  var success = document.getElementById('form-success');
  if (success) success.style.display = 'none';
  _sellerPhotos = [];
  sellerPhotoStatus('JPG, PNG or WebP. Uploads are resized for the listing.', false);
  renderSellerPhotoGrid();
}
function submitListing(e) {
  e.preventDefault();
  if (_sellerPhotoBusy) { sellerPhotoStatus('Wait for the photo uploads to finish before submitting.', true); return; }
  if (document.querySelector('.sell-photo-item.is-invalid')) { sellerPhotoStatus('Remove any photo that could not load before submitting.', true); return; }
  var form = e.target;

  function g(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el? (el.value || '').trim() : '';
  }

  var carMake  = g('car-make');
  var carModel = g('car-model');
  var year     = g('car-year');
  var price    = parseMoneyAmount(g('car-price'));
  var name     = g('name');
  var email    = g('email');
  var phone    = g('phone');

  if (!Number.isFinite(price) || price <= 0) {
    document.getElementById('sell-price').focus();
    sellerPhotoStatus('Enter a valid asking price in KES.', true);
    return;
  }

  // Save as pending listing for admin approval
  DB.submitPending({
    name:         name,
    email:        email,
    phone:        phone,
    carMake:      carMake,
    carModel:     carModel,
    year:         year,
    price:        price,
    mileage:      g('mileage') || '0',
    condition:    g('condition') || 'Used',
    location:     g('location') || 'Nairobi',
    fuel:         g('fuel')     || 'Petrol',
    transmission: g('transmission') || 'Automatic',
    color:        g('color'),
    message:      g('message'),
    images:       _sellerPhotos.slice(),
  });

  // Also save as inquiry so admin sees the message
  DB.addInquiry({
    name:    name,
    email:   email,
    phone:   phone,
    carId:   null,
    carName: carMake + ' ' + carModel,
    message: 'Wants to sell: ' + carMake + ' ' + carModel +
             ' (' + year + ') for KES ' + Number(price).toLocaleString() +
             (g('message')? '. Note: ' + g('message') : ''),
  });

  form.style.display = 'none';
  document.getElementById('form-success').style.display = 'flex';
  _sellerPhotos = [];
  renderSellerPhotoGrid();
}
