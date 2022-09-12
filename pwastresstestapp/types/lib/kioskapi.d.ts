export declare const API_STATE_ERROR = -1;
export declare const API_STATE_UNINITIALZED = 0;
export declare const API_STATE_INITIALIZING = 1;
export declare const API_STATE_READY = 2;
export declare class KioskApiError extends Error {
    constructor(message: string);
}
export declare class FetchException {
    msg: string;
    response: any;
    constructor(msg: string, response?: any);
}
interface FetchParams extends RequestInit {
    caller?: string;
}
export declare abstract class KioskApi {
    token: string;
    apiRoot: string;
    lastErrorMessage: string;
    status: number;
    constructor(apiRoot?: string, token?: string);
    abstract getKioskRoute(route_name: string): string;
    abstract getApiUrl(apiAddress?: string): string;
    getHeaders(mimetype: string): Headers;
    initApi(): Promise<void>;
    fetchFromApi(apiRoot: string, apiMethod: string, fetchParams: FetchParams, apiVersion?: string, urlSearchParams?: string, mimetype?: string): Promise<any>;
    getFetchFileFromApiRequest(apiRoot: string, apiMethod: string, fetchParams: FetchParams, apiVersion?: string, urlSearchParams?: URLSearchParams | null, mimetype?: string): Request;
}
export {};
