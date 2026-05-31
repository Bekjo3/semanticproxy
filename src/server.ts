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
