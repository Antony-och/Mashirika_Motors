# Mashirika Motors

Mashirika Motors is a static, client-side car marketplace for Kenya. It lets buyers browse available vehicles, filter by price and location, and connect directly with sellers. The project is designed to run without a backend, using browser storage for quick local demos and admin management.

## Features

- Home landing page with hero section and search filters
- Cars listing page with search, filtering, sorting, and pagination
- Responsive product cards with pricing and vehicle details
- Admin dashboard for managing listings
- Local data persistence using browser storage
- Clean, branded design in red, white and black

## Project structure

```text
.
├── admin.html
├── cars.html
├── index.html
├── sell.html
├── readme.md
├── .gitignore
├── css/
│   ├── admin.css
│   └── style.css
├── img/
│   ├── Mashirika_Motors_Logo.png
│   ├── Mashirika Motors logo.jpg
│   └── logo.svg
└── js/
    ├── admin.js
    ├── cars.js
    ├── db.js
    └── main.js
```

## Run locally

Because this is a front-end static site, there is no install step required.

### Option 1: Open directly
- Open `index.html` in your browser.

### Option 2: Serve locally
From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Admin access

Use the Admin Panel from the main navigation and sign in with:

- Username: `admin`
- Password: `mashirika123`

## Notes

- Data is stored in the browser using local storage.
- Listings are seeded with sample vehicles for demo purposes.
- Styling and content can be adjusted in the HTML, CSS, and JavaScript files.

## License

This project is provided as a front-end demo and can be adapted for personal or commercial use as needed.

## Contact

Mashirika Motors
- Email: info@mashirikamotors.co.ke
- Location: Nairobi, Kenya
