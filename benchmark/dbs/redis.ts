import { Database } from "./database";
import { Client, Entity, Schema } from 'redis-om';
import { mockData } from "./test_data";

class RedisUser extends Entity {}

const userSchema = new Schema(RedisUser, {
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    gender: { type: 'string' },
    ip_address: { type: 'string' },
    email: { type: 'string' },
  });


export class Redis implements Database {
    name: string = 'Redis';
    client: Client;
    repository: any;

    async startup(ip: string, port: number): Promise<void> {
        try {
            this.client = new Client();
            await this.client.open(`redis://${ip}:${port}`);
    
            this.repository = this.client.fetchRepository(userSchema)
            await this.repository.createIndex()
            console.log('Redis client generated successfully');
            
        }
        catch(err) {
            console.log(err);
        }
    }
    async benchmark_insert_users(): Promise<number> {
        let count = 0;
        for(const user of mockData) {
            try {
                delete user.id;
                const entity = this.repository.createEntity(
                    user
                );

                await this.repository.save(entity)
                count+=1;
            }
            catch(err) {
                console.log(err);
                
            }

        }
        return count;
    }
    async benchmark_select_one(): Promise<number> {
        await this.repository.search().where('ip_address').equalTo('88.30.223.62').first();
        return 1;
    }
    async benchmark_select_all(): Promise<number> {
        const users = await this.repository.search().all();
        return users.length;
    }
    async benchmark_update_all(): Promise<number> {
        const users = await this.repository.search().all();
        for(const user of users) {
            user.first_name = 'yolo';
            await this.repository.save(user)
        }
        return users.length;
    }
    async benchmark_update_one(): Promise<number> {
        const user = await this.repository.search().first();
        user.first_name = 'yolo';
        await this.repository.save(user);
        return 1;
    }
    async benchmark_delete_one(): Promise<number> {
        const user = await this.repository.search().first();
        await this.repository.remove(user.entityId);
        return 1;
    }
    async reset(): Promise<void> {
        
        const users = await this.repository.search().all();
        

        for(const user of users) {
            await this.repository.remove(user.entityId);
        }
    }

    async insert_one(): Promise<void> {
        this.repository.createAndSave({
            first_name: 'test',
            last_name: 'user',
            email: 'email',
            ip_address: '88.30.223.62',
            gender: 'male'
        });
    }
    
}