# skorbeldoop

TypeScript static site built with Vite and deployed on Cloudflare Pages.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages Configuration

In your Cloudflare Pages project settings, configure:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty or set to root)

**Do not** set a custom deploy command - Cloudflare Pages will automatically deploy the contents of the `dist` directory after building.
