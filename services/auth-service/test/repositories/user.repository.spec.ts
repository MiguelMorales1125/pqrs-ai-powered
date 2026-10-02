import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../src/repositories/user.repository';
import { buildUser } from '../helpers/user-repository.mock';

describe('UserRepository', () => {
    const prismaUser = {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };
    const repo = new UserRepository({ user: prismaUser } as unknown as PrismaClient);
    const user = buildUser();

    it('findById queries by id', async () => {
        prismaUser.findUnique.mockResolvedValue(user);

        await expect(repo.findById(user.id)).resolves.toBe(user);
        expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
    });

    it('findByEmail queries by email', async () => {
        prismaUser.findUnique.mockResolvedValue(null);

        await expect(repo.findByEmail('x@test.com')).resolves.toBeNull();
        expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { email: 'x@test.com' } });
    });

    it('findAll orders by newest first', async () => {
        prismaUser.findMany.mockResolvedValue([user]);

        await expect(repo.findAll()).resolves.toEqual([user]);
        expect(prismaUser.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('create passes the data through', async () => {
        const data = { email: 'juan@test.com', password: 'hash' };
        prismaUser.create.mockResolvedValue(user);

        await repo.create(data);
        expect(prismaUser.create).toHaveBeenCalledWith({ data });
    });

    it('updateRole updates only the role', async () => {
        prismaUser.update.mockResolvedValue({ ...user, role: 'ADMIN' });

        await repo.updateRole(user.id, 'ADMIN');
        expect(prismaUser.update).toHaveBeenCalledWith({ where: { id: user.id }, data: { role: 'ADMIN' } });
    });
});
