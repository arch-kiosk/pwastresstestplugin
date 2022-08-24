// @ts-ignore
import {observable, action, makeObservable} from 'mobx';

import {Settings} from "./settings";
import {API_STATE_READY} from "../lib/kioskapi";
import {MenuBarItem} from "@vaadin/vaadin-menu-bar";

const STATE_IDLE = 1
const STATE_IN_THE_FIELD = 2

class AppState {


    @observable
    public settings = new Settings()

    @action
    public setSettings(settings: Settings) {
        this.settings = settings
    }

    @observable
    public apiReady: boolean = false

    @action
    public setApiReady(apiReady: boolean) {
        console.log(`appState: apiReady set from ${this.apiReady} to ${apiReady}`)
        this.apiReady = apiReady
    }

    @observable
    public currentState: Number = STATE_IDLE

    @action
    public setCurrentState(currentState: Number) {
        this.currentState = currentState
    }

    constructor() {
        console.log("appState initialized")
        makeObservable(this)
    }

    public getAvailableTransitions(apiState: Number): [MenuBarItem] {
        let result:MenuBarItem = {}
        switch (this.currentState) {
            case STATE_IDLE:
                if (apiState === API_STATE_READY) {
                    result.text = "connected"
                    result.children = [
                        {text: "download"},
                        {text: "change configuration"}]
                } else {
                    if (this.settings.validate()) {
                        result.text = "not connected"
                        result.children = [
                            {text: "connect"},
                            {text: "change configuration"}]
                    } else {
                        result.text = "not configured"
                        result.children = [
                            {text: "change configuration"}]
                    }
                }
                break
            case STATE_IN_THE_FIELD:
                if (apiState === API_STATE_READY) {
                    result.text = "connected"
                    result.children = [
                        {text: 'upload'},
                        {text: 'reset'}
                    ]
                } else {
                    if (this.settings.validate()) {
                        result.text = "not connected"
                        result.children = [
                            {text: 'reset'}]
                    } else {
                        result.text = "not configured"
                        result.children = [
                            {text: 'reset'}]
                    }
                }
                break
        }
        return [result]

    }
}

export const appState = new AppState();