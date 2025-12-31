import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="container">
    <h1>Skorbeldoop</h1>
    <p>Welcome to your TypeScript Cloudflare Pages site!</p>
    <p class="info">Built with Vite + TypeScript</p>
  </div>
`
