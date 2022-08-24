import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import {observable, action, makeObservable} from 'mobx';
import { MobxLitElement } from '@adobe/lit-mobx';

// create a mobx observable
class Counter {
    @observable
    public count = 0;

    @action
    public increment() {
        this.count++;
    }

    constructor() {
        makeObservable(this)
    }
}

// create instance that can be shared across components
const counter = new Counter();

// create a new custom element, and use the base MobxLitElement class
// alternatively you can use the MobxReactionUpdate mixin, e.g. `class MyElement extends MobxReactionUpdate(LitElement)`
@customElement('my-element')
// @ts-ignore
class MyElement extends MobxLitElement {
    // private counter = counter

    // any observables accessed in the render method will now trigger an update
    public render() {
        return html`
            Count is now ${counter.count}
            <br />
            <button @click=${this.incrementCount}>Add</button>
        `;
    }

    public firstUpdated() {
        // you can update in first updated
        counter.increment(); // value is now 1
    }

    private incrementCount() {
        // and you can trigger change in event callbacks
        counter.increment(); // value is now n + 1
    }
}