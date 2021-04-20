/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
    html,
    property,
    CSSResultArray,
    TemplateResult,
    query,
    PropertyValues,
    ifDefined,
} from '@spectrum-web-components/base';
import { streamingListener } from '@spectrum-web-components/base/src/streaming-listener.js';

import sliderStyles from './slider.css.js';
import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';

export abstract class SliderBase extends Focusable {
    public static get styles(): CSSResultArray {
        return [sliderStyles];
    }

    @property()
    public type = '';

    protected abstract get ariaValueText(): string;

    @property()
    public label = '';

    @property({ reflect: true, attribute: 'aria-label' })
    public ariaLabel?: string;

    @property({ type: Number })
    public max = 100;

    @property({ type: Number })
    public min = 0;

    @property({ type: Number })
    public step = 1;

    @property({ type: Number, attribute: 'tick-step' })
    public tickStep = 0;

    @property({ type: Boolean, attribute: 'tick-labels' })
    public tickLabels = false;

    @property({ type: Boolean, reflect: true })
    public disabled = false;

    @property({ type: Boolean, reflect: true })
    public dragging = false;

    @property({ type: Boolean, reflect: true, attribute: 'handle-highlight' })
    public handleHighlight = false;

    @query('#label')
    protected labelEl!: HTMLLabelElement;

    protected boundingClientRect?: DOMRect;

    protected render(): TemplateResult {
        return html`
            ${this.renderLabel()} ${this.renderTrack()}
        `;
    }

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has('value')) {
            this.dispatchInputEvent();
        }
    }

    private renderLabel(): TemplateResult {
        return html`
            <div id="labelContainer">
                <label id="label" for="input"><slot>${this.label}</slot></label>
                <output id="value" aria-live="off" for="input">
                    ${this.ariaValueText}
                </output>
            </div>
        `;
    }

    protected renderHandle(handleStyle: string, value: number): TemplateResult {
        return html`
            <div
                id="handle"
                style=${handleStyle}
                @manage=${streamingListener(
                    { type: 'pointerdown', fn: this.handlePointerdown },
                    { type: 'pointermove', fn: this.handlePointermove },
                    {
                        type: ['pointerup', 'pointercancel'],
                        fn: this.handlePointerup,
                    }
                )}
                role="presentation"
            >
                <input
                    type="range"
                    id="input"
                    value=${value}
                    step=${this.step}
                    min=${this.min}
                    max=${this.max}
                    aria-disabled=${ifDefined(
                        this.disabled ? 'true' : undefined
                    )}
                    aria-valuetext=${this.ariaValueText}
                    @change=${this.onInputChange}
                    @focus=${this.onInputFocus}
                    @blur=${this.onInputBlur}
                />
            </div>
        `;
    }

    protected abstract renderTrack(): TemplateResult;

    protected abstract handlePointerdown(event: PointerEvent): void;
    protected abstract handlePointerup(event: PointerEvent): void;
    protected abstract handlePointermove(event: PointerEvent): void;

    protected abstract onInputChange(): void;
    protected abstract onInputFocus(): void;
    protected abstract onInputBlur(): void;

    protected dispatchInputEvent(): void {
        if (!this.dragging) {
            return;
        }
        const inputEvent = new Event('input', {
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(inputEvent);
    }

    protected dispatchChangeEvent(): void {
        const changeEvent = new Event('change', {
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(changeEvent);
    }
}
