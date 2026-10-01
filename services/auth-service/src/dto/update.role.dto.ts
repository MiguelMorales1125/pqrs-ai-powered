import { IsIn } from 'class-validator';
import { ROLES, Role } from '../models/user.model';

export class UpdateRoleDto {
    @IsIn(ROLES)
    role!: Role;
}
