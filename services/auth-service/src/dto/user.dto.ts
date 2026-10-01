import { UserModel } from '../models/user.model';

export class UserDto {
    id!: string;
    email!: string;
    role!: string;
    createdAt!: Date;
    updatedAt!: Date;

    static fromModel(user: UserModel): UserDto {
        const { id, email, role, createdAt, updatedAt } = user;
        return { id, email, role, createdAt, updatedAt };
    }
}
