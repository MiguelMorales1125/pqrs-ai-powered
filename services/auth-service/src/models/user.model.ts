export type Role = 'USER' | 'ADMIN';

export const ROLES: Role[] = ['USER', 'ADMIN'];

export class UserModel {
    id!: string;
    email!: string;
    password!: string;
    role!: string;
    createdAt!: Date;
    updatedAt!: Date;
}
