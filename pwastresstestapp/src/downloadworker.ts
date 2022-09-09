import {FetchException} from "./lib/kioskapi.js";
import {PWAKioskApi} from "./lib/pwakioskapi";
import {ImageRecords} from "./models/imagerecords";


export interface WorkerMessage {
    msgId: string
}

export interface DownloadWorkerMessage extends WorkerMessage {
    apiRoot: string
    token: string
    dockId: string
}

export interface DownloadWorkerSuccessMessage extends WorkerMessage {
    downloaded: Number,
    errors: Number
}

onmessage = (ev) => {
    const msg:WorkerMessage = ev.data[0]
    if (msg.msgId == "init") {
        let downloadWorker = new DownloadWorker(<DownloadWorkerMessage>msg)
        downloadWorker.execute()
    }
}

class DownloadWorker {
    private readonly token: string
    private readonly dockId: string
    private api: PWAKioskApi
    private imageRecords: any | null = null
    private downloaded = 0
    private errors = 0

    constructor(msg: DownloadWorkerMessage) {
        this.token = msg.token
        this.dockId = msg.dockId
        this.api = new PWAKioskApi(msg.apiRoot, msg.token)
    }

    execute() {
        let startTime = new Date();
        console.log(`executing download worker with ${this.token}, ${this.dockId}, ${this.api.apiRoot}`)
        this.startDownload()
            .then(() => {
                console.log(`images: ${this.imageRecords.length}`)
                this.downloaded = 0
                this.errors = 0
                this.downloadFiles().then(()=>{
                    console.log("All files have been downloaded.")
                    let endTime   = new Date();
                    let seconds = (endTime.getTime() - startTime.getTime()) / 1000;
                    console.log(`download took ${seconds} seconds`)
                    let successMessage: DownloadWorkerSuccessMessage = {
                        msgId: "result",
                        errors: this.errors,
                        downloaded: this.downloaded
                    }
                    postMessage(successMessage)
                })
            })
            .catch((e: FetchException) => {
                // appState.setDocked(false)
                if (e.response && e.response.status == 404) {
                    // this.kioskError = this.appState.settings.dock_id  + " does not exist."
                }
                else {
                    // this.kioskError = "Network error: " + e
                }
            })
    }

    getRequestForOneFile(file_uid: string, resolution: string): Request {
        let searchParams = {
            uuid: file_uid
        }
        if (resolution !== "") {
            // @ts-ignore
            searchParams.resolution = resolution
        }

        return this.api.getFetchFileFromApiRequest(
            "api",
            "files/file",
            {
                method: "GET"
            },
            "v1",
            // @ts-ignore
            new URLSearchParams(searchParams))
    }

    async downloadFiles() {
        let cache = await caches.open("images")
        let imageRecords = new ImageRecords()
        await Promise.all(
            this.imageRecords.map((r: any) => {
                return cache.add(this.getRequestForOneFile(r["uid"], r["res"]))
                    .then(() => {
                        imageRecords.add_update_record({
                            uid: r["uid"],
                            res: r["res"],
                            modified: r["modified"]
                        })
                        this.downloaded++
                    })
                    .catch((error) => {
                        console.log(`Can't download ${r["uid"]} with resolution ${r["res"]}: ${error}`)
                        imageRecords.add_update_record({
                            uid: r["uid"],
                            res: "dummy",
                            modified: r["modified"]
                        })
                        this.errors++
                    })
            })
        )
        console.log("Cache.addAll ready")
    }

    async startDownload () {
        let data = await this.api.fetchFromApi("api/pwastresstestdock","dock", {}, "v1", `dock_id=${this.dockId}`)
        this.imageRecords = data["image_records"]
    }
}


