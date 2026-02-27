import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
    
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false 
    }
});

pool.on('connect', () => {
    console.log("Connected to Neon Postgres successfully!");
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    
});

export default {
    query: (text, params) => pool.query(text, params),
    pool 
};