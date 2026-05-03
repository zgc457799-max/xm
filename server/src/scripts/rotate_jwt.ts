
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve(__dirname, '../../.env');

function rotateJWTSecret() {
    try {
        const newSecret = crypto.randomBytes(32).toString('hex');
        let content = fs.readFileSync(envPath, 'utf8');

        if (content.includes('JWT_SECRET=')) {
            content = content.replace(/JWT_SECRET=.*/, `JWT_SECRET=${newSecret}`);
        } else {
            content += `\nJWT_SECRET=${newSecret}`;
        }

        fs.writeFileSync(envPath, content);
        console.log('JWT Secret rotated successfully!');
        console.log('New Secret (Hex):', newSecret);
    } catch (error) {
        console.error('Failed to rotate JWT Secret:', error);
    }
}

rotateJWTSecret();
