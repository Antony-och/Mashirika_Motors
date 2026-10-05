// ============================================================
//  Mashirika Motors – Admin JS
// ============================================================

let editingId = null;
let _images   = [];   // working image array for current form
let _delId    = null;
let _rejectId = null;
let _allCache = [];
let _visibleCache = [];

// ── Auth ──────────────────────────────────────────────────────
function doLogin() {
  const username = document.getElementById('login-user');
  const password = document.getElementById('login-pass');
  const error = document.getElementById('login-error');
  const u = username.value.trim();
  const p = password.value;
  error.style.display = 'none';
  if (u === 'admin' && p === 'mashirika123') {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display  = 'flex';
    password.value = '';
    showView('overview');
  } else {
    error.style.display = 'block';
    password.value = '';
    password.focus();
  }
}
function quickAdminLogin() {
  document.getElementById('login-user').value = 'admin';
  document.getElementById('login-pass').value = 'mashirika123';
  doLogin();
}
function toggleAdminPassword() {
  const input = document.getElementById('login-pass');
  const button = document.getElementById('password-toggle');
  if (!input || !button) return;
  const show = input.type === 'password';
  input.type = show? 'text' : 'password';
  button.textContent = show? 'Hide' : 'Show';
  button.setAttribute('aria-label', show? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(show));
}
function doLogout() {
  document.querySelectorAll('.overlay-modal').forEach(function(modal){modal.style.display='none';});
  _delId = null;
  _rejectId = null;
  document.getElementById('dashboard').style.display  = 'none';
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-pass').type = 'password';
  document.getElementById('login-error').style.display = 'none';
  var toggle=document.getElementById('password-toggle');
  toggle.textContent='Show';
  toggle.setAttribute('aria-label','Show password');
  toggle.setAttribute('aria-pressed','false');
  document.getElementById('login-user').focus();
}

// ── View router ───────────────────────────────────────────────
const ALL_VIEWS = ['overview','list','hot-deals','pending','inquiries','form'];

function showView(v) {
  ALL_VIEWS.forEach(id => {
    var el = document.getElementById('view-' + id);
    if (el) el.style.display = 'none';
  });
  var target = (v === 'add' || v === 'edit')? 'form' : v;
  var el = document.getElementById('view-' + target);
  if (el) el.style.display = 'block';

  ['overview','list','hot-deals','pending','inquiries','add'].forEach(id => {
    var b = document.getElementById('nav-' + id);
    if (b) b.classList.remove('active');
  });
  var navKey = (v === 'edit')? 'add' : v;
  var nb = document.getElementById('nav-' + navKey);
  if (nb) nb.classList.add('active');

  if (v === 'overview')  loadOverview();
  if (v === 'list')      loadListView();
  if (v === 'hot-deals') loadHotDealsView();
  if (v === 'pending')   loadPendingView();
  if (v === 'inquiries') loadInquiriesView();
  if (v === 'add')       { editingId = null; resetForm(); }
  refreshBadges();
}

function refreshBadges() {
  var s  = DB.getStats();
  var pb = document.getElementById('pending-badge');
  var ib = document.getElementById('inquiry-badge');
  var hb = document.getElementById('hot-deal-count');
  if (pb) { pb.textContent = s.pending; pb.style.display = s.pending > 0? 'inline-flex' : 'none'; }
  if (ib) { ib.textContent = s.unreadInquiries; ib.style.display = s.unreadInquiries > 0? 'inline-flex' : 'none'; }
  if (hb) hb.textContent = getSelectedHotDealIds().length + '/6';
}

