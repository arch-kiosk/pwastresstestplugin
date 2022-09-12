import {html, unsafeCSS, nothing} from 'lit'
import {MobxLitElement} from "@adobe/lit-mobx";
import { customElement, state, property} from 'lit/decorators.js'
// @ts-ignore
import { observable, action } from 'mobx';

// @ts-ignore
import local_css from "./component-imagecounting.sass";
import {WorkerProgress} from "./imagecountworker";
// @ts-ignore
import ImageCountWorker from "./imagecountworker?worker"

@customElement('image-counting')
export class ImageCounting extends MobxLitElement {
    // noinspection JSUnusedGlobalSymbols
    static styles = unsafeCSS(local_css);

    @state()
    private worker: Worker | null = null

    @state()
    private workerProgress: WorkerProgress | null = null

    @property()
    private templateaddress: string = ""

    willUpdate() {
    }

    start() {
        this.worker = new ImageCountWorker()
        if (this.worker) {
            this.worker.onmessage = (e) => {
                const msg: WorkerProgress = e.data
                console.log(e)
                this.workerProgress = msg
            }
            console.log("Worker started...")
            this.worker.postMessage([{templateAddress: this.templateaddress}])
        }
        else {
            console.log("Could not initialize ImageCountWorker")
        }
    }

    render() {
        return html`
            <div>
                TemplateAddress: <span>${this.templateaddress}</span>
                <button class="count-images" @click="${this.start}">${this.workerProgress?'recount images':'count images'}</button>
                ${this.workerProgress?html`
                    <div>
                        <div>progress: ${this.workerProgress.images?(this.workerProgress.imagesDone + this.workerProgress.imagesError) * 100 / this.workerProgress.images:0}\%</div>
                        <div>images found: ${this.workerProgress.imagesDone}</div>
                        <div>images error: ${this.workerProgress.imagesError}</div>
                    </div>                        
                        ` 
                :nothing
                }
            </div>
        `
    }
}