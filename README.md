# Happy Machinery

React and Vite website for the Skid Steer V900.

## Local development

Set a strong CMS password in your shell before starting the development server. Do not commit the password to Git.

```bash
npm install
export HAPPY_ADMIN_PASSWORD='replace-with-a-unique-secret-of-at-least-14-characters'
npm run dev
```

The local CMS uses an HTTP-only development session cookie. Never reuse the example value as a real password.

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

## CMS security and shared admin content

The CMS no longer accepts the legacy browser-only passcodes. Configure `HAPPY_ADMIN_PASSWORD` as a server-side environment variable with a unique secret of at least 14 characters. Configure it in the Hostinger/PHP runtime environment as well as the local development shell. Do not put real credentials in `VITE_*` variables, source code, or committed `.env` files. The production API validates an HTTP-only, SameSite session before accepting admin content writes and limits repeated failed login attempts. The server must support PHP sessions. Verify that the configured environment variable is available to PHP before enabling admin access.

If your hosting plan does not allow setting a private PHP environment variable, configure a server-side secret using the hosting provider's supported private configuration mechanism before deploying this change. Do not restore hard-coded passwords as a workaround.


Blog posts and Image Store assets use `/api/content.php` as their shared
server-side store. The Vite development server provides the same endpoint
locally, so different browsers using the same local server share content.

Production hosting must execute PHP 8+ and allow PHP to create the
`happy-machinery-storage` directory one level above the deployed web root.
The directory contains the shared JSON database and must remain writable and
persistent between deployments. Browser IndexedDB is retained as an offline
fallback.
