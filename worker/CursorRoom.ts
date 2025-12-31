import { DurableObject } from "cloudflare:workers";

interface CursorPosition {
  x: number;
  y: number;
  playerId: string;
}

interface Session {
  id: string;
  lastSeen: number;
}

export class CursorRoom extends DurableObject {
  private sessions: Map<WebSocket, Session>;
  private cursors: Map<string, CursorPosition>;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.sessions = new Map();
    this.cursors = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    // Upgrade to WebSocket
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket
    this.ctx.acceptWebSocket(server);

    const sessionId = crypto.randomUUID();
    this.sessions.set(server, {
      id: sessionId,
      lastSeen: Date.now()
    });

    // Send the new player their own ID
    server.send(JSON.stringify({
      type: "init",
      playerId: sessionId
    }));

    // Send all existing cursors to the new player
    const existingCursors = Array.from(this.cursors.values());
    if (existingCursors.length > 0) {
      server.send(JSON.stringify({
        type: "cursors_snapshot",
        cursors: existingCursors
      }));
    }

    // Notify others that someone joined
    this.broadcast({
      type: "player_joined",
      playerId: sessionId,
      playerCount: this.sessions.size
    }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      const data = JSON.parse(message as string);

      // Update last seen
      session.lastSeen = Date.now();

      if (data.type === "cursor_move") {
        // Store the cursor position
        const cursorPos: CursorPosition = {
          x: data.x,
          y: data.y,
          playerId: session.id
        };
        this.cursors.set(session.id, cursorPos);

        // Broadcast cursor position to all other players
        this.broadcast({
          type: "cursor_update",
          x: data.x,
          y: data.y,
          playerId: session.id
        }, ws);
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const session = this.sessions.get(ws);
    if (session) {
      // Remove cursor data
      this.cursors.delete(session.id);
      this.sessions.delete(ws);

      // Notify others that player left
      this.broadcast({
        type: "player_left",
        playerId: session.id,
        playerCount: this.sessions.size
      });
    }
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error("WebSocket error:", error);
    const session = this.sessions.get(ws);
    if (session) {
      this.cursors.delete(session.id);
      this.sessions.delete(ws);
    }
  }

  private broadcast(message: any, exclude?: WebSocket) {
    const msg = JSON.stringify(message);
    for (const [ws] of this.sessions) {
      if (ws !== exclude) {
        try {
          ws.send(msg);
        } catch (err) {
          // Connection may be closed
          const session = this.sessions.get(ws);
          if (session) {
            this.cursors.delete(session.id);
          }
          this.sessions.delete(ws);
        }
      }
    }
  }
}
