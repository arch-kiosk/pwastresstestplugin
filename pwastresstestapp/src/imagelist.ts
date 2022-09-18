import {html, unsafeCSS} from 'lit'
import {MobxLitElement} from "@adobe/lit-mobx";
import { customElement, state, property} from 'lit/decorators.js'
// @ts-ignore
import { observable, action } from 'mobx';
import {ImageRecords, ImageRecord} from "./models/imagerecords";
import {appState, STATE_IN_THE_FIELD} from "./models/state";

// @ts-ignore
import local_css from "./component-imagelist.sass";

@customElement('image-list')
export class ImageList extends MobxLitElement {
    // noinspection JSUnusedGlobalSymbols
    static styles = unsafeCSS(local_css);

    @state()
    private images: Array<ImageRecord> = [
    ]

    @property()
    private templateAddress: string = ""

    connectedCallback() {
        super.connectedCallback()
        let imageLoader = new ImageRecords()
        imageLoader.load().then((loadedImages) => {
            this.images = loadedImages
        } )
    }

    imageClicked(e: PointerEvent) {
        if (!e.target) throw("can't access e.target")
        const element: HTMLDivElement = <HTMLDivElement>e.currentTarget
        const index = parseInt(element.getAttribute("data-index")!)
        const imageRecord = this.images[index]
        let searchParams = {
            uuid: imageRecord.uid
        }
        if (imageRecord.res !== "") {
            // @ts-ignore
            searchParams.resolution = imageRecord.res
        }
        if (this.templateAddress == "") throw("no templateAddress given in imageClicked")
        let address = this.templateAddress + "?" + new URLSearchParams(searchParams)
        console.log("checking address")
        const request = new Request(new URL(address))

        caches.open("images")
            .then(cache => cache.match(request))
            .then(response => {
                if (response && response.ok) {
                    return response.blob()
                }
                else {
                    throw(`error fetching response from cache: ${address}`)
                }
            })
            .then(blob => {
                const imageObjectURL = URL.createObjectURL(blob);
                console.log(imageObjectURL)
                if (!element.style.backgroundImage) {
                    element.style.backgroundImage = `url(${imageObjectURL})`
                    element.style.backgroundSize = 'contain'
                    element.style.backgroundPosition = 'center'
                    // element.style.height = '256px'
                    element.style.width = '100vw'
                    element.style.height = '100vh'
                } else {
                    // element.style.backgroundImage = ``
                    element.style.width = '128px'
                    element.style.height = '128px'
                }
                // URL.revokeObjectURL(imageObjectURL)
            })
            .catch((error) => {
                element.style.background = 'var(--col-error-bg-1)'
                console.log(`Error in imageClicked: ${error}`)
                alert(error)
            })

    }

    willUpdate() {
    }

    render() {
        return html`${appState.currentState != STATE_IN_THE_FIELD?undefined:html`
            <div class="imagelist">
                ${this.images.map((image: ImageRecord, index) => html`
                    <div id="image${index}" data-index="${index}" class="image-box" @click="${this.imageClicked}"><div class="image-index">${index+1}</div><div class="image-desc">${image.modified}</div></div>`
                )}
            </div>`}
        `
    }
}