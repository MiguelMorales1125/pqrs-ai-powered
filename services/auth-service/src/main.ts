import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './prisma/prisma.client';

async function bootstrap() {
    await prisma.$connect();

    const app = createApp();
    const server = app.listen(env.port, env.host, () => {
        console.log(`Auth Service running on http://localhost:${env.port}`);
    });

    const shutdown = async () => {
        server.close();
        await prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
    console.error('Failed to start Auth Service', err);
    process.exit(1);
});
