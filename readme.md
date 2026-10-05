#  Mashirika Motors

Kenya's premier car marketplace website — fully functional, no server required.

---

##  Project Structure

```
mashirika-motors/
├── index.html        ← Main website
├── admin.html        ← Admin dashboard
├── css/
│   ├── style.css     ← Main site styles
│   └── admin.css     ← Admin dashboard styles
├── js/
│   ├── db.js         ← Shared database (localStorage)
│   ├── main.js       ← Main site logic
│   └── admin.js      ← Admin dashboard logic
└── README.md
```

---

##  How to Run

Just open `index.html` in any modern web browser. No server, no installation needed.

> For best results, use Chrome, Firefox, Edge or Safari.

---

##  Admin Access

1. Click **Admin Panel** in the navbar (top right)
2. Login with:
   - **Username:** `admin`
   - **Password:** `mashirika123`

---

##  Features

### Main Website
- Modern hero section with animated car
- Sticky search/filter bar (make, condition, location, price)
- Car grid with hover effects and badges
- Car detail modal with full specs
- About section
- Sell your car contact form
- Responsive on mobile

### Admin Dashboard
- Stats overview (total, new, used, avg price)
- Full car listings table
- Add new car listing
- Edit existing listings
- Delete listings
- Car icon picker, badge system

### Database
- Powered by `localStorage` — data persists between visits
- Pre-seeded with 6 real Kenyan car listings
- All admin changes save instantly

---

##  Customization

To change the admin password, open `js/admin.js` and edit:
```js
if (u === 'admin' && p === 'mashirika123')
```

To add more car makes or cities, edit the `<select>` options in `admin.html` and `index.html`.

---

##  Contact Info (update in index.html)
- Phone: +254 700 123 456
- Email: info@mashirikamotors.co.ke
- Location: Westlands, Nairobi

---

 2024 Mashirika Motors · Made in Nairobi
