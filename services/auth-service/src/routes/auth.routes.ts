import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { CreateUserDto } from '../dto/create.user.dto';
import { LoginUserDto } from '../dto/login.user.dto';
import { UpdateRoleDto } from '../dto/update.role.dto';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';

export function authRoutes(controller: UserController): Router {
    const router = Router();

    router.post('/auth/register', validateBody(CreateUserDto), controller.register);
    router.post('/auth/login', validateBody(LoginUserDto), controller.login);
    router.get('/auth/me', authenticate, controller.me);
    router.get('/auth/verify', authenticate, controller.verify);

    router.get('/users', authenticate, authorize('ADMIN'), controller.findAll);
    router.get('/users/:id', authenticate, authorize('ADMIN'), controller.findById);
    router.patch('/users/:id/role', authenticate, authorize('ADMIN'), validateBody(UpdateRoleDto), controller.updateRole);

    return router;
}
