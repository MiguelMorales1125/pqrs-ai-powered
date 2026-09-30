import { EncryptPassword } from '../../src/components/encrypt.password';

describe('EncryptPassword', () => {
    it('hashes a password so it differs from the plain text', async () => {
        const hash = await EncryptPassword.hashPassword('password123');

        expect(hash).not.toBe('password123');
        expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });

    it('produces a different hash each time (random salt)', async () => {
        const [a, b] = await Promise.all([
            EncryptPassword.hashPassword('password123'),
            EncryptPassword.hashPassword('password123'),
        ]);

        expect(a).not.toBe(b);
    });

    it('returns true when comparing the correct password', async () => {
        const hash = await EncryptPassword.hashPassword('password123');

        await expect(EncryptPassword.comparePassword('password123', hash)).resolves.toBe(true);
    });

    it('returns false when comparing a wrong password', async () => {
        const hash = await EncryptPassword.hashPassword('password123');

        await expect(EncryptPassword.comparePassword('wrongpass', hash)).resolves.toBe(false);
    });
});
