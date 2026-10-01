import { PrismaClient } from '@prisma/client';
import { UserModel } from '../models/user.model';

export class UserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    findById(id: string): Promise<UserModel | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    findByEmail(email: string): Promise<UserModel | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findAll(): Promise<UserModel[]> {
        return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    }

    create(data: { email: string; password: string; role?: string }): Promise<UserModel> {
        return this.prisma.user.create({ data });
    }

    updateRole(id: string, role: string): Promise<UserModel> {
        return this.prisma.user.update({ where: { id }, data: { role } });
    }
}
