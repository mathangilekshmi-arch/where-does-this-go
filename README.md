# Where Does This Go?

A personal decluttering planner for deciding what to sell, donate, give away, or recycle.

## Features

- Add and edit items, their condition, destination, and notes.
- Attach an item photo (JPG, PNG, or WebP, up to 15 MB).
- Set a clear-out date, mark items as gone, and undo changes.
- Track progress with a room illustration that fades as items leave.
- Try example items before starting your own space.

Plans and compressed photos are stored in the current browser’s local storage. They do not sync between devices or between the local and hosted website. This version does not publish listings, arrange collections, or verify local donation and recycling services.

## Run locally

Install Node.js 22.13 or newer, then run these commands in the project folder:

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server, usually `http://localhost:3000`.

## Build

```sh
npm run build
npm start
```

The production build uses the Cloudflare Workers runtime. `npm start` previews that build locally with Wrangler; it does not publish it.

## Source layout

- `app/page.tsx` — planner interface and device-local state.
- `app/globals.css` — theme and responsive styling.
- `app/layout.tsx` — document metadata and root layout.
- `lib/item-photo.ts` — photo validation, resizing, and compression.
- `components/ui/` — reusable interface components from the starter.
- `public/` — room illustration and favicon.
- `vite.config.ts` — Vinext, Cloudflare, and Sites build configuration.
- `.openai/hosting.json` — existing Sites project identifier and binding configuration; no credentials.

## Technology

React, TypeScript, Vinext, Vite, Tailwind CSS, Base UI, and Lucide icons. The room illustration was generated for this project.

## Hosting

This project is connected to an existing private Sites website. Uploading the code to GitHub does not automatically deploy it or change the website’s access. The Sites project identifier belongs to that existing site; do not reuse it to publish a separate copy.

Dependencies, generated builds, local runtime data, and environment files are excluded by `.gitignore`. Install dependencies with `npm ci` after cloning. Never commit API keys or hosting credentials.
