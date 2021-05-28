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

import { fixture, html, waitUntil } from '@open-wc/testing';
import { visualDiff } from '@web/test-runner-visual-regression';
import '@spectrum-web-components/story-decorator/sp-story-decorator.js';
import { Color, Scale } from '@spectrum-web-components/theme';
import { StoryDecorator } from '@spectrum-web-components/story-decorator/src/StoryDecorator';
import { TemplateResult } from '@spectrum-web-components/base';

const wrap = (story: TemplateResult) => html`
    <sp-story-decorator reduce-motion screenshot>${story}</sp-story-decorator>
`;

type StoriesType = {
    default: {
        title: string;
        swc_vrt?: {
            preload?: () => void;
        };
    };
    [name: string]: (() => TemplateResult) | any;
};

export const test = (
    tests: StoriesType,
    name: string,
    color: Color,
    scale: Scale,
    dir: 'ltr' | 'rtl'
) => {
    Object.keys(tests).map((story) => {
        if (story !== 'default') {
            it(story, async () => {
                const testsDefault = (tests as any).default;
                const args = {
                    ...(testsDefault.args || {}),
                    ...(tests[story].args || {}),
                };
                let decoratedStory:
                    | (() => TemplateResult)
                    | TemplateResult = () =>
                    html`
                        ${tests[story](args)}
                    `;
                let storyResult = decoratedStory();
                if (testsDefault.decorators && testsDefault.decorators.length) {
                    let decoratorCount = testsDefault.decorators.length;
                    while (decoratorCount) {
                        decoratorCount -= 1;
                        decoratedStory = testsDefault.decorators[
                            decoratorCount
                        ](decoratedStory);
                    }
                    storyResult = decoratedStory as TemplateResult;
                }
                const test = await fixture<StoryDecorator>(wrap(storyResult));
                console.log(
                    'attempting',
                    `${color} - ${scale} - ${dir} - ${name} - ${story}`
                );
                await waitUntil(
                    () => test.ready,
                    'Wait for decorator to become ready...',
                    { timeout: 15000 }
                );
                await visualDiff(
                    test,
                    `${color} - ${scale} - ${dir} - ${name} - ${story}`
                );
            });
        }
    });
};

export const regressVisuals = async (name: string, stories: StoriesType) => {
    console.log('regress');
    describe(`${name} Visual Regressions`, () => {
        const {
            defaultColor: color,
            defaultScale: scale,
            defaultDirection: dir,
        } = window.__swc_hack_knobs__;
        before(async () => {
            if (stories.default?.swc_vrt?.preload) {
                console.log('Files are being preloaded...');
                await stories.default.swc_vrt.preload();
            }
        });
        afterEach(() => {
            const overlays = [
                ...(document.querySelectorAll('active-overlay') || []),
            ];
            overlays.map((overlay) => overlay.remove());
        });
        if (color && scale && dir) {
            test(stories, name, color, scale, dir);
        } else {
            const colors: Color[] = ['lightest', 'light', 'dark', 'darkest'];
            const scales: Scale[] = ['medium', 'large'];
            const directions: ('ltr' | 'rtl')[] = ['ltr', 'rtl'];
            colors.forEach((color: Color) => {
                scales.forEach((scale: Scale) => {
                    directions.forEach((dir) => {
                        test(stories, name, color, scale, dir);
                    });
                });
            });
        }
    });
};
