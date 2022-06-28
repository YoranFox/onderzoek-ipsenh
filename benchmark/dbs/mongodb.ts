import { Collection, MongoClient } from "mongodb";
import { Database } from "./database";
import { mockData } from "./test_data";



export class MongoDB implements Database {
    name: string = 'MongoDB';
    collection: Collection;

    async startup(ip: string, port: number): Promise<void> {
        try {
            const url = `mongodb://${ip}:${port}`;
            const client = new MongoClient(url);
            await client.connect();
            const db = client.db('test_db');
    
            this.collection = await db.collection('users');

            console.debug('MongoDB collection generated successfully');
        }
        catch(err) {
            throw new Error('failed to initialized mongo connection');
        }

    }
    async benchmark_insert_users(): Promise<number> {
        const users = mockData.map(user => {
            delete user.id;
            delete user["_id"];
            return user
        })
        
        const insertResult = await this.collection.insertMany(users);

        return insertResult.insertedCount;
        
    }
    async benchmark_select_one(): Promise<number> {
        const result = await this.collection.find({ip_address: "88.30.223.62"}).toArray();
        return result.length;
    }
    async benchmark_select_all(): Promise<number> {
        const result = await this.collection.find({}).toArray();
        return result.length;
    }
    async benchmark_update_all(): Promise<number> {
        const updateResult = await this.collection.updateMany({ }, { $set: { email: "yolo" } });
        
        return updateResult.modifiedCount;
    }
    async benchmark_update_one(): Promise<number> {
        const updateResult = await this.collection.updateOne({ip_address: "88.30.223.62"}, { $set: { email: "yolo" } });
        
        return updateResult.modifiedCount;
    }
    async benchmark_delete_one(): Promise<number> {
        const deleteResult = await this.collection.deleteOne({ip_address: "88.30.223.62"});
        
        return deleteResult.deletedCount;
    }
    async insert_one(): Promise<void> {
        await this.collection.insertOne({
            first_name: 'test',
            last_name: 'user',
            email: 'email',
            ip_address: '88.30.223.62',
            gender: 'male'
        });
    }
    async reset(): Promise<void> {
        await this.collection.deleteMany({});
    }

    
    
}