import { KioskApi } from "./kioskapi";
export declare class PWAKioskApi extends KioskApi {
    token: string;
    lastErrorMessage: string;
    kioskRoutes: {
        [key: string]: string;
    } | null;
    status: number;
    private apiBaseAddress;
    private userId;
    private password;
    getKioskRoute(routeName: string): string;
    registerRoute(routeName: string, url: string): void;
    getApiUrl(apiAddress?: String): string;
    getHeaders(mimetype: string): Headers;
    setApiBaseAddress(address: string): void;
    setCredentials(userId: string, password: string): void;
    initApi(): Promise<void>;
}
