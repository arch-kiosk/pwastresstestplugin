import {
    KioskApi,
    FetchException,
    API_STATE_ERROR,
    API_STATE_INITIALIZING,
    API_STATE_READY,
} from "./kioskapi";

import {appState} from "../models/state";

export class PWAKioskApi extends KioskApi {
    kioskRoutes: { [key: string]: string } | null = null
    public apiBaseAddress = "http://localhost:5000/"
    private userId: String = ""
    private password: String = ""

    getKioskRoute(routeName: string) {
        if (!this.kioskRoutes) {
            console.log("PWAKioskApi: No kiosk routes registered. Please call registerRoute to register routes for the dev instance.")
            return ""
        }
        if (!(routeName in this.kioskRoutes)) {
            console.log(`PWAKioskApi: The kiosk route ${routeName} is not registered. 
            Please call registerRoute to register this route explicitly for the dev instance.`)
            return ""
        }
        return this.apiBaseAddress + this.kioskRoutes[routeName]
    }

    registerRoute(routeName: string, url: string) {
        if (!this.kioskRoutes) this.kioskRoutes = {}
        this.kioskRoutes[routeName] = url
    }

    getApiUrl(apiAddress?: String) {
        if (apiAddress) {
            return `${this.apiBaseAddress}${this.apiRoot}v1/${apiAddress}`;
        } else {
            return this.apiBaseAddress;
        }
    }

    getHeaders(mimetype:string)  {
        let headers = super.getHeaders(mimetype)
        // @ts-ignore
        headers.append("webapp-user-id",import.meta.env.VITE_DEV_API_USER);
        // @ts-ignore
        headers.append("webapp-user-pwd",import.meta.env.VITE_DEV_API_PWD);
        return headers
    }

    setApiBaseAddress(address: string) {
        this.apiBaseAddress = address
    }

    setCredentials(userId: string, password: string) {
        this.userId = userId
        this.password = password
    }


    async initApi() {
        this.status = API_STATE_INITIALIZING;
        appState.setApiReady(false)
        let headers = new Headers()
        console.log("meta:", import.meta)
        headers.append("Content-Type", "application/json");
        headers.append("Accept", "application/json");
        // @ts-ignore
        headers.append("Origin", this.getApiUrl());

        let address = this.getApiUrl("login");
        console.log(`Initializing Api ${address}`)
        let response;
        try {
            response = await fetch(address, {
                headers: headers,
                body: JSON.stringify({
                    // @ts-ignore
                    userid: this.userId,
                    // @ts-ignore
                    password: this.password
                }),
                method: "POST",
            });
        } catch (e: any) {
            // console.log(`throwing FetchException after caught ${e}`)
            this.status = API_STATE_ERROR;
            this.lastErrorMessage = e.message;
            throw new FetchException(e, null);
        }
        if (response.ok) {
            let data = await response.json();
            this.token = data["token"];
            this.status = API_STATE_READY;
            appState.setApiReady(true)
        } else {
            // console.log(`throwing FetchException ${response.statusText}`)
            this.status = API_STATE_ERROR;
            this.lastErrorMessage = response.statusText;
            throw new FetchException(response.statusText, response);
        }
    }
}
