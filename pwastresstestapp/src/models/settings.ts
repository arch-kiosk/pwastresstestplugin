import { openDB} from 'idb';

const dbSettings = openDB('pwastresstest', 1, {
    upgrade(db) {
        db.createObjectStore('settings');
    },
});

export class Settings {
    server_address: string = ""
    user_id: string = ""
    password: string = ""
    dock_id: string = ""

    validate() {
        return !(this.server_address === "" || this.user_id === "" || this.dock_id === "" || this.password === "")
    }
    async save() {
        let db = (await dbSettings)
        await db.put('settings',
            {
                server_address: this.server_address,
                userid: this.user_id,
                dockid: this.dock_id,
                password: this.password
            },'settings')

    }
    async load() {
        let db = (await dbSettings)
        let settings = await db.get('settings','settings')
        this.server_address = settings.server_address
        this.user_id = settings.userid
        this.dock_id = settings.dockid
        this.password = settings.password
    }
}

