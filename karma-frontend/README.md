# Karma Frontend

Karma is a fundraising platform for Kenya. This front-end is a static experience designed to work with the existing Karma backend API on port 4000.

## Run locally

- Start the backend from the sibling `karma-backend` folder.
- Serve the frontend with a static server:
  - `python -m http.server 3000`
  - or `npx serve . -l 3000`
- Open http://localhost:3000/

## Folder overview

- `index.html` — public home page
- `campaigns.html` — campaign listing
- `campaign.html` — campaign detail page
- `donate.html` — donation form
- `thank-you.html` — payment confirmation page
- `admin-login.html` — admin login screen
- `admin-index.html` — admin dashboard
- `styles.css` — design tokens and layout
- `app.js` — shared helpers and page bootstrapping

## Configuration

The API base defaults to `http://localhost:4000/api/v1` and can be overridden via `window.KARMA_API`.

## Notes

This project intentionally avoids frameworks and uses plain HTML, CSS and JavaScript. For production deployment, host the site and API on the same domain or configure your cookie and CORS settings carefully.
