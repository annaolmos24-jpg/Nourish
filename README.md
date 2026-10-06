# Nourish — Nutrition & Wellness Tracker

A responsive meal and progress tracker for Oriana. Works in desktop browsers, tablets and phones.

## Features
- Personalized greeting (good morning / afternoon / evening, Oriana)
- Light, dark and system themes (remembered between visits)
- Live food search powered by **[Open Food Facts](https://world.openfoodfacts.org)** — free, open data, no account, password or API key required
- Barcode lookup (type an 8–14 digit barcode into the search box)
- Log foods to breakfast, lunch, dinner or snacks with custom gram amounts
- Custom foods for anything not in the database
- Daily calorie ring and protein / carbs / fat progress bars with editable goals
- Water tracker
- 7-day calorie chart and weight trend chart (lb or kg)
- Browse any past or future day
- **Learn tab**: calorie and BMI calculator that can set your goals, five one-day meal plan templates (Balanced, High protein, Mediterranean, Plant-based, Quick & budget) with shopping lists and one-tap logging, a healthy-plate guide, food facts (with a fact of the day), tips by topic, and myths vs. facts

Your log is stored in the browser's local storage on each device.

## Deploy to Netlify
It's a static site with no build step.

- **Git deploy:** In Netlify choose *Add new site → Import an existing project*, pick this repo and the `main` branch. Settings are read from `netlify.toml` (publish directory `.`, no build command).
- **Drag and drop:** Drag the project folder onto https://app.netlify.com/drop.

## Updating the app

**Change the Learn content** (meal plans, food facts, tips, myths): edit `learn-data.js`. It is plain lists:
- Meal plan foods: `["Hard-boiled egg", 78, 6, 1, 5]` = name, calories, protein g, carbs g, fat g.
- Facts: `{ emoji, title, text }`. Tips: a `title`, `emoji` and list of `items`. Myths: `{ myth, fact }`.

**Publish:** on github.com open the file, click ✏️, edit, then **Commit changes** to `main`. Netlify redeploys automatically within a minute (see **Deploys** in Netlify). To undo, in Netlify go to **Deploys**, pick an older deploy and choose **Publish deploy**.

## Run locally
```sh
python3 -m http.server 8080
# open http://localhost:8080
```
