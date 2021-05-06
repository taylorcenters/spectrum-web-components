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
    CSSResultArray,
    TemplateResult,
    SpectrumElement,
    property,
    query,
    PropertyValues,
} from '@spectrum-web-components/base';
import {
    openOverlay,
    OverlayDisplayQueryDetail,
    Placement,
} from '@spectrum-web-components/overlay';

import tooltipStyles from './tooltip.css.js';

/**
 * @slot icon - The icon that appears on the left of the label
 * @slot - The label
 */

export class Tooltip extends SpectrumElement {
    public static get styles(): CSSResultArray {
        return [tooltipStyles];
    }

    @property({ type: Boolean })
    public auto = false;

    @property({ type: Number, reflect: true })
    public offset = 6;

    @property({ type: Boolean, reflect: true })
    public open = false;

    @property({ type: Boolean, reflect: true })
    public overlaid = false;

    /**
     * @type {"auto" | "auto-start" | "auto-end" | "top" | "bottom" | "right" | "left" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "right-start" | "right-end" | "left-start" | "left-end" | "none"}
     * @attr
     */
    @property({ reflect: true })
    public placement: Placement = 'top';

    @query('#tip')
    private tipElement!: HTMLSpanElement;

    /* Ensure that a '' value for `variant` removes the attribute instead of a blank value */
    private _variant = '';

    @property({ type: String })
    public get variant(): string {
        return this._variant;
    }
    public set variant(variant: string) {
        if (variant === this.variant) {
            return;
        }
        if (['info', 'positive', 'negative'].includes(variant)) {
            this.setAttribute('variant', variant);
            this._variant = variant;
            return;
        }
        this.removeAttribute('variant');
        this._variant = '';
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener('sp-overlay-query', this.onOverlayQuery);
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('sp-overlay-query', this.onOverlayQuery);
    }

    public onOverlayQuery(event: CustomEvent<OverlayDisplayQueryDetail>): void {
        /* c8 ignore next */
        if (!event.target) return;

        const target = event.target as Node;
        /* c8 ignore next */
        if (target !== this) return;

        event.detail.overlayContentTipElement = this.tipElement;
    }

    render(): TemplateResult {
        return html`
            <slot name="icon"></slot>
            <span id="label"><slot></slot></span>
            <span id="tip"></span>
        `;
    }

    private closeOverlayCallback?: () => void;

    private openOverlay = async (): Promise<void> => {
        const parentElement = this.parentElement as HTMLElement;
        this.closeOverlayCallback = await openOverlay(
            parentElement,
            'hover',
            this,
            {
                offset: this.offset,
                placement: this.placement,
            }
        );
    };

    private closeOverlay = (): void => {
        if (this.closeOverlayCallback) {
            this.closeOverlayCallback();
            delete this.closeOverlayCallback;
        }
    };

    private overlayClosed = (): void => {
        this.overlaid = false;
    };

    private overlayOpened = (): void => {
        this.overlaid = true;
    };

    protected updated(changed: PropertyValues<this>): void {
        if (changed.has('auto')) {
            const parentElement = this.parentElement as HTMLElement;
            if (this.auto) {
                parentElement.addEventListener(
                    'pointerenter',
                    this.openOverlay
                );
                parentElement.addEventListener('focusin', this.openOverlay);
                parentElement.addEventListener(
                    'pointerleave',
                    this.closeOverlay
                );
                parentElement.addEventListener('focusout', this.closeOverlay);
                parentElement.addEventListener('sp-closed', this.overlayClosed);
                parentElement.addEventListener('sp-opened', this.overlayOpened);
            } else {
                parentElement.removeEventListener(
                    'pointerenter',
                    this.openOverlay
                );
                parentElement.removeEventListener('focusin', this.openOverlay);
                parentElement.removeEventListener(
                    'pointerleave',
                    this.closeOverlay
                );
                parentElement.removeEventListener(
                    'focusout',
                    this.closeOverlay
                );
                parentElement.removeEventListener(
                    'sp-closed',
                    this.overlayClosed
                );
            }
        }
    }
}
