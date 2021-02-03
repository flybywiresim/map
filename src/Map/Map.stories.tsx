// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React from 'react';
import Map from './Map';

export default {
    title: 'Map',
    parameters: {
        layout: 'fullscreen'
    }
};

export const Default = (): React.FC => <div style={{ width: '100vw', height: '100vh' }}><Map /></div>;
export const ForceCartoLight = (): React.FC => <div style={{ width: '100vw', height: '100vh' }}><Map forceTileset={'carto-light'} /></div>;
export const NoMenu = (): React.FC => <div style={{ width: '100vw', height: '100vh' }}><Map disableMenu={true} /></div>;
