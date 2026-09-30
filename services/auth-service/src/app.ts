import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import { UserController } from './controllers/user.controller';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { prisma } from './prisma/prisma.client';
import { UserRepository } from './repositories/user.repository';
import { authRoutes } from './routes/auth.routes';
import { UserService } from './services/user.service';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    const userRepository = new UserRepository(prisma);
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'auth-service' });
    });

    app.use('/api/v1', authRoutes(userController));

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
