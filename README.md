# skorbeldoop

TypeScript static site with multiplayer capabilities built with Vite, Cloudflare Pages, and Cloudflare Durable Objects.

## Features

- 🎨 Static site built with Vite + TypeScript
- 🚀 Deployed on Cloudflare Pages
- 🎮 Real-time multiplayer using Cloudflare Durable Objects
- 🖱️ Cursor sharing demo with WebSockets

## Development

### Pages Site (Frontend)

```bash
npm install
npm run dev
```

Visit http://localhost:5173 to see your site.

### Worker (Multiplayer Backend)

In a separate terminal:

```bash
npm run dev:worker
```

This starts the WebSocket server on http://localhost:8787. The cursor demo will automatically connect to it when running locally.

## Build

### Build Pages Site

```bash
npm run build
```

### Deploy Worker

```bash
npm run build:worker
```

### Deploy Everything

```bash
npm run deploy:all
```

## Architecture

This project uses a **two-deployment architecture**:

1. **Cloudflare Pages** (`wrangler.toml`): Serves your static frontend
2. **Cloudflare Worker** (`wrangler-worker.toml`): Handles WebSocket connections and Durable Objects

### Directory Structure

```
skorbeldoop/
├── src/                    # Pages site source
│   ├── main.ts            # Homepage
│   ├── cursor.ts          # Cursor demo client
│   └── style.css          # Styles
├── worker/                # Worker with Durable Objects
│   ├── index.ts          # Worker entry point
│   └── CursorRoom.ts     # Durable Object class
├── wrangler.toml         # Pages configuration
└── wrangler-worker.toml  # Worker configuration
```

## Cloudflare Pages Configuration

In your Cloudflare Pages project settings, configure:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty or set to root)

**Do not** set a custom deploy command - Cloudflare Pages will automatically deploy the contents of the `dist` directory after building.

## Worker Configuration

After deploying your worker with `npm run build:worker`, note the worker URL (e.g., `https://skorbeldoop-multiplayer.your-subdomain.workers.dev`).

You'll need to update the WebSocket URL in `src/cursor.ts` for production:

```typescript
const workerUrl = isDev
  ? 'ws://localhost:8787'
  : 'wss://skorbeldoop-multiplayer.your-subdomain.workers.dev'; // Update this!
```

## How It Works

### Cursor Sharing Demo

1. Each page visitor connects to a WebSocket endpoint on the Worker
2. The Worker routes connections to a Durable Object based on room ID
3. The Durable Object maintains all WebSocket connections for that room
4. When a user moves their cursor, the position is broadcast to all other users in the same room
5. Each user sees everyone else's cursor in real-time

### Durable Objects

Durable Objects provide:
- Single-point coordination for all players in a room
- Persistent WebSocket connections
- Low-latency message broadcasting
- Automatic scaling per room
