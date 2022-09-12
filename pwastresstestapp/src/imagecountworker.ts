import {ImageRecords} from "./models/imagerecords";

export interface WorkerProgress {
    imagesDone: number
    images: number
    imagesError: number
}

export interface InitCounting {
    templateAddress: string,
}

onmessage = (e) => {
    const data: InitCounting = e.data[0]
    countImages(data.templateAddress).catch((e) => {console.log(e)})
}
async function countImages (templateAddress: string) {
    let imagesDone = 0
    let imageCount = 0
    let imagesError = 0

    console.log("Image count worker starts")
    postMessage({
        imagesDone: imagesDone,
        images: imageCount,
        imagesError: imagesError
    })

    let imageRecords = new ImageRecords()
    let images = await imageRecords.load()
    imageCount = images.length

    console.log(`templateAddress: ${templateAddress}, images: ${images.length}`)

    let cache = await caches.open("images")

    for (const r of images) {
        let searchParams = {
            uuid: r.uid
        }
        if (r.res !== "") {
            // @ts-ignore
            searchParams.resolution = r.res
        }
        let address = templateAddress + "?" + new URLSearchParams(searchParams)
        console.log("checking address")
        const request = new Request(new URL(address))
        let response = await cache.match(request)
        if (response && response.ok) {
            imagesDone += 1
            console.log(`address ${address} okay`)
        } else {
            console.log(`address ${address} not in cache`)
            console.log(response)
            imagesError += 1
        }
        if ((imagesError + imagesDone) % 50 == 0) {
            postMessage({
                imagesDone: imagesDone,
                images: imageCount,
                imagesError: imagesError
            })
        }
    }
    postMessage({
        imagesDone: imagesDone,
        images: imageCount,
        imagesError: imagesError
    })
}
