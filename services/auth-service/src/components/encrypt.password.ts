import bcrypt from 'bcrypt';

export class EncryptPassword {
    public static hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    public static comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }
}