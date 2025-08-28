import { HTTPException } from "hono/http-exception";
import mongoose from "mongoose";
import dotenv from 'dotenv';
// Load các biến môi trường từ tệp .env
dotenv.config();

const connectString = process.env.CONNECTION_STRING;

class Database {
    private static instance: Database | null = null;
    private connection: mongoose.Connection | null = null;

    private constructor() { // Đánh dấu private để ngăn việc tạo nhiều instance
        this.connect();
    }

    private async connect() {
        if (!connectString) throw new HTTPException(500, { message: 'Connecting to MongoDB error' });

        console.log(`🔗 Connecting to: ${connectString}`);

        if (process.env.NODE_ENV !== 'production') {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true });
        }

        try {
            const db = await mongoose.connect(connectString, {
                maxPoolSize: 50
            });
            this.connection = db.connection;
            console.log(`✅ Connected to MongoDB successfully`);
        } catch (err) {
            console.error(`❌ Error connecting to MongoDB:`, err);
        }
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getConnection(): mongoose.Connection | null {
        return this.connection;
    }
}

const instanceMongoDb = Database.getInstance();
export default instanceMongoDb;
