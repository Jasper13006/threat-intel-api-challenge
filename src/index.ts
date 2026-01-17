import { buildApp } from './app';
import { config } from './config';
import { closeDb } from './db/client';

async function start() {
    const app = await buildApp();

    try {
        await app.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${config.port}`);
        console.log(`API documentation at http://localhost:${config.port}/documentation`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }

    const gracefulShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}, starting graceful shutdown...`);
        try {
            await app.close();
            closeDb();
            console.log('Server closed successfully');
            process.exit(0);
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

start();