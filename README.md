# Nourish — Nutrition & Wellness Tracker

A responsive meal and progress tracker for Dr. Lee. Works in desktop browsers, tablets and phones.

## Features
- Personalized greeting (good morning / afternoon / evening, Dr. Lee)
- Light, dark and system themes (remembered between visits)
- Live food search powered by **[Open Food Facts](https://world.openfoodfacts.org)** — free, open data, no account, password or API key required
- Barcode lookup (type an 8–14 digit barcode into the search box)
- Log foods to breakfast, lunch, dinner or snacks with custom gram amounts
- Custom foods for anything not in the database
- Daily calorie ring and protein / carbs / fat progress bars with editable goals
- Water tracker
- 7-day calorie chart and weight trend chart (lb or kg)
- Browse any past or future day

Your log is stored in the browser's local storage on each device.

## Deploy to Netlify
It's a static site with no build step.

- **Git deploy:** In Netlify choose *Add new site → Import an existing project*, pick this repo and the `main` branch. Settings are read from `netlify.toml` (publish directory `.`, no build command).
- **Drag and drop:** Drag the project folder onto https://app.netlify.com/drop.

## Run locally
```sh
python3 -m http.server 8080
# open http://localhost:8080
```
