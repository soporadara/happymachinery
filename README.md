# Happy Machinery

React and Vite website for the Skid Steer V900.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm ci
npm run build
```

The deployable website is generated in `dist/`.

## Hostinger deployment

Use **Websites → Add Website → Deploy Web App → Import Git Repository**. Do
not use the basic **Advanced → Git** deployment for this source repository,
because that flow checks out the unbuilt Vite source into `public_html`.

Configure Hostinger with:

- Framework: Vite (or React)
- Branch: `main`
- Node.js: 22
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Entry file: leave empty (this is a static frontend)

The `.htaccess` file in `public/` is copied into `dist/` during the build so
direct visits to React Router pages such as `/store` and `/contact` work.

## Shared admin content

Blog posts and Image Store assets use `/api/content.php` as their shared
server-side store. The Vite development server provides the same endpoint
locally, so different browsers using the same local server share content.

Production hosting must execute PHP 8+ and allow PHP to create the
`happy-machinery-storage` directory one level above the deployed web root.
The directory contains the shared JSON database and must remain writable and
persistent between deployments. Browser IndexedDB is retained as an offline
fallback.
