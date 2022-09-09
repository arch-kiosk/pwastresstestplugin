import {dbPWA} from "./dbpwa";

interface ImageRecord {
    uid: string
    res: string
    modified: string
}

export class ImageRecords {

    async add_update_record(r: ImageRecord) {
        let db = (await dbPWA)
        await db.put('imagerecords',
            {res: r.res, modified: r.modified},r.uid)
    }

    // async load() {
    //     let db = (await dbSettings)
    //     let settings = await db.get('settings','settings')
    //     this.server_address = settings.server_address
    //     this.user_id = settings.userid
    //     this.dock_id = settings.dockid
    //     this.password = settings.password
    // }
}

