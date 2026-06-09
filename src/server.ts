import Fastify, { type FastifyInstance } from 'fastify';
import { registerChatRoute } from './routes/chat';
import { rateLimiterPlugin } from './plugins/rateLimiter';

/**
 * Initializes and returns a bare-bones Fastify server instance.
 * https://fastify.dev/docs/latest/Guides/Getting-Started/
 */
export function initializeServer(): FastifyInstance {
  const server: FastifyInstance = Fastify({
    logger: false, //TODO: will add structured logging later
    trustProxy: true
  });

  return server;
}

// register all routes
export async function registerRoutes(server: FastifyInstance): Promise<void> {
  await server.register(rateLimiterPlugin);
  await registerChatRoute(server);
    // will add more...
  console.log('All routes registered successfully');
}

/*
  binds the server instance to port 3000 and starts listening for incoming requests
 */
export async function startServer(server: FastifyInstance): Promise<void> {
    // resolve(undefined) or resolve(err)
  try {
    const PORT: number = 3000;
    const HOST: string = '127.0.0.1'; // blocks all outside requests for now!

    await server.listen({ port: PORT, host: HOST });
    console.log(`Proxy server listening on http://${HOST}:${PORT}`);
  } catch (err: unknown) {
    if (server.log) {
      server.log.error(err);
    } else {
      console.error('Fatal server startup error:', err);
    }
    process.exit(1);
  }
}
