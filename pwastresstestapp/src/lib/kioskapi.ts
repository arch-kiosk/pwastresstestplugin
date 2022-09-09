export const API_STATE_ERROR = -1

export const API_STATE_UNINITIALZED = 0
export const API_STATE_INITIALIZING = 1
export const API_STATE_READY = 2

export class KioskApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "KioskApiError";
    }
}

export class FetchException {
    msg: string
    response: any
    constructor(msg: string, response:any = null) {
        this.msg = msg;
        this.response = response;
    }
}

interface FetchParams extends RequestInit {
    caller?: string
}

//abstract
export abstract class KioskApi {
    token = "";
    apiRoot = "/";
    lastErrorMessage = "";

    status = API_STATE_UNINITIALZED;

    constructor(apiRoot = "/", token="") {
        if (!apiRoot.startsWith("/")) apiRoot = "/" + apiRoot;
        if (!apiRoot.endsWith("/")) apiRoot = apiRoot + "/";
        this.apiRoot = apiRoot;
        this.token = token
        console.log("The apiRoot is " + this.apiRoot);
    }

    //abstract methods
    abstract getKioskRoute(route_name: string): string;
    abstract getApiUrl(apiAddress?: string): string;

    getHeaders(mimetype: string) {
        let headers = new Headers();
        headers.append("Content-Type", mimetype);
        headers.append("Accept", mimetype);
        headers.append("Authorization", `Bearer ${this.token}`);
        return headers
    }

    async initApi() {
        //abstract method
        throw "KioskApi.initApi is abstract and must not be called";
    }

    async fetchFromApi(
        apiRoot:string,
        apiMethod: string,
        fetchParams: FetchParams,
        apiVersion = "v1",
        urlSearchParams = "",
        mimetype = "application/json",
    ) {
        if (!this.token) {
            throw new KioskApiError("No api-token when calling fetchFromApi");
        }
        let headers = this.getHeaders(mimetype)
        let address = `${this.getApiUrl()}/${apiRoot}/${apiVersion}/${apiMethod}`;

        if ("caller" in fetchParams)
            console.log(`${fetchParams.caller} fetching from ${address}`);
        else console.log("fetching from " + address);
        let init = { ...fetchParams };
        init["headers"] = headers;
        if (urlSearchParams) {
            address += "?" + urlSearchParams;
        }
        let response;
        try {
            console.log("fetching " + address);
            response = await fetch(address, init);
        } catch (err: any) {
            console.log(`caught ${err} in fetchFromApi after fetch`);
            throw new FetchException(err);
        }
        if (response.ok) {
            return await response.json();
        } else {
            console.log(`caught ${response.status} in fetchFromApi`);
            throw new FetchException(response.statusText, response);
        }
    }
    getFetchFileFromApiRequest(
        apiRoot:string,
        apiMethod: string,
        fetchParams: FetchParams,
        apiVersion = "v1",
        urlSearchParams: URLSearchParams | null = null,
        mimetype = "application/json",
    ): Request {
        if (!this.token) {
            throw new KioskApiError("No api-token when calling fetchFromApi");
        }
        let headers = this.getHeaders(mimetype)
        let address = `${this.getApiUrl()}/${apiRoot}/${apiVersion}/${apiMethod}`;

        if ("caller" in fetchParams)
            console.log(`${fetchParams.caller} fetching from ${address}`);
        else console.log("fetching from " + address);
        let init = { ...fetchParams };
        init["headers"] = headers;
        if (urlSearchParams) {
            address += "?" + urlSearchParams;
        }
        try {
            console.log("fetching " + address);
            return new Request(address, init)
        } catch (err: any) {
            console.log(`caught ${err} in fetchFileFromApi`);
            throw new FetchException(err);
        }
    }


}
