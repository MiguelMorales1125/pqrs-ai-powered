import { Request, Response } from 'express';
import { CreateUserDto } from '../dto/create.user.dto';
import { LoginUserDto } from '../dto/login.user.dto';
import { UpdateRoleDto } from '../dto/update.role.dto';
import { UserService } from '../services/user.service';

export class UserController {
    constructor(private readonly userService: UserService) {}

    register = async (req: Request, res: Response) => {
        const user = await this.userService.register(req.body as CreateUserDto);
        res.status(201).json(user);
    };

    login = async (req: Request, res: Response) => {
        const result = await this.userService.login(req.body as LoginUserDto);
        res.status(200).json(result);
    };

    me = async (req: Request, res: Response) => {
        const user = await this.userService.findById(req.user!.sub);
        res.status(200).json(user);
    };

    verify = async (req: Request, res: Response) => {
        // Used by other microservices to validate a token they received.
        res.status(200).json({ valid: true, user: req.user });
    };

    findAll = async (_req: Request, res: Response) => {
        const users = await this.userService.findAll();
        res.status(200).json({ data: users, meta: { pagination: { total: users.length } } });
    };

    findById = async (req: Request, res: Response) => {
        const user = await this.userService.findById(req.params.id as string);
        res.status(200).json(user);
    };

    updateRole = async (req: Request, res: Response) => {
        const { role } = req.body as UpdateRoleDto;
        const user = await this.userService.updateRole(req.params.id as string, role);
        res.status(200).json(user);
    };
}
