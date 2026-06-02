import { initializeServer, registerRoutes, startServer } from './server';

async function main(): Promise<void> {
  const server = initializeServer();
  await registerRoutes(server);
  await startServer(server);
}

main().catch((err: unknown) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
