import { Database } from "./database";
import { Connection, Client, Pool } from 'pg';
import { mockData } from "./test_data";
const format = require('pg-format');


export class Postgresql implements Database {


    name: string = 'PostgreSQL';
    connection: Pool;

    startup(ip: string, port: number): void {
        try {
            this.connection = new Pool( {
                user: 'postgres',
                host: ip,
                database: 'test_db',
                password: 'postgres',
                port: port,
            })
        
            console.debug('Postgresql Connection generated successfully');
          } catch (error) {
            console.error('[postgresql.connector][init][Error]: ', error);
            throw new Error('failed to initialized connection');
          }
    }
    async benchmark_insert_users(): Promise<number> {
      const users = mockData.map(user => [user.first_name, user.last_name, user.email, user.gender, user.ip_address]);
        const queryString: string = format('INSERT INTO users (first_name, last_name, email, gender, ip_address) VALUES %L', users);
        
        const result = await this.execute<any>(queryString, []);
        
        return result.rowCount;
    }
    benchmark_select_sort_by_name(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async benchmark_select_all(): Promise<number> {
        const queryString: string = 'SELECT * FROM users';
        const result = await this.execute<any>(queryString, []);
       
        return result.rows.length;
    }

    async reset(): Promise<void> {
        await this.execute('truncate users', []);
    }
    async benchmark_select_one(): Promise<number> {
      const queryString: string = 'SELECT * FROM users WHERE ip_address = $1;';
      const result = await this.execute<any>(queryString, ['88.30.223.62']);
      
      return result.rows.length;
    }
    async benchmark_update_all(): Promise<number> {
      const queryString: string = 'UPDATE users SET email = $1;';
      const result = await this.execute<any>(queryString, ['yolo']);
      return result.rowCount;
    }
    async benchmark_update_one(): Promise<number> {
      const queryString: string = 'UPDATE users SET email = $1 WHERE ip_address = $2;';
      const result = await this.execute<any>(queryString, ['yolo', '88.30.223.62']);
      return result.rowCount;
    }
    async benchmark_delete_one(): Promise<number> {
      const queryString: string = 'DELETE FROM users WHERE ip_address = $1;';
      const result = await this.execute<any>(queryString, ['88.30.223.62']);
      return result.rowCount;
    }

    execute = <T>(query: string, params: any[]): Promise<T> => {
        try {
          if (!this.connection) throw new Error('Pool was not created. Ensure pool is created when running the app.');
      
          return new Promise<T>((resolve, reject) => {
            this.connection.query(query, params, (error, results) => {
                const res:any = results;
              if (error) reject(error);
              else resolve(res);
            });
          });
      
        } catch (error) {
          console.error('[postgresql.connector][execute][Error]: ', error);
          throw new Error('failed to execute Postgresql query');
        }
      }

      async insert_one(): Promise<void> {

        const queryString: string = 'INSERT INTO users (first_name, last_name, email, gender, ip_address) VALUES ($1, $2, $3, $4, $5);';

        await this.execute(queryString, ['test', 'user', 'email', 'male', '88.30.223.62'])
    }
    
}