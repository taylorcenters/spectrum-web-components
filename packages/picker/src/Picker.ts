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
    property,
    PropertyValues,
    query,
    nothing,
    ifDefined,
    SizedMixin,
    ElementSize,
} from '@spectrum-web-components/base';

import pickerStyles from './picker.css.js';
import chevronStyles from '@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js';

import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';
import { reparentChildren } from '@spectrum-web-components/shared/src/reparent-children.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js';
import '@spectrum-web-components/menu/sp-menu.js';
import {
    Menu,
    MenuItem,
    MenuItemQueryRoleEventDetail,
} from '@spectrum-web-components/menu';
import '@spectrum-web-components/popover/sp-popover.js';
import { Popover } from '@spectrum-web-components/popover';
import {
    Placement,
    openOverlay,
    TriggerInteractions,
    OverlayOptions,
} from '@spectrum-web-components/overlay';

const chevronClass = {
    s: 'spectrum-UIIcon-ChevronDown75',
    m: 'spectrum-UIIcon-ChevronDown100',
    l: 'spectrum-UIIcon-ChevronDown200',
    xl: 'spectrum-UIIcon-ChevronDown300',
};

type PickerSize = Exclude<ElementSize, 'xxl'>;

let pickerId = 0

/**
 * @element sp-picker
 * @slot label - The placeholder content for the picker
 *
 * @fires change - Announces that the `value` of the element has changed
 * @fires sp-opened - Announces that the overlay has been opened
 * @fires sp-closed - Announces that the overlay has been closed
 */
export class PickerBase extends SizedMixin(Focusable) {
    /**
     * @private
     */
    public static openOverlay = async (
        target: HTMLElement,
        interaction: TriggerInteractions,
        content: HTMLElement,
        options: OverlayOptions
    ): Promise<() => void> => {
        return await openOverlay(target, interaction, content, options);
    };

    @query('#button')
    public button!: HTMLButtonElement;

    public get target(): HTMLButtonElement | this {
        return this.button;
    }

    @property({ type: Boolean, reflect: true })
    public disabled = false;

    @property({ type: Boolean, reflect: true })
    public focused = false;

    @property({ type: Boolean, reflect: true })
    public invalid = false;

    @property()
    public label?: string;

    @property({ type: Boolean, reflect: true })
    public open = false;

    @property({ type: Boolean, reflect: true })
    public readonly = false;

    public menuItems: MenuItem[] = [];
    private restoreChildren?: () => void;

    public optionsMenu!: Menu;

    /**
     * @type {"auto" | "auto-start" | "auto-end" | "top" | "bottom" | "right" | "left" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "right-start" | "right-end" | "left-start" | "left-end" | "none"}
     * @attr
     */

    @property()
    public placement: Placement = 'bottom-start';

    @property({ type: Boolean, reflect: true })
    public quiet = false;

    @property({ type: String })
    public get value(): string {
        return this.optionsMenu?.value || ''
    }

    private initialValue! : string;

    public set value(value: string) {
        if (this.optionsMenu != null) {
            this.optionsMenu.value = value;
        } else {
            console.error("help with the order")
            this.initialValue = value
        }
    }

    private closeOverlay?: () => void;

    @query('sp-popover')
    private popover!: Popover;

    protected listRole: 'listbox' | 'menu' = 'listbox';

    protected pickerId = ++pickerId;

    public constructor() {
        super();
        this.addEventListener(
            'sp-menu-item-query-role',
            (event: CustomEvent<MenuItemQueryRoleEventDetail>) => {
                event.stopPropagation();
                event.detail.role = this.listRole === 'listbox' ? 'option' : 'menuitem' // FIXME: resolve from menu if possible (but timing...)
            }
        );
        this.onKeydown = this.onKeydown.bind(this);
    }

    public get focusElement(): HTMLElement {
        if (this.open) {
            return this.optionsMenu;
        }
        return this.button;
    }

    public forceFocusVisible(): void {
        this.focused = true;
    }

    public onButtonBlur(): void {
        this.focused = false;
        (this.target as HTMLButtonElement).removeEventListener(
            'keydown',
            this.onKeydown
        );
    }

