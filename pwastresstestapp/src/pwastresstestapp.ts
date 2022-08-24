import {html, unsafeCSS} from 'lit'
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
import { observable, action } from 'mobx';
import {appState} from "./models/state";
import {PWAKioskApi} from "./lib/pwakioskapi";

// @ts-ignore
@customElement('pwastresstest-app')
export class PWAStressTestApp extends MobxLitElement {
  static styles = unsafeCSS(local_css);
  private appState = appState

  @state()
  private dialogOpened = false;

  private connectMenuItems: [MenuBarItem]= [
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
  }

  private initApi() {
    if (this.appState.settings.validate()) {
      this.kioskApi.setApiBaseAddress(this.appState.settings.server_address)
      this.kioskApi.setCredentials(this.appState.settings.user_id, this.appState.settings.password)
      this.kioskApi.initApi()
          .then(() => {
            console.log(`call to initApi done. Api is now in state ${this.kioskApi.status}`)
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

  menuItemSelected(e: MenuBarItemSelectedEvent) {
    console.log(e.detail.value)
    switch(e.detail.value.text) {
      case 'change configuration':
        this.changeConfiguration()
        break;

      case 'connect':
        this.initApi()
        break;

      case 'download':
        alert("Download!")
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
    // if (!this.appState.apiReady) {
    //   if (!this.appState.settings.validate()) {
    //     this.connectMenuItems = [
    //       {
    //         text: 'Not configured',
    //         children: [{text: 'change configuration'}],
    //       },
    //     ];
    //   } else {
    //     this.connectMenuItems = [
    //       {
    //         text: 'Not connected',
    //         children: [
    //             {text: 'change configuration'},
    //             {text: 'connect'}],
    //       },
    //     ];
    //   }
    // } else {
    //   this.connectMenuItems = [
    //     {
    //       text: 'Kiosk connected',
    //       children: [{ text: 'change configuration' }],
    //     },
    //   ];
    // }
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
      <div class="left-header">
        <button class="modal-round-button" @click="${this.refresh}"></button>
        <vaadin-menu-bar class="${this.appState.apiReady?'menu-bar-green':'menu-bar-red'}"
            .items="${this.connectMenuItems}"
            @item-selected="${this.menuItemSelected}"
        </vaadin-menu-bar> 
      </div>
      <span>${this.appState.settings.user_id} accessing ${this.appState.settings.server_address}</span> 
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