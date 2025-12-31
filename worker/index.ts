import { CursorRoom } from './CursorRoom';

export { CursorRoom };

interface Env {
  CURSOR_ROOMS: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: /cursor/:roomId
    if (url.pathname.startsWith('/cursor/')) {
      const roomId = url.pathname.split('/')[2] || 'default';

      // Get or create Durable Object instance for this room
      const id = env.CURSOR_ROOMS.idFromName(roomId);
      const stub = env.CURSOR_ROOMS.get(id);

      // Forward the request to the Durable Object
      const response = await stub.fetch(request);

      // Add CORS headers to response (except for WebSocket upgrade)
      if (response.status !== 101) {
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      return response;
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not found. Try /cursor/:roomId for WebSocket connection.', {
      status: 404,
      headers: corsHeaders
    });
  }
};
