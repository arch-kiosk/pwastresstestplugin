import {html, unsafeCSS, nothing} from 'lit'
import {MobxLitElement} from "@adobe/lit-mobx";
import { customElement, state} from 'lit/decorators.js'
import '@vaadin/vaadin-menu-bar/vaadin-menu-bar.js'
import {MenuBarItem, MenuBarItemSelectedEvent} from "@vaadin/vaadin-menu-bar";
import { dialogFooterRenderer, dialogRenderer } from '@vaadin/dialog/lit.js';
// import '@vaadin/button';
import '@vaadin/dialog';
// import '@vaadin/text-field';
// import '@vaadin/vertical-layout';
// @ts-ignore
import local_css from "./component-pwastresstest-app.sass";

import {Settings} from "./models/settings";
// @ts-ignore
// @ts-ignore
import { observable, action } from 'mobx';
import {appState, STATE_IDLE, STATE_IN_THE_FIELD} from "./models/state";
import {PWAKioskApi} from "./lib/pwakioskapi";
import {FetchException} from "./lib/kioskapi";
import {DownloadWorkerSuccessMessage} from "./downloadworker";
import "./imagecounting"
import "./imagelist"
// @ts-ignore
import DownloadWorker from "./downloadworker?worker"
// @ts-ignore
@customElement('pwastresstest-app')
export class PWAStressTestApp extends MobxLitElement {
  // noinspection JSUnusedGlobalSymbols
  static styles = unsafeCSS(local_css);
  private appState = appState

  @state()
  private dialogOpened = false;

  @state()
  private kioskError = ""
  @state()
  private kioskWarning = ""
  @state()
  private kioskMessage = ""

  private connectMenuItems: [MenuBarItem] = [
    {
      text: '-',
      children: [],
    },
  ];

