import { mockData } from "./test_data";

export interface Database {
    name: string;

    startup(ip: string, port: number): void;

    benchmark_insert_users(): Promise<number>;

    benchmark_select_one(): Promise<number>;

    benchmark_select_all(): Promise<number>;
    
    benchmark_update_all(): Promise<number>;

    benchmark_update_one(): Promise<number>;

    benchmark_delete_one(): Promise<number>;

    insert_one(): Promise<void>;

    reset(): Promise<void>;
}