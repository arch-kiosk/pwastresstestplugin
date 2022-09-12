import { KioskApi } from "./kioskapi";
export declare class PWAKioskApi extends KioskApi {
    kioskRoutes: {
        [key: string]: string;
    } | null;
    apiBaseAddress: string;
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