  private kioskApi = new PWAKioskApi("/api/")

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback()
    let settings = new Settings()
    settings.load().then(() => {
      this.appState.setSettings(settings)
      this.initApi()
    })
    appState.loadState().catch((e: any) => {
      console.log(`load failed: ${e}`)
      appState.setCurrentState(STATE_IDLE)
    })
  }

  private initApi() {
    if (this.appState.settings.validate()) {
      this.kioskApi.setApiBaseAddress(this.appState.settings.server_address)
      this.kioskApi.setCredentials(this.appState.settings.user_id, this.appState.settings.password)
      this.kioskApi.initApi()
          .then(() => {
            console.log(`call to initApi done. Api is now in state ${this.kioskApi.status}`)
            this.connectToDock()
          })
          .catch((e) => {
            if (e.response) {
              console.log(`call to initApi failed with ${e.response.status}(${e.msg}). Api is now in state ${this.kioskApi.status}`)
            } else {
              console.log(`call to initApi failed with (${e.msg}). Api is now in state ${this.kioskApi.status}`)
            }
          })
    }
  }

  private connectToDock() {
    this.kioskApi.fetchFromApi("api/syncmanager", "dock", {}, "v1", `dock_id=${this.appState.settings.dock_id}`)
        .then((data) => {
          this.kioskError = ""
          console.log(data)
          const state_text: String = data["state_text"]
          if (!state_text.includes("forked")) {
            this.kioskError = this.appState.settings.dock_id + " is not in the correct state to connect"
          }
          appState.setDocked(true)
        })
        .catch((e: FetchException) => {
          appState.setDocked(false)
          if (e.response && e.response.status == 404) {
            this.kioskError = this.appState.settings.dock_id + " does not exist."
          } else {
            this.kioskError = "Network error: " + e
          }
        })
  }

  private download() {
    this.kioskError = ""
    this.kioskMessage = "Downloading files, hang on ..."
    this.kioskWarning = ""
    console.log("creating worker")
    const worker = new DownloadWorker()
    console.log("creating worker done")
    let msg = {
      msgId: "init",
      apiBaseAddress: this.kioskApi.apiBaseAddress,
      apiRoot: this.kioskApi.apiRoot,
      token: this.kioskApi.token,
      dockId: this.appState.settings.dock_id
    }
    worker.onmessage = (e: MessageEvent) => {
      const msg: DownloadWorkerSuccessMessage = e.data
      console.log("got message from worker:")
      console.log(e)
      this.kioskMessage = ""

      if (msg.msgId == "result") {
        if (msg.downloaded > 0 || msg.errors == 0) {
          appState.setCurrentState(STATE_IN_THE_FIELD)
        }
        if (msg.errors > 0 && msg.downloaded == 0) {
          this.kioskError = `All ${msg.errors} files failed to download.`
        } else if (msg.errors > 0 && msg.downloaded > 0) {
          this.kioskWarning = `downloaded ${msg.downloaded} files, ${msg.errors} files failed to download.`
        } else if (msg.errors == 0) {
          this.kioskMessage = `downloaded ${msg.downloaded} files, no errors`
        }
      }
    }
    worker.postMessage([msg])
  }

  menuItemSelected(e: MenuBarItemSelectedEvent) {
    console.log(e.detail.value)
    switch (e.detail.value.text) {
      case 'change configuration':
        this.changeConfiguration()
        break;

      case 'connect':
        this.initApi()
        break;

      case 'download':
        this.download()
        break;
    }
  }

  private changeConfiguration() {
    this.dialogOpened = true
  }

  willUpdate() {
    this.calcKioskState()
  }

  calcKioskState() {
    console.log("calcKioskState")
    this.connectMenuItems = appState.getAvailableTransitions(this.kioskApi.status)
  }

  // private close() {
  //   this.dialogOpened = false;
  // }

  dialog_opened_change(e: CustomEvent) {
    if (e.detail.value) {
      // @ts-ignore
      let overlay = <HTMLElement>e.currentTarget.$.overlay
      if (overlay) {
        let server_address = (<HTMLInputElement>overlay.querySelector("#server_address"))
        server_address.value = this.appState.settings.server_address
        let user_id = (<HTMLInputElement>overlay.querySelector("#userid"))
        user_id.value = this.appState.settings.user_id
        let password = (<HTMLInputElement>overlay.querySelector("#password"))
        password.value = this.appState.settings.password
        let dock_id = (<HTMLInputElement>overlay.querySelector("#dockid"))
        dock_id.value = this.appState.settings.dock_id
      }
    }
    this.dialogOpened = e.detail.value
  }

  private _apply_settings(e: Event) {
    let overlay = (<HTMLElement>e.target)?.parentNode?.parentNode
    console.log("applying settings")
    let settings = new Settings()
    settings.server_address = (<HTMLInputElement>overlay?.querySelector("#server_address")).value
    settings.user_id = (<HTMLInputElement>overlay?.querySelector("#userid")).value
    settings.password = (<HTMLInputElement>overlay?.querySelector("#password")).value
    settings.dock_id = (<HTMLInputElement>overlay?.querySelector("#dockid")).value
    this.appState.setSettings(settings)
    this.appState.settings.save()
    this._close_settings()
    this.initApi()
  }

  private _close_settings() {
    this.dialogOpened = false
  }

  private refresh() {
    appState.setApiReady(!appState.apiReady)
  }

  private getTemplateAddress() {
    return `${this.appState.settings.server_address}/api/v1/files/file`;
  }


  private renderDialog = () => html`
    <div>
      <div class="settings-dialog">
        <label for="server_address">Kiosk address</label><input name="server_address" id="server_address" type="text">
        <label for="userid">User-Id</label><input name="userid" id="userid" type="text">
        <label for="password">Password</label><input name="password" id="password" type="text">
        <label for="dockid">Dock-Id</label><input name="dockid" id="dockid" type="text">
      </div>
    </div>
  `

  render() {
    return html`
      ${this.kioskError? html`<div class="kioskError">${this.kioskError}</div>`: nothing}
      ${this.kioskWarning? html`<div class="kioskWarning">${this.kioskWarning}</div>`: nothing}
      ${this.kioskMessage? html`<div class="kioskMessage">${this.kioskMessage}</div>`: nothing}

      <div class="left-header">
        <button class="modal-round-button" @click="${this.refresh}"></button>
        <vaadin-menu-bar class="${this.appState.apiReady && this.appState.docked?'menu-bar-green':'menu-bar-red'}"
            .items="${this.connectMenuItems}"
            @item-selected="${this.menuItemSelected}"
        </vaadin-menu-bar> 
      </div>
      <span>${this.appState.settings.user_id} accessing ${this.appState.settings.server_address}${appState.docked?html`/${this.appState.settings.dock_id}`:nothing}</span>
      ${this.appState.currentState == STATE_IN_THE_FIELD?html`
        <image-counting templateaddress=${this.getTemplateAddress()}></image-counting>
        <image-list templateaddress=${this.getTemplateAddress()}></image-list>
      `:nothing}
      <vaadin-dialog
          header-title="settings"
          .opened="${this.dialogOpened}"
          @opened-changed="${this.dialog_opened_change}"
          ${dialogRenderer(this.renderDialog, [])}
          ${dialogFooterRenderer(this.renderFooter, [])}
      ></vaadin-dialog>
    `
  }

  private renderFooter = () => html`
    <button class="modal-cancel" id="apply_settings" @click="${this._close_settings}">
    </button>
    <button class="modal-ok" id="apply_settings" @click="${this._apply_settings}">
    </button>
  `
}