    protected onButtonClick(): void {
        console.log("toggling for button click")
        this.toggle();
    }

    public onButtonFocus(): void {
        (this.target as HTMLButtonElement).addEventListener(
            'keydown',
            this.onKeydown
        );
    }

    public onClick(event: Event): void {
        const target = event.target as MenuItem;
        /* c8 ignore 6 */
        if (!target || target.disabled) {
            if (target) {
                this.focus();
            }
            return;
        }
    }

    protected onKeydown = (event: KeyboardEvent): void => {
        if (event.code !== 'ArrowDown' && event.code !== 'ArrowUp') {
            return;
        }
        event.preventDefault();
        console.log("toggling for onKeyDown")
        this.toggle(true);
    };

    public toggle(target?: boolean): void {
        if (this.readonly) {
            return;
        }
        this.open = typeof target !== 'undefined' ? target : !this.open;
        console.log(`toggling updated to ${this.open}`)
    }

    public close(): void {
        if (this.readonly) {
            console.log("Can't close readonly!")
            return;
        }
        this.open = false;
    }

    protected onOverlayClosed(): void {
        this.close();
        if (this.restoreChildren) {
            this.restoreChildren();
            this.restoreChildren = undefined;
        }

        this.menuStateResolver();
    }

    private async openMenu(): Promise<void> {
        /* c8 ignore next 9 */
        let reparentableChildren: Element[] = [];

        const deprecatedMenu = this.querySelector('sp-menu');
        if (deprecatedMenu) {
            reparentableChildren = Array.from(deprecatedMenu.children);
        } else {
            reparentableChildren = Array.from(this.children).filter(
                (element) => {
                    return !element.hasAttribute('slot');
                }
            );
        }

        if (reparentableChildren.length === 0) {
            this.menuStateResolver();
            return;
        }

        this.restoreChildren = reparentChildren<
            Element & { focused?: boolean }
        >(reparentableChildren, this.optionsMenu, () => {
            return (el) => {
                if (typeof el.focused !== 'undefined') {
                    el.focused = false;
                }
            };
        });
        await this.optionsMenu.updateComplete // TODO: needed?

        this.sizePopover(this.popover);
        const { popover } = this;
        console.log(`Opening overlay for picker ${this.pickerId}`)
        this.closeOverlay = await Picker.openOverlay(this, 'inline', popover, {
            placement: this.placement,
            receivesFocus: 'auto',
        });
        console.error(`Overlay opened for picker ${this.pickerId}`, this.closeOverlay)
        console.error(`Overlay opened & optionsMenu updated ${this.pickerId}`, this.closeOverlay)
        this.menuStateResolver();
    }

    protected sizePopover(popover: HTMLElement): void {
        // only use `this.offsetWidth` when Standard variant
        const menuWidth = !this.quiet && `${this.offsetWidth}px`;
        if (menuWidth) {
            popover.style.setProperty('width', menuWidth);
        }
    }

    private closeMenu(): void {
        console.log(`closeMenu called for picker ${this.pickerId}`)
        if (this.closeOverlay) {
            console.log(`Really closing overlay for picker ${this.pickerId}`)
            this.closeOverlay();
            delete this.closeOverlay;
        }
    }

    protected get buttonText(): void | string {
        return
    }

    protected get buttonContent(): TemplateResult[] {
        return [
            html`
                <span
                    id="label"
                    class=${ifDefined(this.value ? undefined : 'placeholder')}
                >
                    ${this.buttonText
                        ? this.buttonText
                        : html`
                              <slot name="label">${this.label}</slot>
                          `}
                </span>
                ${this.invalid
                    ? html`
                          <sp-icon-alert class="validationIcon"></sp-icon-alert>
                      `
                    : nothing}
                <sp-icon-chevron100
                    class="icon picker ${chevronClass[this.size as PickerSize]}"
                ></sp-icon-chevron100>
            `,
        ];
    }

    protected get renderButton(): TemplateResult {
        return html`
            <button
                aria-haspopup="true"
                aria-expanded=${this.open ? 'true' : 'false'}
                aria-labelledby="button label"
                id="button"
                class="button"
                @blur=${this.onButtonBlur}
                @click=${this.onButtonClick}
                @focus=${this.onButtonFocus}
                ?disabled=${this.disabled}
            >
                ${this.buttonContent}
            </button>
        `;
    }

