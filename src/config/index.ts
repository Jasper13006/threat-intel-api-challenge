import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
    port: number;
    databasePath: string;
}

export const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'threat_intel.db'),
};