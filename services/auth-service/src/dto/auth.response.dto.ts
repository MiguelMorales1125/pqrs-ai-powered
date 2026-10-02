import { UserDto } from './user.dto';

export class AuthResponseDto {
    accessToken!: string;
    tokenType!: 'Bearer';
    expiresIn!: number;
    user!: UserDto;
}
