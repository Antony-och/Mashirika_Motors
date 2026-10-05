// ============================================================
//  Mashirika Motors – Database (localStorage)
//  img field is now an ARRAY: images[]
//  Legacy single-string img is auto-migrated to [img]
// ============================================================

const DB = {
  CARS_KEY:      'mm_cars',
  PENDING_KEY:   'mm_pending',
  INQUIRIES_KEY: 'mm_inquiries',

  // ── Cars ─────────────────────────────────────────────────
  getAll() {
    try {
      const raw = localStorage.getItem(this.CARS_KEY);
      if (raw) return JSON.parse(raw).map(this._migrateCar);
      return this._seed();
    } catch(e) { return this._seed(); }
  },
  // Migrate legacy single-string img → images array
  _migrateCar(c) {
    if (!c.images) {
      c.images = (c.img && c.img.length > 2) ? [c.img] : [];
      delete c.img;
    }
    return c;
  },
  saveCars(cars) { localStorage.setItem(this.CARS_KEY, JSON.stringify(cars)); },
  addCar(car) {
    const cars = this.getAll();
    car.id = Date.now();
    car.status    = car.status || 'approved';
    car.createdAt = new Date().toISOString();
    if (!car.images) car.images = [];
    delete car.img;
    cars.push(car);
    this.saveCars(cars);
    return car;
  },
  updateCar(id, data) {
    if (!data.images) data.images = [];
    delete data.img;
    const cars = this.getAll().map(c => c.id === id ? { ...c, ...data, id } : c);
    this.saveCars(cars);
  },
  deleteCar(id) { this.saveCars(this.getAll().filter(c => c.id !== id)); },
  getById(id)   { return this.getAll().find(c => c.id === id) || null; },

  // ── Pending ───────────────────────────────────────────────
  getPending() {
    try {
      const raw = localStorage.getItem(this.PENDING_KEY);
      if (raw !== null) {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      }
      return this._seedPending();
    } catch(e) { return []; }
  },
  savePending(list) { localStorage.setItem(this.PENDING_KEY, JSON.stringify(list)); },
  submitPending(data) {
    const list = this.getPending();
    const item = { ...data, id: Date.now(), submittedAt: new Date().toISOString(), status: 'pending' };
    if (!item.images) item.images = [];
    list.push(item);
    this.savePending(list);
    return item;
  },
  approvePending(id) {
    const list = this.getPending();
    const item = list.find(i => i.id === id);
    if (!item) return false;
    const car = {
      make:         item.carMake           || 'Unknown',
      model:        item.carModel          || 'Unknown',
      year:         parseInt(item.year)    || new Date().getFullYear(),
      price:        parseMoneyAmount(item.price),
      mileage:      parseInt(item.mileage) || 0,
      color:        item.color             || '',
      condition:    item.condition         || 'Used',
      location:     item.location          || 'Nairobi',
      fuel:         item.fuel              || 'Petrol',
      transmission: item.transmission      || 'Automatic',
      badge:        '',
      description:  item.description       || item.message || '',
      images:       Array.isArray(item.images) ? item.images : [],
      sellerName:   item.name              || '',
      sellerPhone:  item.phone             || '',
      sellerEmail:  item.email             || '',
      status:       'approved',
    };
    this.addCar(car);
    this.savePending(list.filter(i => i.id !== id));
    return true;
  },
  rejectPending(id) {
    const list = this.getPending();
    if (!list.some(i => i.id === id)) return false;
    this.savePending(list.filter(i => i.id !== id));
    return true;
  },

  // ── Inquiries ─────────────────────────────────────────────
  getInquiries() {
    try {
      const raw = localStorage.getItem(this.INQUIRIES_KEY);
      if (raw !== null) {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      }
      return this._seedInquiries();
    } catch(e) { return []; }
  },
  saveInquiries(list) { localStorage.setItem(this.INQUIRIES_KEY, JSON.stringify(list)); },
  addInquiry(data) {
    const list = this.getInquiries();
    const item = { ...data, id: Date.now(), submittedAt: new Date().toISOString(), read: false };
    list.unshift(item);
    this.saveInquiries(list);
    return item;
  },
  markInquiryRead(id) {
    this.setInquiryRead(id, true);
  },
  setInquiryRead(id, read) {
    this.saveInquiries(this.getInquiries().map(i => i.id === id ? { ...i, read: Boolean(read) } : i));
  },
  deleteInquiry(id) { this.saveInquiries(this.getInquiries().filter(i => i.id !== id)); },

  // ── Stats ─────────────────────────────────────────────────
  getStats() {
    const cars      = this.getAll();
    const pending   = this.getPending();
    const inquiries = this.getInquiries();
    const prices    = cars.map(c => c.price).filter(Boolean);
    const makes     = {};
    cars.forEach(c => { makes[c.make] = (makes[c.make] || 0) + 1; });
    const topMake   = Object.entries(makes).sort((a,b) => b[1]-a[1])[0];
    const now       = new Date();
    return {
      total:           cars.length,
      newCars:         cars.filter(c => c.condition === 'New').length,
      usedCars:        cars.filter(c => c.condition === 'Used').length,
      avgPrice:        prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0,
      minPrice:        prices.length ? Math.min(...prices) : 0,
      maxPrice:        prices.length ? Math.max(...prices) : 0,
      pending:         pending.length,
      unreadInquiries: inquiries.filter(i => !i.read).length,
      totalInquiries:  inquiries.length,
      topMake:         topMake ? topMake[0] : '—',
      locations:       new Set(cars.map(c => c.location)).size,
      thisMonth:       cars.filter(c => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    };
  },

  // ── Seeds ─────────────────────────────────────────────────
  _seed() {
    const cars = [
      { id:1, make:'Toyota',   model:'Land Cruiser V8',  year:2021, price:9500000, condition:'Used', location:'Nairobi',  mileage:42000, fuel:'Petrol',  transmission:'Automatic', color:'White',  images:[], badge:'Popular',  status:'approved', createdAt:'2024-11-01T10:00:00Z', description:'Immaculate condition, full service history, one careful owner.' },
      { id:2, make:'Subaru',   model:'Forester XT',      year:2020, price:2800000, condition:'Used', location:'Nairobi',  mileage:58000, fuel:'Petrol',  transmission:'Automatic', color:'Silver', images:[], badge:'Hot Deal', status:'approved', createdAt:'2024-11-03T10:00:00Z', description:'Turbocharged, sunroof, all-wheel drive. Very sporty drive.' },
      { id:3, make:'Mercedes', model:'C200 AMG Line',    year:2022, price:6200000, condition:'New',  location:'Nairobi',  mileage:5000,  fuel:'Petrol',  transmission:'Automatic', color:'Black',  images:[], badge:'Featured', status:'approved', createdAt:'2024-11-05T10:00:00Z', description:'Barely used, full factory warranty, loaded with features.' },
      { id:4, make:'Toyota',   model:'Hilux Double Cab', year:2023, price:4800000, condition:'New',  location:'Mombasa',  mileage:0,     fuel:'Diesel',  transmission:'Automatic', color:'Grey',   images:[], badge:'New',      status:'approved', createdAt:'2024-11-08T10:00:00Z', description:'Brand new, perfect for tough Kenyan terrain. Dealer stock.' },
      { id:5, make:'Nissan',   model:'X-Trail',          year:2019, price:1950000, condition:'Used', location:'Kisumu',   mileage:71000, fuel:'Petrol',  transmission:'Automatic', color:'Blue',   images:[], badge:'',         status:'approved', createdAt:'2024-11-10T10:00:00Z', description:'Family SUV, 7-seater, well maintained with service records.' },
      { id:6, make:'Mazda',    model:'CX-5',             year:2021, price:3100000, condition:'Used', location:'Nakuru',   mileage:33000, fuel:'Petrol',  transmission:'Automatic', color:'Red',    images:[], badge:'',         status:'approved', createdAt:'2024-11-12T10:00:00Z', description:'Sporty crossover, low mileage, excellent fuel economy.' },
    ];
    this.saveCars(cars);
    return cars;
  },
  _seedPending() {
    const list = [{
      id:9001, name:'John Kamau', email:'jkamau@gmail.com', phone:'+254712345678',
      carMake:'Honda', carModel:'CR-V', year:'2020', price:'2200000', mileage:'45000',
      condition:'Used', location:'Nairobi', fuel:'Petrol', transmission:'Automatic',
      color:'White', images:[], description:'Good condition, no accidents, all service done at Honda Kenya.',
      submittedAt:'2024-11-14T08:30:00Z', status:'pending'
    }];
    this.savePending(list);
    return list;
  },
  _seedInquiries() {
    const list = [{
      id:8001, name:'Alice Wanjiku', email:'alice@email.com', phone:'+254700111222',
      carId:1, carName:'2021 Toyota Land Cruiser V8',
      message:'Is this car still available? Can I arrange a test drive this weekend?',
      submittedAt:'2024-11-13T14:20:00Z', read:false
    }];
    this.saveInquiries(list);
    return list;
  },
  reset() {
    localStorage.removeItem(this.CARS_KEY);
    localStorage.removeItem(this.PENDING_KEY);
    localStorage.removeItem(this.INQUIRIES_KEY);
    this._seed(); this._seedPending(); this._seedInquiries();
  }
};

// ── Helpers ───────────────────────────────────────────────────
function fmtPrice(n) { return 'KES ' + Number(n).toLocaleString('en-KE'); }

function parseMoneyAmount(value) {
  var digits = String(value == null ? '' : value).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

function formatMoneyValue(value) {
  var amount = parseMoneyAmount(value);
  return amount ? String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
}

function formatMoneyInput(input) {
  if (!input) return;
  var digits = String(input.value).replace(/[^0-9]/g, '');
  if (!digits) {
    input.value = '';
    return;
  }
  input.value = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return d + 'd ago';
  if (h > 0) return h + 'h ago';
  if (m > 0) return m + 'm ago';
  return 'just now';
}

// Return first valid image from images array, or ''
function firstImage(images) {
  if (!Array.isArray(images)) return '';
  return images.find(i => i && i.length > 2) || '';
}

const BADGE_COLORS = {
  'Popular':  '#f59e0b',
  'Hot Deal': '#ef4444',
  'Featured': '#8b5cf6',
  'New':      '#10b981'
};
