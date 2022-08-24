import { MobxLitElement } from "@adobe/lit-mobx";
import '@vaadin/vaadin-menu-bar/vaadin-menu-bar.js';
import { MenuBarItemSelectedEvent } from "@vaadin/vaadin-menu-bar";
import '@vaadin/dialog';
export declare class PWAStressTestApp extends MobxLitElement {
    static styles: import("lit").CSSResult;
    private appState;
    private dialogOpened;
    private connectMenuItems;
    private kioskApi;
    constructor();
    connectedCallback(): void;
    private initApi;
    menuItemSelected(e: MenuBarItemSelectedEvent): void;
    private changeConfiguration;
    willUpdate(): void;
    calcKioskState(): void;
    dialog_opened_change(e: CustomEvent): void;
    private _apply_settings;
    private _close_settings;
    private refresh;
    private renderDialog;
    render(): import("lit-html").TemplateResult<1>;
    private renderFooter;
}