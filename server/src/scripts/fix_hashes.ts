
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { sequelize } from '../config/database';

async function fixHashes() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash('123456', salt);

        console.log('Fixing hashes for all users...');

        await User.update(
            { password_hash: newHash },
            { where: { id: ['admin', 't001', 's001', 's002'] } }
        );

        console.log('Success! Passwords for admin, t001, s001, and s002 have been reset to 123456.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing hashes:', error);
        process.exit(1);
    }
}

fixHashes();
