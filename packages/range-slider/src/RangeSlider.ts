/*
Copyright 2021 Adobe. All rights reserved.
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
} from '@spectrum-web-components/base';
import { SliderBase } from '@spectrum-web-components/slider';

import { StyleInfo } from 'lit-html/directives/style-map';

type ThumbRatios = {
    start: number;
    end: number;
};

export class RangeSlider extends SliderBase {
    @property({ attribute: 'value-start', type: Number, reflect: true })
    public get valueStart(): number {
        return this._valueStart;
    }

    public set valueStart(value: number) {
        const oldValue = this.valueStart;
        if (this.inputStart) {
            this.inputStart.value = String(value);
        }
        const newValue = this.inputStart
            ? parseFloat(this.inputStart.value)
            : value;

        if (newValue === oldValue) {
            return;
        }

        this._valueStart = newValue;
        this.requestUpdate('valueStart', oldValue);
    }

    private _valueStart = 10;

    @property({ attribute: 'value-end', type: Number, reflect: true })
    public get valueEnd(): number {
        return this._valueEnd;
    }

    public set valueEnd(value: number) {
        const oldValue = this.valueEnd;
        if (this.inputStart) {
            this.inputStart.value = String(value);
        }
        const newValue = this.inputStart
            ? parseFloat(this.inputStart.value)
            : value;

        if (newValue === oldValue) {
            return;
        }

        this._valueEnd = newValue;
        this.requestUpdate('valueEnd', oldValue);
    }

    private _valueEnd = 90;

    @property({ attribute: false })
    public getAriaValueText: (start: number, end: number) => string = (
        start,
        end
    ) => `${start} - ${end}`;

    protected get ariaValueText(): string {
        if (!this.getAriaValueText) {
            return `${this.valueStart} - ${this.valueEnd}`;
        }
        return this.getAriaValueText(this.valueStart, this.valueEnd);
    }

    @query('#input-start')
    private inputStart!: HTMLInputElement;

    private renderTrackLeft(): TemplateResult {
        return html`
            <div
                class="track"
                id="track-left"
                style=${styleMap(this.trackStartStyles)}
                role="presentation"
            ></div>
        `;
    }

    private renderTrackMiddle(): TemplateResult {
        return html`
            <div
                class="track"
                id="track-middle"
                style=${styleMap(this.trackMiddleStyles)}
                role="presentation"
            ></div>
        `;
    }

    private renderTrackRight(): TemplateResult {
        return html`
            <div
                class="track"
                id="track-right"
                style=${styleMap(this.trackEndStyles)}
                role="presentation"
            ></div>
        `;
    }

    protected renderTrack(): TemplateResult {
        return html`
            <div @pointerdown=${this.handleTrackPointerdown}>
                <div id="controls" style=${styleMap(this.rangeStyles)}>
                    ${this.renderTrackLeft()}
                    ${this.renderHandle(
                        this.handleStyle('start'),
                        this.valueStart
                    )}
                    ${this.renderTrackMiddle()}
                    ${this.renderHandle(this.handleStyle('end'), this.valueEnd)}
                    ${this.renderTrackRight()}
                </div>
            </div>
        `;
    }

    protected handlePointerdown(/* event: PointerEvent */): void {
        // if (this.disabled || event.button !== 0) {
        //     event.preventDefault();
        //     return;
        // }
        // this.boundingClientRect = this.getBoundingClientRect();
        // this.labelEl.click();
        // this.dragging = true;
        // this.handle.setPointerCapture(event.pointerId);
    }

    protected handlePointerup(/* event: PointerEvent */): void {
        // // Retain focus on input element after mouse up to enable keyboard interactions
        // this.labelEl.click();
        // this.handleHighlight = false;
        // this.dragging = false;
        // this.handle.releasePointerCapture(event.pointerId);
        // this.dispatchChangeEvent();
    }

    protected handlePointermove(/* event: PointerEvent */): void {
        // if (!this.dragging) {
        //     return;
        // }
        // this.value = this.calculateHandlePosition(event);
    }

    /**
     * Move the handle under the cursor and begin start a pointer capture when the track
     * is moused down
     */
    protected handleTrackPointerdown(/* event: PointerEvent */): void {
        // if (
        //     event.target === this.handle ||
        //     this.disabled ||
        //     event.button !== 0
        // ) {
        //     return;
        // }
        // this.boundingClientRect = this.getBoundingClientRect();
        // this.dragging = true;
        // this.handle.setPointerCapture(event.pointerId);
        // /**
        //  * Dispatch a synthetic pointerdown event to ensure that pointerdown
        //  * handlers attached to the slider are invoked before input handlers
        //  */
        // event.stopPropagation();
        // const syntheticPointerEvent = new PointerEvent('pointerdown', event);
        // this.dispatchEvent(syntheticPointerEvent);
        // this.value = this.calculateHandlePosition(event);
    }

    /**
     * Keep the slider value property in sync with the input element's value
     */
    protected onInputChange(): void {
        // const inputValue = parseFloat(this.input.value);
        // this.value = inputValue;
        // this.dispatchChangeEvent();
    }

    protected onInputFocus(): void {
        // let isFocusVisible;
        // try {
        //     isFocusVisible =
        //         this.input.matches(':focus-visible') ||
        //         this.matches('.focus-visible');
        // } catch (error) {
        //     isFocusVisible = this.matches('.focus-visible');
        // }
        // this.handleHighlight = isFocusVisible;
    }

    protected onInputBlur(): void {
        // this.handleHighlight = false;
    }

    /**
     * Ratios representing the slider positions on the track
     */
    private get thumbRatios(): ThumbRatios {
        const range = this.max - this.min;
        return {
            start: (this.valueStart - this.min) / range,
            end: (this.valueEnd - this.min) / range,
        };
    }

    private get rangeStyles(): StyleInfo {
        const progress = this.thumbRatios;
        return {
            '--spectrum-slider-track-range-start': `${progress.start * 100}%`,
            '--spectrum-slider-track-range-end': `${progress.end * 100}%`,
        };
    }

    private get trackStartStyles(): StyleInfo {
        const progress = this.thumbRatios.start;
        return {
            width: `${progress * 100}%`,
            '--spectrum-slider-track-background-size': `calc(100% / ${progress})`,
        };
    }

    private get trackMiddleStyles(): StyleInfo {
        const progress = this.thumbRatios;
        return {
            width: `${(progress.end - progress.start) * 100}%`,
            '--spectrum-slider-track-background-size': `calc(100% / ${
                progress.end - progress.start
            })`,
            '--spectrum-slider-track-range-start': `${progress.start * 100}%`,
            '--spectrum-slider-track-range-end': `${progress.end * 100}%`,
        };
    }

    private get trackEndStyles(): StyleInfo {
        const progress = this.thumbRatios.end;
        return {
            width: `${100 - progress * 100}%`,
            '--spectrum-slider-track-background-size': `calc(100% / ${
                1 - progress
            })`,
        };
    }

    private handleStyle(handle: 'start' | 'end'): string {
        return `${this.isLTR ? 'left' : 'right'}: ${
            this.thumbRatios[handle] * 100
        }%`;
    }
}
