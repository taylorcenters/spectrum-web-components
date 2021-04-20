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
    TemplateResult,
    query,
    styleMap,
    ifDefined,
} from '@spectrum-web-components/base';
import { SliderBase } from './SliderBase';
import { streamingListener } from '@spectrum-web-components/base/src/streaming-listener.js';

import { StyleInfo } from 'lit-html/directives/style-map';

export const variants = ['filled', 'ramp', 'range', 'tick'];

export class Slider extends SliderBase {
    @property({ type: Number, reflect: true })
    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        const oldValue = this.value;
        if (this.input) {
            this.input.value = String(value);
        }
        const newValue = this.input ? parseFloat(this.input.value) : value;

        if (newValue === oldValue) {
            return;
        }

        this._value = newValue;
        this.requestUpdate('value', oldValue);
    }

    private _value = 10;

    @property({ type: String })
    public set variant(variant: string) {
        const oldVariant = this.variant;
        if (variant === this.variant) {
            return;
        }
        if (variants.includes(variant)) {
            this.setAttribute('variant', variant);
            this._variant = variant;
        } else {
            this.removeAttribute('variant');
            this._variant = '';
        }
        this.requestUpdate('variant', oldVariant);
    }

    public get variant(): string {
        return this._variant;
    }

    /* Ensure that a '' value for `variant` removes the attribute instead of a blank value */
    private _variant = '';

    @property({ attribute: false })
    public getAriaValueText: (value: number) => string = (value) => `${value}`;

    @property({ attribute: false })
    protected get ariaValueText(): string {
        if (!this.getAriaValueText) {
            return `${this.value}`;
        }
        return this.getAriaValueText(this.value);
    }

    @query('#handle')
    private handle!: HTMLDivElement;

    @query('#input')
    private input!: HTMLInputElement;

    public get focusElement(): HTMLElement {
        return this.input;
    }

    private renderTrackLeft(): TemplateResult {
        if (this.variant === 'ramp') {
            return html``;
        }
        return html`
            <div
                class="track"
                id="track-left"
                style=${styleMap(this.trackStartStyles)}
                role="presentation"
            ></div>
        `;
    }

    private renderTrackRight(): TemplateResult {
        if (this.variant === 'ramp') {
            return html``;
        }
        return html`
            <div
                class="track"
                id="track-right"
                style=${styleMap(this.trackEndStyles)}
                role="presentation"
            ></div>
        `;
    }

    private renderRamp(): TemplateResult {
        if (this.variant !== 'ramp') {
            return html``;
        }
        return html`
            <div id="ramp">
                <svg
                    viewBox="0 0 240 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M240,4v8c0,2.3-1.9,4.1-4.2,4L1,9C0.4,9,0,8.5,0,8c0-0.5,0.4-1,1-1l234.8-7C238.1-0.1,240,1.7,240,4z"
                    ></path>
                </svg>
            </div>
        `;
    }

    private renderTicks(): TemplateResult {
        if (this.variant !== 'tick') {
            return html``;
        }
        const tickStep = this.tickStep || this.step;
        const tickCount = (this.max - this.min) / tickStep;
        const partialFit = tickCount % 1 !== 0;
        const ticks = new Array(Math.floor(tickCount + 1));
        ticks.fill(0, 0, tickCount + 1);
        return html`
            <div
                class="${partialFit ? 'not-exact ' : ''}ticks"
                style=${ifDefined(
                    partialFit
                        ? `--sp-slider-tick-offset: calc(100% / ${this.max} * ${this.tickStep}`
                        : undefined
                )}
            >
                ${ticks.map(
                    (_tick, i) => html`
                        <div class="tick">
                            ${this.tickLabels
                                ? html`
                                      <div class="tickLabel">
                                          ${i * tickStep}
                                      </div>
                                  `
                                : html``}
                        </div>
                    `
                )}
            </div>
        `;
    }

    protected renderHandle(): TemplateResult {
        return html`
            <div
                id="handle"
                style=${this.handleStyle}
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
                    value=${this.value}
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

    protected renderTrack(): TemplateResult {
        return html`
            <div @pointerdown=${this.handleTrackPointerdown}>
                <div id="controls">
                    ${this.renderTrackLeft()} ${this.renderRamp()}
                    ${this.renderTicks()} ${this.renderHandle()}
                    ${this.renderTrackRight()}
                </div>
            </div>
        `;
    }

    protected handlePointerdown(event: PointerEvent): void {
        if (this.disabled || event.button !== 0) {
            event.preventDefault();
            return;
        }
        this.boundingClientRect = this.getBoundingClientRect();
        this.labelEl.click();
        this.dragging = true;
        this.handle.setPointerCapture(event.pointerId);
    }

    protected handlePointerup(event: PointerEvent): void {
        // Retain focus on input element after mouse up to enable keyboard interactions
        this.labelEl.click();
        this.handleHighlight = false;
        this.dragging = false;
        this.handle.releasePointerCapture(event.pointerId);
        this.dispatchChangeEvent();
    }

    protected handlePointermove(event: PointerEvent): void {
        if (!this.dragging) {
            return;
        }
        this.value = this.calculateHandlePosition(event);
    }

    /**
     * Move the handle under the cursor and begin start a pointer capture when the track
     * is moused down
     */
    protected handleTrackPointerdown(event: PointerEvent): void {
        if (
            event.target === this.handle ||
            this.disabled ||
            event.button !== 0
        ) {
            return;
        }
        this.boundingClientRect = this.getBoundingClientRect();

        this.dragging = true;
        this.handle.setPointerCapture(event.pointerId);

        /**
         * Dispatch a synthetic pointerdown event to ensure that pointerdown
         * handlers attached to the slider are invoked before input handlers
         */
        event.stopPropagation();
        const syntheticPointerEvent = new PointerEvent('pointerdown', event);
        this.dispatchEvent(syntheticPointerEvent);

        this.value = this.calculateHandlePosition(event);
    }

    /**
     * Keep the slider value property in sync with the input element's value
     */
    protected onInputChange(): void {
        const inputValue = parseFloat(this.input.value);
        this.value = inputValue;

        this.dispatchChangeEvent();
    }

    protected onInputFocus(): void {
        let isFocusVisible;
        try {
            isFocusVisible =
                this.input.matches(':focus-visible') ||
                this.matches('.focus-visible');
        } catch (error) {
            isFocusVisible = this.matches('.focus-visible');
        }
        this.handleHighlight = isFocusVisible;
    }

    protected onInputBlur(): void {
        this.handleHighlight = false;
    }

    /**
     * Returns the value under the cursor
     * @param: PointerEvent on slider
     * @return: Slider value that correlates to the position under the pointer
     */
    private calculateHandlePosition(event: PointerEvent | MouseEvent): number {
        if (!this.boundingClientRect) {
            return this.value;
        }
        const rect = this.boundingClientRect;
        const minOffset = rect.left;
        const offset = event.clientX;
        const size = rect.width;

        const percent = (offset - minOffset) / size;
        const value = this.min + (this.max - this.min) * percent;

        return this.isLTR ? value : this.max - value;
    }

    protected dispatchChangeEvent(): void {
        this.input.value = this.value.toString();
        super.dispatchChangeEvent();
    }

    /**
     * Ratio representing the slider's position on the track
     */
    private get trackProgress(): number {
        const range = this.max - this.min;
        const progress = this.value - this.min;

        return progress / range;
    }

    private get trackStartStyles(): StyleInfo {
        return {
            width: `${this.trackProgress * 100}%`,
            '--spectrum-slider-track-background-size': `calc(100% / ${this.trackProgress})`,
        };
    }

    private get trackEndStyles(): StyleInfo {
        return {
            width: `${100 - this.trackProgress * 100}%`,
            '--spectrum-slider-track-background-size': `calc(100% / ${
                1 - this.trackProgress
            })`,
        };
    }

    private get handleStyle(): string {
        return `${this.isLTR ? 'left' : 'right'}: ${this.trackProgress * 100}%`;
    }
}
