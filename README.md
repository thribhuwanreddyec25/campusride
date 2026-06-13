# CampusRide

A mobile-first ride-sharing web app for **BMSCE** students — find a ride or offer one, split fares on autos, cabs and bikes with verified classmates.

**Live:** https://thribhuwanreddyec25.github.io/campusride

## Features

- Verified sign-up restricted to `@bmsce.ac.in` emails (Firebase Authentication)
- Post a ride or book an open seat, with live realtime updates (no refresh)
- Smart pickup/drop search — curated BMSCE hotspots + free OpenStreetMap autocomplete and a draggable map picker
- Mandatory WhatsApp contact so riders can reach drivers
- Custom display names, driver ratings, ride history
- Light / dark / auto themes, installable PWA with offline shell

## Tech stack

Vanilla HTML / CSS / JavaScript — no build step. Firebase Realtime Database + Authentication, Leaflet + OpenStreetMap for maps. Deploys as static files to GitHub Pages.

## Project structure

```
index.html          Home — greeting, nearby rides, quick post
rides.html          Browse / search rides, post, ride detail sheet
profile.html        Stats, ride history, display name, phone, theme
login.html          Sign in / create account
otp.html            Email-verification waiting screen
set-password.html   Redirect (kept for old links)
home.html           Redirect to index

firebase-init.js    Firebase bootstrap (loads first)
auth.js             Authentication + profile (phone, display name)
rides.js            Rides data layer (post, book, cancel, ratings)
places.js           Location autocomplete + Leaflet map picker
ui.js               Shared UI runtime (nav, toasts, sheets, theme)
theme.js            Deprecated theme shim (kept to avoid 404s)

style.css           Design system + all styles
manifest.webmanifest, sw.js, favicon.svg, icons/   PWA assets
```

## Run locally

No build needed — serve the folder over HTTP (a service worker needs `http`, not `file://`):

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed local URL.

## Firebase setup

The app talks to a Firebase project (config in `firebase-init.js`). To run your own:

1. **Authentication → Sign-in method →** enable **Email/Password**.
2. **Realtime Database →** create a database and publish rules allowing authenticated users to read/write `rides`, `ratings`, and their own `users/{uid}`.
3. Drop your project config into `firebase-init.js`.

## Deploy (GitHub Pages)

Push these files to a repo, then **Settings → Pages → Build from branch → `main` / root**. The site is fully static, so it goes live as-is.

## License

Student project — free for BMSCE use.