// ── OVERVIEW ──────────────────────────────────────────────────
function adminIcon(name){var paths={car:'<path d="M5 17h14l1-6-2-4H6l-2 4 1 6Z"/><path d="M4 12h16M7 17v2m10-2v2"/>',spark:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',message:'<path d="M20 11a8 7 0 0 1-8 7l-5 2 1-4a7 7 0 1 1 12-5Z"/>',coins:'<circle cx="9" cy="8" r="5"/><path d="M9 5v6m6 1a5 5 0 1 1-2 8"/>',trophy:'<path d="M8 4h8v4a4 4 0 0 1-8 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 0v5m-4 3h8"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',chart:'<path d="M4 19V5m0 14h17M8 15l3-4 3 2 5-7"/>'};return '<svg class="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.car)+'</svg>'; }
function loadOverview() {
  var s = DB.getStats();
  document.getElementById('overview-date').textContent =
    new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  var cards = [
    { label:'Total Listings',   value: s.total,        color:'#6366f1', icon:'car', sub: s.thisMonth + ' added this month' },
    { label:'New Cars',         value: s.newCars,      color:'#10b981', icon:'spark', sub: s.usedCars + ' used cars' },
    { label:'Pending Approval', value: s.pending,      color:'#f59e0b', icon:'clock', sub: 'awaiting review', link:'pending' },
    { label:'Unread Inquiries', value: s.unreadInquiries, color:'#3b82f6', icon:'message', sub: s.totalInquiries + ' total', link:'inquiries' },
    { label:'Average Price',    value: s.total? fmtPrice(s.avgPrice) : '—', color:'#c8102e', icon:'coins', sub: 'across all listings' },
    { label:'Top Make',         value: s.topMake,      color:'#8b5cf6', icon:'trophy', sub: 'most listed make' },
    { label:'Cities Covered',   value: s.locations,    color:'#06b6d4', icon:'pin', sub: 'active locations' },
    { label:'Price Range',      value: s.total? (s.minPrice/1e6).toFixed(1)+'M – '+(s.maxPrice/1e6).toFixed(1)+'M' : '—', color:'#64748b', icon:'chart', sub: 'KES min to max' },
  ];
  document.getElementById('stats-grid').innerHTML = cards.map(function(c) {
    return '<div class="stat-card' + (c.link? ' stat-clickable' : '') + '"' +
      (c.link? ' onclick="showView(\'' + c.link + '\')"' : '') + '>' +
      '<div class="stat-icon">' + adminIcon(c.icon) + '</div>' +
      '<div class="stat-value" style="color:' + c.color + '">' + c.value + '</div>' +
      '<div class="stat-label">' + c.label + '</div>' +
      '<div class="stat-sub">' + c.sub + '</div></div>';
  }).join('');

  var cars = DB.getAll().slice(-5).reverse();
  document.getElementById('recent-listings').innerHTML = cars.length?
    cars.map(function(car) {
        return '<div class="recent-row">' +
          '<div class="recent-img">' + thumbHTML(firstImage(car.images), 44) + '</div>' +
          '<div class="recent-info"><div class="recent-name">' + car.year + ' ' + car.make + ' ' + car.model + '</div>' +
          '<div class="recent-meta">' + car.location + ' · ' + fmtPrice(car.price) + '</div></div>' +
          '<span class="t-badge ' + (car.condition === 'New'? 'badge-new' : 'badge-used') + '">' + car.condition + '</span>' +
          '</div>';
      }).join('')
    : '<p style="color:#94a3b8;padding:20px;text-align:center">No listings yet</p>';

  var makes = {};
  DB.getAll().forEach(function(c) { makes[c.make] = (makes[c.make] || 0) + 1; });
  var sorted = Object.entries(makes).sort(function(a,b){return b[1]-a[1];}).slice(0, 6);
  var maxVal = sorted.length? sorted[0][1] : 1;
  document.getElementById('make-chart').innerHTML = sorted.length?
    sorted.map(function(m) {
        return '<div class="bar-row"><div class="bar-label">' + m[0] + '</div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(m[1]/maxVal*100) + '%"></div></div>' +
          '<div class="bar-count">' + m[1] + '</div></div>';
      }).join('')
    : '<p style="color:#94a3b8;padding:20px;text-align:center">No data</p>';
}

// ── ALL LISTINGS ──────────────────────────────────────────────
function loadListView(){_allCache=DB.getAll();var sel=document.getElementById('filter-make');if(sel){var old=sel.value;var makes=Array.from(new Set(_allCache.map(c=>c.make).filter(Boolean))).sort();sel.innerHTML='<option value="">All makes</option>'+makes.map(m=>'<option value="'+escAttr(m)+'">'+escHtml(m)+'</option>').join('');sel.value=old;}document.getElementById('list-subtitle').textContent=_allCache.length+' listings in database';filterTable();}
const HOT_DEALS_KEY = 'mm_hot_deals';
function getSelectedHotDealIds(){
  try { var saved=localStorage.getItem(HOT_DEALS_KEY); if(saved!==null){var ids=JSON.parse(saved),approved=DB.getAll().filter(c=>!c.status||c.status==='approved');return Array.isArray(ids)?ids.filter(id=>approved.some(c=>c.id===id)).slice(0,6):[];} } catch(e) {}
  return DB.getAll().filter(c=>(!c.status||c.status==='approved')&&String(c.badge||'').toLowerCase()==='hot deal').slice(0,6).map(c=>c.id);
}
function loadHotDealsView(){
  var selected=getSelectedHotDealIds(),cars=DB.getAll().filter(c=>!c.status||c.status==='approved');
  var count=selected.length+'/6 selected',badge=document.getElementById('hot-deal-count');
  document.getElementById('hot-deal-selection-count').textContent=count;
  if(badge)badge.textContent=count;
  var host=document.getElementById('hot-deal-picker');
  if(!cars.length){host.innerHTML='<div class="card hot-deal-empty">There are no approved listings to feature yet.</div>';return;}
  host.innerHTML=cars.map(function(car){var active=selected.includes(car.id);return '<article class="hot-deal-option '+(active?'selected':'')+'">'+thumbHTML(firstImage(car.images),96)+'<div class="hot-deal-option-info"><strong>'+escHtml(car.year+' '+car.make+' '+car.model)+'</strong><span>'+fmtPrice(car.price)+' · '+escHtml(car.location||'')+'</span><small>'+(car.condition||'Used')+' · '+(car.status||'approved')+'</small></div><button class="hot-deal-pick '+(active?'picked':'')+'" onclick="toggleHomepageHotDeal('+car.id+')">'+(active?'Selected':'Feature this car')+'</button></article>';}).join('');
}
function toggleHomepageHotDeal(id){
  var car=DB.getById(id),ids=getSelectedHotDealIds();if(!car||car.status&&car.status!=='approved')return;
  var index=ids.indexOf(id);
  if(index>=0)ids.splice(index,1);else if(ids.length>=6){showToast('Choose up to six Hot Deals','error');return;}else ids.push(id);
  localStorage.setItem(HOT_DEALS_KEY,JSON.stringify(ids));loadHotDealsView();if(document.getElementById('view-list').style.display!=='none')filterTable();
  showToast(index>=0?'Hot Deal removed from homepage':'Hot Deal selected for homepage');
}
function filterTable(){var q=(document.getElementById('search-listings').value||'').toLowerCase(),make=(document.getElementById('filter-make')||{}).value||'',status=(document.getElementById('filter-status')||{}).value||'',sort=(document.getElementById('filter-sort')||{}).value||'newest';var list=_allCache.filter(c=>(!q||[c.make,c.model,c.location,c.condition,c.fuel,String(c.year)].some(v=>String(v||'').toLowerCase().includes(q)))&&(!make||c.make===make)&&(!status||(c.status||'approved')===status));list.sort((a,b)=>sort==='price-high'?Number(b.price||0)-Number(a.price||0):sort==='price-low'?Number(a.price||0)-Number(b.price||0):sort==='year'?Number(b.year||0)-Number(a.year||0):Number(b.id||0)-Number(a.id||0));renderTable(list);}
function renderTable(cars){_visibleCache=cars.slice();if(!cars.length){document.getElementById('table-body').innerHTML='<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8">No listings found</td></tr>';return;}document.getElementById('table-body').innerHTML=cars.map(car=>{var imgs=Array.isArray(car.images)?car.images.filter(i=>i&&i.length>4):[],extra=imgs.length>1?'<div style="font-size:10px;color:#94a3b8;margin-top:3px;text-align:center">+'+(imgs.length-1)+' more</div>':'',status=car.status||'approved',hot=getSelectedHotDealIds().includes(car.id);return '<tr><td>'+thumbHTML(firstImage(car.images),52)+extra+'</td><td><div style="font-weight:600;color:#0f172a;font-size:13px">'+escHtml(car.make)+' '+escHtml(car.model)+'</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">'+(car.fuel||'')+' '+(car.transmission||'')+'</div></td><td>'+car.year+'</td><td style="font-weight:700;color:#c8102e;font-size:13px">'+fmtPrice(car.price)+'</td><td><span class="t-badge '+(car.condition==='New'?'badge-new':'badge-used')+'">'+car.condition+'</span></td><td>'+escHtml(car.location)+'</td><td>'+Number(car.mileage||0).toLocaleString()+' km</td><td><span class="t-badge '+(status==='approved'?'badge-approved':'badge-draft')+'">'+status+'</span></td><td><div class="t-actions"><button class="btn-view" onclick="previewCar('+car.id+')">View</button><button class="btn-edit" onclick="editCar('+car.id+')">Edit</button><button class="btn-hot '+(hot?'active':'')+'" onclick="toggleHomepageHotDeal('+car.id+')">'+(hot?'Hot Deal active':'Set Hot Deal')+'</button><button class="btn-del" aria-label="Delete listing" onclick="openDeleteModal('+car.id+')">Delete</button></div></td></tr>';}).join('');}
function toggleHotDeal(id){toggleHomepageHotDeal(id);}
function exportListings(){var cols=[['Year','year'],['Make','make'],['Model','model'],['Price KES','price'],['Condition','condition'],['Location','location'],['Mileage km','mileage'],['Status','status'],['Badge','badge']],q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',rows=[cols.map(c=>q(c[0])).join(',')].concat(_visibleCache.map(car=>cols.map(c=>q(c[1]==='status'?(car.status||'approved'):car[c[1]])).join(','))),url=URL.createObjectURL(new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='mashirika-listings-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}

function loadPendingView(){
  var all=DB.getPending(),host=document.getElementById('pending-list'),search=(document.getElementById('pending-search').value||'').trim().toLowerCase();
  if(!Array.isArray(all))all=[];
  document.getElementById('pending-subtitle').textContent=all.length+' seller '+(all.length===1?'submission':'submissions')+' waiting for review';
  document.getElementById('pending-summary').innerHTML='<div class="pending-summary-item"><span class="pending-summary-dot"></span><strong>'+all.length+'</strong><span>Awaiting review</span></div><p>Check the seller details and photos before publishing a listing.</p>';
  var list=all.filter(function(item){var text=[item.carMake,item.carModel,item.name,item.email,item.phone,item.location,item.message,item.description].join(' ').toLowerCase();return !search||text.includes(search);});
  list.sort(function(one,two){return new Date(two.submittedAt||0)-new Date(one.submittedAt||0);});
  if(!list.length){
    var title='All caught up',copy='There are no seller submissions waiting for review.';
    if(all.length){title='No matching submissions';copy='Try another search term.';}
    host.innerHTML='<div class="pending-empty"><span class="pending-empty-mark">MM</span><h2>'+title+'</h2><p>'+copy+'</p></div>';return;
  }
  host.innerHTML=list.map(function(item){
    var images=Array.isArray(item.images)?item.images.filter(function(src){return typeof src==='string'&&src.length>4&&(/^https?:\/\//i.test(src)||/^data:image\//i.test(src));}):[];
    var seller=String(item.name||'Seller'),phone=String(item.phone||'').trim(),safePhone=phone.replace(/[^0-9+]/g,''),email=String(item.email||'').trim();
    var phoneLink=safePhone?'<a class="pending-contact-link" href="tel:'+escAttr(safePhone)+'">'+escHtml(phone)+'</a>':'<span class="pending-detail-value">Not provided</span>';
    var emailLink=email?'<a class="pending-contact-link" href="mailto:'+escAttr(email)+'">'+escHtml(email)+'</a>':'<span class="pending-detail-value">Not provided</span>';
    var photos=images.length?'<div class="pending-photo-grid">'+images.map(function(src,index){return '<a class="pending-photo" href="'+escAttr(src)+'" target="_blank" rel="noopener noreferrer" aria-label="Open photo '+(index+1)+' in a new tab"><img src="'+escAttr(src)+'" loading="lazy" alt="'+escAttr(seller+' vehicle photo '+(index+1))+'" onerror="this.parentNode.remove()"/></a>';}).join('')+'</div>':'<div class="pending-no-photos">No photos were included with this submission.</div>';
    var note=String(item.message||item.description||'').trim();
    var submitted=inquiryDateLabel(item.submittedAt);
    var price=Number(item.price||0);if(!Number.isFinite(price))price=0;
    return '<article class="pending-review-card"><header class="pending-review-head"><div class="pending-review-title"><span class="pending-status">Awaiting review</span><h2>'+escHtml(String(item.year||'')+' '+String(item.carMake||'Vehicle')+' '+String(item.carModel||''))+'</h2><span class="pending-submitted">Submitted '+escHtml(submitted)+'</span></div><div class="pending-price">KES '+price.toLocaleString('en-KE')+'</div></header><div class="pending-review-body"><section class="pending-seller-panel"><span class="pending-section-label">Seller</span><strong>'+escHtml(seller)+'</strong><div>'+emailLink+'</div><div>'+phoneLink+'</div></section><section class="pending-vehicle-panel"><span class="pending-section-label">Vehicle details</span><div class="pending-detail-grid">'+pf('Condition',item.condition||'Used')+pf('Mileage',Number(item.mileage||0).toLocaleString()+' km')+pf('Location',item.location||'Not provided')+pf('Fuel',item.fuel||'Not provided')+pf('Transmission',item.transmission||'Not provided')+pf('Colour',item.color||'Not provided')+'</div></section><section class="pending-photos-section"><div class="pending-section-label">Photos <span>'+(images.length?images.length+' attached':'None attached')+'</span></div>'+photos+'</section>'+(note?'<section class="pending-submission-note"><span class="pending-section-label">Seller notes</span><p>'+escHtml(note)+'</p></section>':'')+'</div><footer class="pending-review-actions"><span>Review all information before publishing.</span><div><button class="btn-reject" type="button" onclick="openRejectModal('+Number(item.id)+')">Reject</button><button class="btn-approve" type="button" onclick="doApprovePending('+Number(item.id)+')">Approve and publish</button></div></footer></article>';
  }).join('');
}

function pf(label,value){return '<div class="pending-detail-item"><small>'+escHtml(label)+'</small><strong>'+escHtml(String(value||'Not provided'))+'</strong></div>'; }

function doApprovePending(id){var approved=DB.approvePending(id);if(!approved){showToast('This submission has already been reviewed.','error');loadPendingView();refreshBadges();return;}showToast('Listing approved and published.');loadPendingView();refreshBadges();}
function openRejectModal(id) {
  var item = DB.getPending().find(function(i){ return i.id === id; });
  if (!item) return;
  _rejectId = id;
  document.getElementById('reject-modal-text').textContent =
    '"' + (item.carMake||'') + ' ' + (item.carModel||'') + '" from ' + (item.name||'unknown') + ' will be removed.';
  document.getElementById('reject-modal').style.display = 'flex';
}
function confirmReject(){if(_rejectId===null)return;var rejected=DB.rejectPending(_rejectId);_rejectId=null;document.getElementById('reject-modal').style.display='none';if(!rejected){showToast('This submission has already been reviewed.','error');}else{showToast('Submission rejected.');}loadPendingView();refreshBadges();}

// ── INQUIRIES ─────────────────────────────────────────────────
function inquiryDateLabel(iso){var date=new Date(iso||'');if(isNaN(date.getTime()))return 'Date unavailable';return date.toLocaleString('en-KE',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});}
function loadInquiriesView(){
  var list=DB.getInquiries(),host=document.getElementById('inquiries-list'),summary=document.getElementById('inquiries-summary');
  var search=(document.getElementById('inquiry-search').value||'').trim().toLowerCase(),filter=document.getElementById('inquiry-filter').value||'all';
  var unread=list.filter(function(item){return !item.read;}).length,read=list.length-unread;
  document.getElementById('inquiries-subtitle').textContent=list.length+' total messages | '+unread+' unread';
  summary.innerHTML='<div class="inquiry-stat"><span>Total messages</span><strong>'+list.length+'</strong></div><div class="inquiry-stat"><span>Unread</span><strong>'+unread+'</strong></div><div class="inquiry-stat"><span>Read</span><strong>'+read+'</strong></div>';
  var visible=list.filter(function(item){
    if(filter==='unread'&&item.read)return false;
    if(filter==='read'&&!item.read)return false;
    var text=[item.name,item.email,item.phone,item.carName,item.message].join(' ').toLowerCase();
    return !search||text.includes(search);
  });
  visible.sort(function(one,two){if(Boolean(one.read)!==Boolean(two.read))return one.read?1:-1;return new Date(two.submittedAt||0)-new Date(one.submittedAt||0);});
  if(!visible.length){
    var title='No inquiries yet',copy='Messages from potential buyers will appear here.';
    if(list.length){title='No matching messages';copy='Try another search or change the message filter.';}
    host.innerHTML='<div class="inquiry-empty"><span class="inquiry-empty-mark">MM</span><h2>'+title+'</h2><p>'+copy+'</p></div>';return;
  }
  host.innerHTML=visible.map(function(inq){
    var name=String(inq.name||'Marketplace visitor'),parts=name.trim().split(/\s+/),initials=parts.slice(0,2).map(function(part){return part.charAt(0);}).join('').toUpperCase();
    var email=String(inq.email||'').trim(),phone=String(inq.phone||'').trim(),safePhone=phone.replace(/[^0-9+]/g,''),isRead=Boolean(inq.read),emailAction='',phoneAction='';
    if(email)emailAction='<a class="inquiry-action inquiry-action-primary" href="mailto:'+escAttr(email)+String.fromCharCode(63)+'subject='+encodeURIComponent('Re: Your inquiry to Mashirika Motors')+'">Reply by email</a>';
    if(safePhone)phoneAction='<a class="inquiry-action inquiry-action-secondary" href="tel:'+escAttr(safePhone)+'">Call '+escHtml(phone)+'</a>';
    var vehicle=inq.carName?'<span class="inquiry-vehicle">Vehicle: '+escHtml(inq.carName)+'</span>':'';
    var readButton='<button class="inquiry-action inquiry-action-quiet" onclick="toggleInquiryRead('+Number(inq.id)+','+(!isRead)+')">Mark as '+(isRead?'unread':'read')+'</button>';
    var avatar=initials||'MM',message=String(inq.message||'');
    return '<article class="inquiry-card '+(isRead?'inquiry-read':'inquiry-unread')+'"><header class="inquiry-card-head"><div class="inquiry-person"><span class="inquiry-avatar">'+escHtml(avatar)+'</span><div class="inquiry-person-copy"><div class="inquiry-name-row"><h2>'+escHtml(name)+'</h2><span class="inquiry-status '+(isRead?'read':'unread')+'">'+(isRead?'Read':'Unread')+'</span></div><span class="inquiry-date">'+inquiryDateLabel(inq.submittedAt)+'</span></div></div><button class="inquiry-delete" type="button" aria-label="Delete inquiry from '+escAttr(name)+'" onclick="doDeleteInquiry('+Number(inq.id)+')">Delete</button></header><div class="inquiry-card-meta">'+(email?'<span>'+escHtml(email)+'</span>':'')+(phone?'<span>'+escHtml(phone)+'</span>':'')+vehicle+'</div><p class="inquiry-message">'+(message?escHtml(message):'<span class="inquiry-no-message">No message was included.</span>')+'</p><footer class="inquiry-card-actions">'+emailAction+phoneAction+readButton+'</footer></article>';
  }).join('');
}
function toggleInquiryRead(id,read){DB.setInquiryRead(id,read);loadInquiriesView();refreshBadges();}
function doMarkRead(id){toggleInquiryRead(id,true);}
function doDeleteInquiry(id){if(!window.confirm('Delete this customer inquiry?'))return;DB.deleteInquiry(id);showToast('Inquiry deleted.');loadInquiriesView();refreshBadges();}

// ── MULTI-IMAGE MANAGER ───────────────────────────────────────
function renderImageManager() {
  var wrap = document.getElementById('img-manager');
  if (!wrap) return;

  var itemsHtml = _images.map(function(src, i) {
    var isData = src.startsWith('data:');
    var label  = isData? ' Uploaded' : ' URL';
    return '<div class="img-item">' +
      '<div class="img-item-preview">' +
        '<img src="' + escAttr(src) + '" onerror="this.parentNode.style.background=\'#1e3a5f\';this.style.display=\'none\'" alt="Photo ' + (i+1) + '"/>' +
      '</div>' +
      '<div class="img-item-meta">' +
        '<span class="img-type-tag">' + label + '</span>' +
        '<span class="img-num">Photo ' + (i+1) + (i===0? ' <em>(Cover)</em>' : '') + '</span>' +
      '</div>' +
      '<div class="img-item-btns">' +
        (i > 0? '<button type="button" onclick="imgMove(' + i + ',-1)" title="Move left">&larr;</button>' : '') +
        (i < _images.length - 1? '<button type="button" onclick="imgMove(' + i + ',1)" title="Move right">&rarr;</button>' : '') +
        '<button type="button" onclick="imgRemove(' + i + ')" class="img-remove-btn" title="Remove"></button>' +
      '</div>' +
    '</div>';
  }).join('');

  wrap.innerHTML =
    '<div class="img-items-grid">' + itemsHtml + '</div>' +
    '<div class="img-add-row">' +
      '<div class="img-add-url-wrap">' +
        '<input type="url" id="new-img-url" placeholder="Paste an image URL (https://…) and click Add" class="url-input-inline"/>' +
        '<button type="button" onclick="addImgUrl()" class="btn-add-img">+ Add URL</button>' +
      '</div>' +
      '<label class="btn-add-img btn-upload-lbl">' +
        ' Upload File(s)' +
        '<input type="file" accept="image/*" multiple onchange="addImgFiles(this)" style="display:none"/>' +
      '</label>' +
    '</div>' +
    '<div class="img-count-note">' + _images.length + ' photo' + (_images.length !== 1? 's' : '') +
      ' · First photo is the cover image · Max 10</div>';
}

function addImgUrl() {
  var input = document.getElementById('new-img-url');
  var url   = (input? input.value : '').trim();
  if (!url || !url.startsWith('http')) { showToast('Please enter a valid URL starting with https://', 'error'); return; }
  if (_images.indexOf(url) >= 0)       { showToast('That URL is already in the list', 'error'); return; }
  if (_images.length >= 10)            { showToast('Maximum 10 photos per listing', 'error'); return; }
  _images.push(url);
  if (input) input.value = '';
  renderImageManager();
}

function addImgFiles(input) {
  var files  = Array.from(input.files);
  var loaded = 0;
  if (!files.length) return;
  files.forEach(function(file) {
    if (_images.length >= 10) { showToast('Maximum 10 photos', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('"' + file.name + '" is too large (max 5MB)', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      _images.push(e.target.result);
      loaded++;
      if (loaded === files.length) renderImageManager();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function imgRemove(i)  { _images.splice(i, 1); renderImageManager(); }
function imgMove(i, d) {
  var j = i + d;
  if (j < 0 || j >= _images.length) return;
  var tmp = _images[i]; _images[i] = _images[j]; _images[j] = tmp;
  renderImageManager();
}

// ── SAVE CAR ──────────────────────────────────────────────────
function saveCar() {
  var make  = document.getElementById('f-make').value;
  var model = document.getElementById('f-model').value.trim();
  var price = parseMoneyAmount(document.getElementById('f-price').value);
  if (!make || !model || !Number.isFinite(price) || price <= 0) { showToast('Make, Model and a valid asking price are required', 'error'); return; }

  var car = {
    make:         make,
    model:        model,
    year:         parseInt(document.getElementById('f-year').value)         || new Date().getFullYear(),
    price:        price,
    mileage:      parseInt(document.getElementById('f-mileage').value)      || 0,
    color:        document.getElementById('f-color').value.trim(),
    condition:    document.getElementById('f-condition').value,
    location:     document.getElementById('f-location').value,
    fuel:         document.getElementById('f-fuel').value,
    transmission: document.getElementById('f-transmission').value,
    drive:        document.getElementById('f-drive').value,
    engine:       document.getElementById('f-engine').value,
    badge:        document.getElementById('f-badge').value,
    status:       document.getElementById('f-status').value,
    sellerName:   document.getElementById('f-seller-name').value.trim(),
    sellerPhone:  document.getElementById('f-seller-phone').value.trim(),
    description:  document.getElementById('f-description').value.trim(),
    images:       _images.slice(),
  };

  if (editingId) { DB.updateCar(editingId, car); showToast('Car updated successfully!'); }
  else           { DB.addCar(car);               showToast('New listing added!'); }
  showView('list');
}

// ── EDIT CAR ─────────────────────────────────────────────────
function editCar(id) {
  var car = DB.getById(id);
  if (!car) return;
  editingId = id;

  ALL_VIEWS.forEach(function(vid) {
    var el = document.getElementById('view-' + vid); if (el) el.style.display = 'none';
  });
  document.getElementById('view-form').style.display = 'block';
  ['overview','list','pending','inquiries','add'].forEach(function(nid) {
    var b = document.getElementById('nav-' + nid); if (b) b.classList.remove('active');
  });
  document.getElementById('nav-add').classList.add('active');
  document.getElementById('form-title').textContent    = 'Edit Listing';
  document.getElementById('form-subtitle').textContent = 'Editing: ' + car.make + ' ' + car.model;

  var map = {
    'f-make': car.make, 'f-model': car.model, 'f-year': car.year,
    'f-price': formatMoneyValue(car.price), 'f-mileage': car.mileage, 'f-color': car.color||'',
    'f-condition': car.condition, 'f-location': car.location,
    'f-fuel': car.fuel, 'f-transmission': car.transmission,
    'f-drive': car.drive||'2WD', 'f-engine': car.engine||'',
    'f-badge': car.badge||'', 'f-status': car.status||'approved',
    'f-seller-name': car.sellerName||'', 'f-seller-phone': car.sellerPhone||'',
    'f-description': car.description||''
  };
  Object.keys(map).forEach(function(fid) {
    var el = document.getElementById(fid); if (el) el.value = map[fid];
  });

  _images = Array.isArray(car.images)? car.images.slice() : [];
  renderImageManager();
}

// ── DELETE ────────────────────────────────────────────────────
function openDeleteModal(id) {
  var car = DB.getById(id);
  if (!car) return;
  _delId = id;
  document.getElementById('delete-modal-text').textContent =
    '"' + car.year + ' ' + car.make + ' ' + car.model + '" will be permanently deleted.';
  document.getElementById('delete-modal').style.display = 'flex';
}
function confirmDelete() {
  if (_delId === null) return;
  DB.deleteCar(_delId); _delId = null;
  document.getElementById('delete-modal').style.display = 'none';
  showToast('Listing deleted.');
  loadListView();
}

// ── PREVIEW ───────────────────────────────────────────────────
function previewCar(id) {
  var car  = DB.getById(id);
  if (!car) return;
  var imgs = Array.isArray(car.images)? car.images.filter(function(i){return i&&i.length>4;}) : [];

  var galHtml = '';
  if (imgs.length) {
    galHtml = '<img id="preview-big-img" src="' + escAttr(imgs[0]) + '" style="width:100%;height:200px;object-fit:cover;border-radius:10px;display:block;margin-bottom:10px" onerror="this.style.display=\'none\'" alt="main"/>';
    if (imgs.length > 1) {
      galHtml += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">' +
        imgs.map(function(src, i) {
          return '<img src="' + escAttr(src) + '" style="height:60px;width:90px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ' + (i===0?'#c8102e':'#e2e8f0') + '" onerror="this.style.display=\'none\'" onclick="swapPreviewImg(\'' + escAttr(src) + '\')" alt=""/>';
        }).join('') +
      '</div>';
    }
  } else {
    galHtml = '<div style="height:140px;background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#d5dbe4;margin-bottom:14px">No photo</div>';
  }

  var fields = [
    ['Location',car.location],['Condition',car.condition],['Fuel',car.fuel],
    ['Transmission',car.transmission],['Drive',car.drive||'2WD'],
    ['Mileage',Number(car.mileage||0).toLocaleString()+' km'],
    ['Color',car.color||'—'],['Engine',car.engine?car.engine+'cc':'—'],
    ['Seller',car.sellerName||'—'],['Phone',car.sellerPhone||'—'],
  ];

  document.getElementById('preview-content').innerHTML =
    galHtml +
    '<h2 style="font-size:20px;font-weight:800;margin-bottom:4px">' + escHtml(car.year + ' ' + car.make + ' ' + car.model) + '</h2>' +
    '<div style="font-size:24px;font-weight:900;color:#c8102e;margin-bottom:14px">' + fmtPrice(car.price) + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
    fields.map(function(f) {
      return '<div style="background:#f8fafc;border-radius:8px;padding:9px 12px">' +
        '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">' + f[0] + '</div>' +
        '<div style="font-weight:600;font-size:13px">' + escHtml(String(f[1]||'—')) + '</div></div>';
    }).join('') + '</div>' +
    (car.description? '<div style="background:#f8fafc;border-radius:8px;padding:12px;color:#475569;font-size:13px;line-height:1.6;margin-bottom:12px">' + escHtml(car.description) + '</div>' : '') +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="document.getElementById(\'preview-modal\').style.display=\'none\';editCar(' + car.id + ')" class="btn-red" style="flex:1"> Edit</button>' +
    '<button onclick="document.getElementById(\'preview-modal\').style.display=\'none\';openDeleteModal(' + car.id + ')" class="btn-danger"> Delete</button>' +
    '</div>';

  document.getElementById('preview-modal').style.display = 'flex';
}
function swapPreviewImg(src) {
  var img = document.getElementById('preview-big-img');
  if (img) img.src = src;
}

// ── RESET FORM ────────────────────────────────────────────────
function resetForm() {
  document.getElementById('form-title').textContent    = 'Add New Car';
  document.getElementById('form-subtitle').textContent = 'Fill in the details below';
  ['f-make','f-model','f-color','f-engine','f-seller-name','f-seller-phone','f-description'].forEach(function(fid) {
    var el = document.getElementById(fid); if (el) el.value = '';
  });
  document.getElementById('f-year').value         = new Date().getFullYear();
  document.getElementById('f-mileage').value      = 0;
  document.getElementById('f-price').value        = '';
  document.getElementById('f-condition').value    = 'Used';
  document.getElementById('f-location').value     = 'Nairobi';
  document.getElementById('f-fuel').value         = 'Petrol';
  document.getElementById('f-transmission').value = 'Automatic';
  document.getElementById('f-drive').value        = '2WD';
  document.getElementById('f-badge').value        = '';
  document.getElementById('f-status').value       = 'approved';
  _images = [];
  renderImageManager();
}

// ── Safe thumbnail ────────────────────────────────────────────
function thumbHTML(src,size){var fallback='<div class="admin-photo-empty" style="width:'+size+'px;height:'+size+'px;min-width:'+size+'px;flex-shrink:0">No photo</div>';if(!src||(!src.startsWith('http')&&!src.startsWith('data:')))return fallback;return '<div style="width:'+size+'px;height:'+size+'px;min-width:'+size+'px;border-radius:8px;overflow:hidden;background:#f1f5f9;flex-shrink:0"><img src="'+escAttr(src)+'" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.parentNode.innerHTML=\'<div class=&quot;admin-photo-empty&quot; style=&quot;width:100%;height:100%&quot;>No photo</div>\'"></div>'; }

// ── Helpers ───────────────────────────────────────────────────
function escHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s)  { return escHtml(String(s)).replace(/'/g,'&#39;'); }
function showToast(msg, type) {
  type = type || 'success';
  var t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type; t.style.display = 'block';
  clearTimeout(t._tid); t._tid = setTimeout(function(){ t.style.display = 'none'; }, 3000);
}
