document.addEventListener('DOMContentLoaded', function() {
  var controls = ['catalog-query','catalog-make','catalog-condition','catalog-location','catalog-price','catalog-sort'];
  controls.forEach(function(id) {
    var field = document.getElementById(id);
    if (!field) return;
    field.addEventListener(id === 'catalog-query' ? 'input' : 'change', filterCatalog);
  });
  var clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.addEventListener('click', clearCatalogFilters);
  applyCatalogParamsFromUrl();
  filterCatalog();
});

function applyCatalogParamsFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var query = params.get('q');
  var make = params.get('make');
  var condition = params.get('condition');
  var location = params.get('location');
  var price = params.get('price');
  var sort = params.get('sort');

  if (query !== null && document.getElementById('catalog-query')) document.getElementById('catalog-query').value = query;
  if (make !== null && document.getElementById('catalog-make')) document.getElementById('catalog-make').value = make;
  if (condition !== null && document.getElementById('catalog-condition')) document.getElementById('catalog-condition').value = condition;
  if (location !== null && document.getElementById('catalog-location')) document.getElementById('catalog-location').value = location;
  if (price !== null && document.getElementById('catalog-price')) document.getElementById('catalog-price').value = price;
  if (sort !== null && document.getElementById('catalog-sort')) document.getElementById('catalog-sort').value = sort;
}

function clearCatalogFilters() {
  catalogPage = 1;
  document.getElementById('catalog-query').value = '';
  document.getElementById('catalog-make').value = '';
  document.getElementById('catalog-condition').value = '';
  document.getElementById('catalog-location').value = '';
  document.getElementById('catalog-price').value = '';
  document.getElementById('catalog-sort').value = 'recent';
  filterCatalog();
}

function filterCatalog() {
  var query = document.getElementById('catalog-query').value.trim().toLowerCase();
  var make = document.getElementById('catalog-make').value.toLowerCase();
  var condition = document.getElementById('catalog-condition').value.toLowerCase();
  var location = document.getElementById('catalog-location').value.toLowerCase();
  var priceValue = document.getElementById('catalog-price').value;
  var sort = document.getElementById('catalog-sort').value;
  var cars = getApprovedCars().filter(function(car) {
    var haystack = [car.year, car.make, car.model, car.location, car.fuel, car.transmission, car.color, car.condition].join(' ').toLowerCase();
    if (query && haystack.indexOf(query) === -1) return false;
    if (make && String(car.make).toLowerCase() !== make) return false;
    if (condition && String(car.condition).toLowerCase() !== condition) return false;
    if (location && String(car.location).toLowerCase() !== location) return false;
    if (priceValue) {
      var range = priceValue.split('-').map(Number);
      if (Number(car.price) < range[0] || Number(car.price) > range[1]) return false;
    }
    return true;
  });
  cars.sort(function(a,b) {
    if (sort === 'price-low') return Number(a.price) - Number(b.price);
    if (sort === 'price-high') return Number(b.price) - Number(a.price);
    if (sort === 'year-new') return Number(b.year) - Number(a.year);
    if (sort === 'mileage-low') return Number(a.mileage || 0) - Number(b.mileage || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  window.catalogCars = cars;
  catalogPage = 1;
  renderCars(cars);
  var count = document.getElementById('catalog-count');
  count.textContent = cars.length + (cars.length === 1 ? ' vehicle available' : ' vehicles available');
}