    protected render(): TemplateResult {
        return html`
            ${this.renderButton} ${this.renderPopover}
        `;
    }

    protected get renderPopover(): TemplateResult {
        return html`
            <sp-popover
                id="popover"
                @click=${this.onClick}
                @sp-overlay-closed=${this.onOverlayClosed}
            >
                <sp-menu
                    id="menu"
                    selects="single"
                    role="${this.listRole}"
                ></sp-menu>
            </sp-popover>
        `;
    }

    protected updateMenuItems(): void {
        this.menuItems = [
            ...this.querySelectorAll('sp-menu-item'),
        ] as MenuItem[];
    }

    protected async onMenuChange() {
        console.log("onMenuChange")
        await this.updateComplete;
        if (this.open) {
            console.log('onMenuChange setting open to the false')
            this.open = false;
        }
    }

    protected firstUpdated(changedProperties: PropertyValues): void {
        super.firstUpdated(changedProperties);

        // Since the sp-menu gets reparented by the popover, initialize it here
        this.optionsMenu = this.shadowRoot.querySelector('sp-menu') as Menu;

        console.log("registering change")
        this.optionsMenu.addEventListener('change', () => this.onMenuChange())

        if (this.initialValue != null) {
            this.optionsMenu.value = this.initialValue;
        }

        this.updateMenuItems();

        const deprecatedMenu = this.querySelector('sp-menu');
        if (deprecatedMenu) {
            console.warn(
                `Deprecation Notice: You no longer need to provide an sp-menu child to ${this.tagName.toLowerCase()}. Any styling or attributes on the sp-menu will be ignored.`
            );
        }
    }

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (
            changedProperties.has('value') &&
            !changedProperties.has('selectedItem')
        ) {
            // FIXME: pass on to menu
            // this.manageSelection();
        }
        if (changedProperties.has('disabled') && this.disabled) {
            this.open = false;
        }
        console.log(`updated this.open = ${this.open} changedProperties.get('open'): ${changedProperties.get('open')}`)
        if (
            changedProperties.has('open') &&
            (this.open || typeof changedProperties.get('open') !== 'undefined')
        ) {
            this.menuStatePromise = new Promise(
                (res) => (this.menuStateResolver = res)
            );
            if (this.open) {
                console.log('update open')
                this.openMenu();
            } else {
                console.log('update close')
                this.closeMenu();
            }
        }
    }

    private menuStatePromise = Promise.resolve();
    private menuStateResolver!: () => void;

    protected async _getUpdateComplete(): Promise<void> {
        await super._getUpdateComplete();
        await this.menuStatePromise;
    }

    public connectedCallback(): void {
        if (!this.open) {
            this.updateMenuItems();
        }
        super.connectedCallback();
    }

    public disconnectedCallback(): void {
        console.log('disconnecting')
        this.open = false;

        super.disconnectedCallback();
    }
}

export class Picker extends PickerBase {
    public static get styles(): CSSResultArray {
        return [pickerStyles, chevronStyles];
    }

    protected get buttonText(): void | string {
        return this.value && this._buttonText
            ? this._buttonText
            : undefined
    }

    @property({ attribute: false })
    public get selectedItem(): undefined | MenuItem {
        const selectedItems = this.optionsMenu?.selectedItems
        if (selectedItems != null && selectedItems.length > 0) {
            return selectedItems[0];
        } else {
            return
        }
    }

    @property({ attribute: false })
    private _buttonText?: string;

    protected async onMenuChange() {
        console.log("is it just weird?");
        super.onMenuChange();
        requestAnimationFrame( () => this._buttonText = this.selectedItem?.itemText);
    }

    protected onKeydown = (event: KeyboardEvent): void => {
        const { code } = event;
        if (!code.startsWith('Arrow') || this.readonly) {
            return;
        }
        event.preventDefault();
        if (code === 'ArrowUp' || code === 'ArrowDown') {
            console.log("toggling for keyboard")
            this.toggle(true);
            return;
        }
    };
}
