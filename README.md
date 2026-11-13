# DeLEGACY Online Store

A responsive, editorial-style clothing storefront and separate store-admin dashboard for DeLEGACY (DL). Built with plain HTML, CSS and JavaScript; there is no build step.

## Catalogue structure (updated)

- Two categories only: **Vests** (Men's and Women's) and **Tees**. Products: DL Men's Vest, DL Women's Vest, DL Tee.
- The old sample products and the filter/sort toolbar were removed from "The Collection". It now shows category tiles, the vest and tee cards, the full four-view vest line-up, and the brand-ambassador gallery.
- Each product has its own page (`index.html#/product/dl-tee`) modelled on the reference layout: breadcrumb, thumbnail strip with image counter and arrows, colour and size selectors, size guide, add to bag, save, and accordions for fit, details, care and delivery.
- Product photos are in `assets/products/`. All image paths now point to `assets/`.
- **Current suggested retail price:** R300 per shirt/vest. Cost basis: R100 garment + R70 printing = R170 direct cost, leaving an indicative R130 gross contribution before packaging, delivery, overheads and tax. Initial stock is set to zero for every size.
- Browsers holding the old catalogue are upgraded automatically (catalogue version 3). If you use Firebase, open Admin and save once so the shared catalogue updates.

## Pages

- `index.html` — customer storefront.
- `admin.html` — product, order, customer, promotion and homepage-content administration.

## Design references used

- The DeLEGACY reference was used for the brand identity: black, electric blue (`#0060F0`), hot pink (`#F030A0`), white and the supplied distressed DL logo mark.
- The storefront retains its campaign-led presentation. The admin area is deliberately static and formal, with no background video, animation or transition effects.
- All seven supplied photographs and all five supplied DL videos were copied into `assets/` and used across the hero, product placeholders, brand story and community campaign section.

The supplied photos/videos are campaign and community imagery, not a full catalogue photo shoot. The current supplied product photos are assigned to their matching product galleries. Replace these from Admin → Products with the final garment photos before launch.

## Preview locally

Serve the folder with a local static web server such as VS Code Live Server. The storefront uses IndexedDB for local catalogue preview. Customer order submission and the admin dashboard require Firebase to be configured.

## Connect shared online data (Firebase)

The project is Firebase-ready, but does not contain credentials for a new store project. Do not reuse the Firebase project/config from the supplied DeLEGACY event-registration example; create a separate Firebase project for the shop.

1. Create a Firebase project and add a Web App.
2. In Firebase Authentication, enable **Email/Password**. Create the store administrator account with the email `tltech353@gmail.com` (or change the email in both `firebase-config.js` and the two rules files).
3. Enable Cloud Firestore and Firebase Storage.
4. The Web App configuration is already populated in `firebase-config.js` for project `dlclothing-fcd46`.
5. Publish `firestore.rules` in Firestore → Rules and `storage.rules` in Storage → Rules.
6. Add your deployed website domain to Firebase Authentication → Settings → Authorized domains.
7. Host the complete folder over HTTPS. Static hosting such as GitHub Pages, Netlify or Firebase Hosting can serve the site; the Firebase project provides authentication, product catalogue syncing, image storage, order records and newsletter records.

The Firebase Web App config is expected to be public in a client-side website. Access is controlled by Authentication and the published Firestore/Storage rules, not by hiding the config. Keep private service-account credentials out of this project.

### Data behaviour when Firebase is connected

- The public catalogue and homepage content are read from `storefront/main`.
- Only the administrator account can publish catalogue/content changes.
- Uploaded product photos are stored in Firebase Storage under `products/`.
- Shoppers can submit order requests and newsletter signups. Only the administrator can read all orders and newsletter submissions. Signed-in customers can read their own orders.
- Admin order-status changes are saved to the `orders` collection.
- Customer account registration, sign-in and password reset use Firebase Authentication.

The admin email is checked in code and in the rules. When changing it, update all three places: `firebase-config.js`, `firestore.rules` and `storage.rules`.

## Admin functions

- Add, edit, publish/unpublish and delete products.
- Upload/replace the main product image and add/remove gallery images.
- Set size options, stock per size, colour names, material, fit, occasion, description and care instructions.
- Filter/search the catalogue, export product CSV and import a CSV catalogue.
- Download a CSV template from Products → CSV template.
- View customer order requests, update their fulfilment status and export order CSV.
- View customer details derived from orders and export customers.
- View newsletter subscribers when Firebase is connected.
- Edit the announcement, homepage hero, story, support email, WhatsApp and Instagram details.
- Create, pause, activate and delete promo codes.

### CSV import columns

The template download contains these headers: `name, category, subcategory, brand, price, compareAt, material, fit, occasion, sizes, colors, stock, description, care, image`.

