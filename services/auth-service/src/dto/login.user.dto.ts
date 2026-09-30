import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(72)
    password!: string;
}
