# Smart Fleet Management System 2.0

Browser-only fleet management and analytics. HTML, CSS and vanilla JavaScript. Uses Chart.js via CDN, IndexedDB and localStorage; no server is required. Open `index.html` to run.

## Features
- Executive dashboard
- Vehicle, driver, trip and maintenance management
- Fuel, fleet and driver analytics
- Predictive maintenance
- Machine learning centre: classification, regression, clustering and association patterns
- Dataset generation and CSV upload/preprocessing
- Reports, notifications, settings, global search and light/dark theme

## Project structure
- `index.html` — application entry point
- `css/style.css` — application styling
- `js/` — application modules, data storage, dashboards, analytics and ML features

## Run locally
Open `index.html` in a modern browser. Internet access is needed for the Google Fonts and Chart.js CDN resources. Application data is stored locally in the browser and is not synchronized to a server.

## Note
The CatBoost-style implementation is a JavaScript boosting implementation, not the CatBoost library. Sample data is synthetic and intended for demonstration.