Use `|` between multiple sizes/colours/stock entries, for example `S|M|L|XL`, `Black|White`, and `S:4|M:8|L:2`. Imported products without an image use the supplied DL mark image and remain flagged as placeholders.

## Customer features currently implemented

- Responsive storefront and category navigation for Men, Women, Unisex, Kids and Accessories.
- Product grid/list views, search suggestions, size/colour/material/brand/fit/occasion/price filters and sorting.
- Product quick view, image gallery, size guide, variants and per-size stock display.
- Wishlist, persistent shopping bag, item quantity controls and promotional codes.
- Guest order-request form, standard/express/collection options, order summary, Firebase order record, EmailJS notification and WhatsApp click-to-send handoff. No payment gateway is included.
- Customer registration/sign-in/password reset when Firebase is configured; local profile preview without Firebase.
- Order history for signed-in customers when Firebase is configured.
- Newsletter signup, FAQ, brand story, contact links, privacy/terms/returns information placeholders.
- PWA manifest and a service worker that caches the core storefront and supplied photos after the first visit.

## Order requests, notifications and Firebase setup

The storefront uses EmailJS Service ID `service_fbpij89`, Template ID `template_0spatoi` and the supplied public key. In the EmailJS template, set the recipient to `{{to_email}}` (tltech353@gmail.com) and use the variables listed in `EMAIL_TEMPLATE.md`. The order page emails the admin and opens WhatsApp to `0714767516` with a pre-filled message; the admin must press Send. Fully automatic WhatsApp delivery requires an approved WhatsApp Business Cloud API setup and a secure server-side token, which were not supplied.

Firebase cannot be fully activated until you paste the actual Web App config into `firebase-config.js`. Enable Email/Password Authentication, Firestore and Storage, create `tltech353@gmail.com`, publish `firestore.rules` and `storage.rules`, and add the deployed domain to Authorized domains. The config values are intentionally marked as placeholders rather than fabricated.

## Important before accepting real orders

This is a working front-end and store-management prototype, not yet a fully transactional production commerce system. The following items still require business decisions, provider accounts and/or additional integration:

- **Payments:** no payment gateway or card collection is present. Orders are requests only; the admin confirms availability and arranges payment separately.
- **Shipping and tax:** R85 standard delivery, R150 express and the R1,000 free-shipping threshold are editable starter values in the checkout code; configure actual courier prices, locations, delivery windows and tax rules.
- **Email/SMS and abandoned cart:** order confirmations, abandoned-cart campaigns, push notifications and SMS need a trusted email/SMS/notification service and server-side event handling.
- **Reviews and social content:** product review moderation, verified-purchase badges, Q&A, Instagram/TikTok feeds and influencer storefronts need additional data structures and provider/API setup. Sample ratings are deliberately set to zero; no fabricated reviews are shown.
- **Advanced experiences:** AI styling, AI size recommendation, virtual try-on/AR, 360° product spins, voice search, virtual wardrobe and subscription boxes are not wired into this version.
- **Returns/refunds and tracking:** publish your actual returns terms and connect courier/order tracking and payment-provider refund APIs.
- **Legal/compliance:** replace the starter policy text with your actual business details, privacy/cookie disclosures, terms, returns and accessibility review. Configure analytics/Meta Pixel only after the appropriate consent and privacy work.

All product sizes currently have zero stock. The storefront accepts order requests for out-of-stock items so the admin can confirm availability before proceeding.

## Main files

- `store-data.js` — IndexedDB/local preview data layer and optional Firebase adapter.
- `app.js`, `styles.css` — customer store logic and responsive design.
- `admin.js`, `admin.css` — admin dashboard and editor.
- `firebase-config.js` — populated Firebase Web App config and admin email.
- `firestore.rules`, `storage.rules` — suggested security rules to publish and test.
- `manifest.webmanifest`, `service-worker.js` — PWA metadata and offline shell caching.
- `assets/dl-logo.png` — transparent DL logo extracted from the supplied brand reference; `icon-192.png` and `icon-512.png` use the matching black/blue/white/pink mark. Other supplied photos/videos remain available to the storefront.


## Review notes before launch

- The Firebase Web App configuration in `firebase-config.js` is populated for `dlclothing-fcd46`. Firebase Authentication, Firestore, Storage, security rules and authorized domains must still be enabled/configured in the Firebase Console before production use.
- The admin dashboard is Firebase-authenticated only; there is no public demo administrator password.
- Order requests are saved to Firestore and sent to the admin by EmailJS. WhatsApp opens a pre-filled message for the admin to send.
- Configure real delivery charges, returns/refunds, tax, legal/business contact details and customer communications before launch.
- Firebase Storage rules currently accept image uploads only; ensure admin authentication and authorized-domain settings are configured before production use.
