import { UserModel } from '../../src/models/user.model';
import { UserRepository } from '../../src/repositories/user.repository';

export type UserRepositoryMock = jest.Mocked<
    Pick<UserRepository, 'findById' | 'findByEmail' | 'findAll' | 'create' | 'updateRole'>
>;

export function createUserRepositoryMock(): UserRepositoryMock {
    return {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        updateRole: jest.fn(),
    };
}

export function buildUser(overrides: Partial<UserModel> = {}): UserModel {
    return {
        id: '01a0efcd-7e36-7ca3-abcb-a666c5300c69',
        email: 'juan@test.com',
        password: '$2b$10$hashedpassword',
        role: 'USER',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}
