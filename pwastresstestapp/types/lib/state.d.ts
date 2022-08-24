import { UserData } from "./userdata";
declare class AppState {
    count: number;
    userData: UserData;
    setUserData(): void;
}
export declare const appState: AppState;
export {};
