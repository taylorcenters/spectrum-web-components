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
import { html } from 'lit-html';

import '../sp-range-slider.js';
import { RangeSlider } from '../';
import { TemplateResult } from '@spectrum-web-components/base';

const action = (msg1: string) => (msg2: string | number): void =>
    console.log(msg1, msg2);

export default {
    component: 'sp-range-slider',
    title: 'Range Slider',
};

export const Default = (): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as RangeSlider;
        action(event.type)(`${target.valueStart} - ${target.valueEnd}`);
    };
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-range-slider
                max="1"
                min="0"
                value-start=".2"
                value-end=".8"
                step="0.01"
                @input=${handleEvent}
                @change=${handleEvent}
                .getAriaValueText=${(value: number) =>
                    new Intl.NumberFormat('en-US', { style: 'percent' }).format(
                        value
                    )}
            >
                Output Levels
            </sp-range-slider>
        </div>
    `;
};
