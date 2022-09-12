import {dbPWA} from "./dbpwa";

export interface ImageRecord {
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

    async load(): Promise<Array<ImageRecord>> {
        let db = (await dbPWA)
        let keys = await db.getAllKeys("imagerecords")
        let result: Array<ImageRecord> = []
        for (const k of keys) {
            let record = await db.get("imagerecords", k)
            result.push({
                uid: k.toString(),
                res: record.res,
                modified: record.modified
                })
        }
        return new Promise((resolve) => {
            resolve(result)
        })
    }
}

