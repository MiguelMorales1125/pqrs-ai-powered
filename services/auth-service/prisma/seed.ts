import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EncryptPassword } from '../src/components/encrypt.password';

// Creates (or promotes) the initial ADMIN user from ADMIN_EMAIL / ADMIN_PASSWORD.
async function main() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user');
    }

    const prisma = new PrismaClient();
    const hashed = await EncryptPassword.hashPassword(password);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN' },
        create: { email, password: hashed, role: 'ADMIN' },
    });

    console.log(`Admin user ready: ${admin.email}`);
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
