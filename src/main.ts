import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="container">
    <h1>Skorbeldoop</h1>
    <p>Welcome to your TypeScript Cloudflare Pages site!</p>
    <p class="info">Built with Vite + TypeScript + Cloudflare Durable Objects</p>

    <div class="demos">
      <h2>Multiplayer Demos</h2>
      <a href="/cursor.html" class="demo-link">
        <div class="demo-card">
          <h3>🖱️ Cursor Sharing</h3>
          <p>See everyone's cursors in real-time using Cloudflare Durable Objects and WebSockets</p>
        </div>
      </a>
    </div>
  </div>
`
