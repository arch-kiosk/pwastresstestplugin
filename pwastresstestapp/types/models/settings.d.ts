export declare class Settings {
    server_address: string;
    user_id: string;
    password: string;
    dock_id: string;
    validate(): boolean;
    save(): Promise<void>;
    load(): Promise<void>;
}
