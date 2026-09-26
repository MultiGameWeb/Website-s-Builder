# Template #3 — Reusable Printed Bookstore

Files included:
- index.html
- cart.html
- checkout.html
- enquiry.html
- gallery.html
- success.html
- admin.html
- app.js
- admin.js
- data.js
- styles.css
- template.js

## Current mode
Static-site-friendly demo using localStorage/sessionStorage. The data model is intentionally structured for a future backend.

## Important
- Real payment gateway is NOT connected yet.
- Real server-side order tracking is NOT connected yet.
- Admin PIN is demo-only client-side storage and is NOT secure authentication.
- Replace demo contact details, cover URLs and gallery URLs in `data.js` or through the admin UI.
- The optional hero visual is isolated in the hero slot and does not use WebGL.

## Builder integration
Place this folder at:
`templates/bookstore/`
Then register/import `template.js` in the main modular builder registry.
