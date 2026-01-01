import fs from 'fs';
import path from 'path';

const envPath = '.env';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            console.log(`${key.trim()}: length ${value.trim().length}`);
            console.log(`${key.trim()} starts with: ${value.trim().substring(0, 10)}...`);
        }
    });
} else {
    console.log('.env file not found');
}
