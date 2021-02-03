// Generated with util/create-component.js
import { ControlPosition, LatLng } from 'leaflet';

export type MapProps = Partial<{
    disableMenu?: boolean,
    disableFlights?: boolean,
    disableWeather?: boolean,
    weatherOpacity?: number,
    forceTileset?: string,
    currentFlight?: string,
    disableScroll?: boolean,
    refreshInterval?: number,
    hideOthers?: boolean,
    center?: LatLng,
    zoom?: number,
    zoomPosition?: ControlPosition,
}>

export type TileSet = {
    id: number,
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeIcon: string,
    planeIconHighlight: string,
    departureIcon: string,
    arrivalIcon: string,
    previewImageUrl: string,
}
