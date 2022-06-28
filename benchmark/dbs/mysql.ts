import { createPool, createConnection, Connection, Query } from "mysql";
import { Database } from "./database";
import { mockData } from "./test_data";

export class mysql implements Database {

    name: string = 'MySQL';
    connection: Connection;
    tableName = 'users';

    constructor() {
    }

    startup(ip: string, port: number): void {
        try {
            this.connection = createConnection({
                host: ip,
                port: port,
                user: 'root',
                password: 'root',
                database: 'test_db'
            });
        
            console.debug('MySql Adapter Pool generated successfully');
          } catch (error) {
            console.error('[mysql.connector][init][Error]: ', error);
            throw new Error('failed to initialized pool');
          }
    }

    async benchmark_insert_users(): Promise<number> {
        const queryString: string = 'INSERT INTO users (first_name, last_name, email, gender, ip_address) VALUES ?';
        const users = mockData.map(user => [user.first_name, user.last_name, user.email, user.gender, user.ip_address]);
        const result = await this.execute<any>(queryString, [users]);
        
        return result.affectedRows;
    }

    benchmark_select_sort_by_name(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async benchmark_select_all(): Promise<number> {
      const queryString: string = 'SELECT * FROM users';
      const result = await this.execute<any[]>(queryString, []);
      
      return result.length;
    }

    async benchmark_select_one(): Promise<number> {
      const queryString: string = 'SELECT * FROM users WHERE ip_address = ?';
      const result = await this.execute<any[]>(queryString, ["88.30.223.62"]);
      return result.length;
    }
    async benchmark_update_all(): Promise<number> {
      const queryString: string = 'UPDATE users SET email = ?;';
      const result = await this.execute<any>(queryString, ["yolo"]);
      return result.affectedRows;
    }
    async benchmark_update_one(): Promise<number> {
      const queryString: string = 'UPDATE users SET email = ? WHERE ip_address = ?;';
      const result = await this.execute<any>(queryString, ["yolo", "88.30.223.62"]);
      
      return result.affectedRows;
    }
    async benchmark_delete_one(): Promise<number> {
      const queryString: string = 'DELETE FROM users WHERE ip_address = ?;';
      const result = await this.execute<any>(queryString, ["88.30.223.62"]);
      return result.affectedRows;
    }


    async reset(): Promise<void> {
      await this.execute('truncate users', []);
    }

    execute = <T>(query: string, params: string[] | Object): Promise<T> => {
        try {
          if (!this.connection) throw new Error('Pool was not created. Ensure pool is created when running the app.');
      
          return new Promise<T>((resolve, reject) => {
            this.connection.query(query, params, (error, results) => {
              if (error) reject(error);
              else resolve(results);
            });
          });
      
        } catch (error) {
          console.error('[mysql.connector][execute][Error]: ', error);
          throw new Error('failed to execute MySQL query');
        }
      }
    
      async insert_one(): Promise<void> {

        const queryString: string = 'INSERT INTO users (first_name, last_name, email, gender, ip_address) VALUES (?, ?, ?, ?, ?)';

        await this.execute(queryString, ['test', 'user', 'email', 'male', '88.30.223.62'])
    }


}