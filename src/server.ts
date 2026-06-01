import Fastify, { type FastifyInstance } from 'fastify';

/**
 * Initializes and returns a bare-bones Fastify server instance.
 * https://fastify.dev/docs/latest/Guides/Getting-Started/
 */
export function initializeServer(): FastifyInstance {
  const server: FastifyInstance = Fastify({
    logger: false, //TODO: will add structured logging later
  });

  return server;
}

/*
  binds the server instance to port 3000 and starts listening for incoming requests
 */
export async function startServer(server: FastifyInstance): Promise<void> {
    // resolve(undefined) or resolve(err)
  try {
    const PORT: number = 3000;
    const HOST: string = '127.0.0.1';

    await server.listen({ port: PORT, host: HOST });
    console.log(`Proxy server listening on http://${HOST}:${PORT}`);
  } catch (err: unknown) {
    console.error('Failed to start server:', err);
    throw err;
  }
}
