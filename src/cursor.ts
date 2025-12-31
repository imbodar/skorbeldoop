import './cursor.css';

interface CursorData {
  x: number;
  y: number;
  playerId: string;
}

class MultiplayerCursor {
  private ws: WebSocket | null = null;
  private myPlayerId: string | null = null;
  private cursors: Map<string, HTMLDivElement> = new Map();
  private cursorArea: HTMLElement;
  private statusEl: HTMLElement;
  private playerCountEl: HTMLElement;
  private roomId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.cursorArea = document.getElementById('cursor-area')!;
    this.statusEl = document.getElementById('status')!;
    this.playerCountEl = document.getElementById('player-count')!;

    // Get room from URL or use default
    const params = new URLSearchParams(window.location.search);
    this.roomId = params.get('room') || 'default';
    document.getElementById('room-name')!.textContent = this.roomId;

    this.connect();
    this.setupMouseTracking();
  }

  private connect() {
    // Determine WebSocket URL based on environment
    // For local dev: ws://localhost:8787
    // For production: Automatically construct from branch name or use configured URL
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    let workerUrl: string;

    if (isDev) {
      workerUrl = 'ws://localhost:8787';
    } else {
      // Try to auto-detect Worker URL from Pages environment
      // Format: claude-{branch}-skorbeldoop.thedarwinias.workers.dev
      const hostname = window.location.hostname;

      // Extract branch name if on Pages preview (e.g., claude-add-cloudflare-workers-multiplayer-c7eqz.skorbeldoop.pages.dev)
      const branchMatch = hostname.match(/^(claude-[^.]+)\./);

      if (branchMatch) {
        // Construct Worker URL based on branch
        workerUrl = `wss://${branchMatch[1]}-skorbeldoop.thedarwinias.workers.dev`;
      } else {
        // Fallback to main Worker URL
        workerUrl = 'wss://skorbeldoop-multiplayer.thedarwinias.workers.dev';
      }
    }

    const wsUrl = `${workerUrl}/cursor/${this.roomId}`;

    this.updateStatus('Connecting...', 'connecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateStatus('Connected', 'connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateStatus('Connection error', 'error');
      };

      this.ws.onclose = () => {
        this.updateStatus('Disconnected', 'disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.updateStatus('Failed to connect', 'error');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateStatus(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'connecting');
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    } else {
      this.updateStatus('Connection failed. Refresh to retry.', 'error');
    }
  }

  private updateStatus(message: string, state: 'connected' | 'connecting' | 'disconnected' | 'error') {
    this.statusEl.textContent = message;
    this.statusEl.className = `status-${state}`;
  }

  private setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      // Calculate position relative to viewport (0-1 range)
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      this.ws.send(JSON.stringify({
        type: 'cursor_move',
        x,
        y
      }));

      // Update own cursor position
      if (this.myPlayerId) {
        this.updateCursor(this.myPlayerId, x, y, true);
      }
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'init':
        this.myPlayerId = data.playerId;
        console.log('My player ID:', this.myPlayerId);
        break;

      case 'cursors_snapshot':
        // Receive all existing cursors when joining
        data.cursors.forEach((cursor: CursorData) => {
          if (cursor.playerId !== this.myPlayerId) {
            this.updateCursor(cursor.playerId, cursor.x, cursor.y, false);
          }
        });
        break;

      case 'cursor_update':
        if (data.playerId !== this.myPlayerId) {
          this.updateCursor(data.playerId, data.x, data.y, false);
        }
        break;

      case 'player_joined':
        console.log('Player joined:', data.playerId);
        this.updatePlayerCount(data.playerCount);
        break;

      case 'player_left':
        console.log('Player left:', data.playerId);
        this.removeCursor(data.playerId);
        this.updatePlayerCount(data.playerCount);
        break;
    }
  }

  private updateCursor(playerId: string, x: number, y: number, isOwn: boolean) {
    let cursorEl = this.cursors.get(playerId);

    if (!cursorEl) {
      cursorEl = document.createElement('div');
      cursorEl.className = isOwn ? 'cursor cursor-own' : 'cursor cursor-other';
      cursorEl.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 3L19 12L12 13L9 19L5 3Z" fill="currentColor" stroke="white" stroke-width="1.5"/>
        </svg>
        <span class="cursor-label">${isOwn ? 'You' : `Player ${playerId.slice(0, 4)}`}</span>
      `;
      this.cursorArea.appendChild(cursorEl);
      this.cursors.set(playerId, cursorEl);
    }

    // Convert 0-1 range back to pixel position
    const pixelX = x * window.innerWidth;
    const pixelY = y * window.innerHeight;

    cursorEl.style.left = `${pixelX}px`;
    cursorEl.style.top = `${pixelY}px`;
  }

  private removeCursor(playerId: string) {
    const cursorEl = this.cursors.get(playerId);
    if (cursorEl) {
      cursorEl.remove();
      this.cursors.delete(playerId);
    }
  }

  private updatePlayerCount(count: number) {
    this.playerCountEl.textContent = `Players: ${count}`;
  }
}

// Initialize the app
new MultiplayerCursor();
