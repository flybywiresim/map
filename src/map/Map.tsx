import React from "react";
import {TileLayer, MapContainer} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./Map.scss";

type MapProps = {}

type MapState = {}

export default class Map extends React.Component<MapProps, MapState> {
    render() {
        return (
            <div>
                <MapContainer
                    id="mapid"
                    center={[51.505, -0.09]}
                    zoom={13}
                    scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            </div>
        );
    }
}
