import { Settings } from "./settings";
import { MenuBarItem } from "@vaadin/vaadin-menu-bar";
declare class AppState {
    settings: Settings;
    setSettings(settings: Settings): void;
    apiReady: boolean;
    setApiReady(apiReady: boolean): void;
    currentState: Number;
    setCurrentState(currentState: Number): void;
    constructor();
    getAvailableTransitions(apiState: Number): [MenuBarItem];
}
export declare const appState: AppState;
export {};
