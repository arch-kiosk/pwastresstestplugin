import { Settings } from "./settings";
import { MenuBarItem } from "@vaadin/vaadin-menu-bar";
export declare const STATE_IDLE = 1;
export declare const STATE_IN_THE_FIELD = 2;
declare class AppState {
    settings: Settings;
    setSettings(settings: Settings): void;
    apiReady: boolean;
    setApiReady(apiReady: boolean): void;
    docked: boolean;
    setDocked(docked: boolean): void;
    currentState: Number;
    setCurrentState(currentState: Number): void;
    constructor();
    getAvailableTransitions(apiState: Number): [MenuBarItem];
    saveState(): Promise<void>;
    loadState(): Promise<void>;
}
export declare const appState: AppState;
export {};
