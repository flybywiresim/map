import React, {useEffect, useState} from "react";
import {TileLayer, MapContainer, Marker, Popup} from "react-leaflet";
import L from "leaflet";

import {NXApi, Paginated, Telex, TelexConnection} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";
import flight from "material-design-icons/maps/svg/production/ic_flight_48px.svg";

const TelexConnectionsEmpty: Paginated<TelexConnection> = {
    count: 0,
    results: [],
    total: 0
};

const planeIcon = new L.Icon({
    iconUrl: flight
});

type MapProps = {}

export const Map = (props: MapProps) => {
    const [flights, setFlights] = useState<Paginated<TelexConnection>>(TelexConnectionsEmpty);

    function getLocationData() {
        NXApi.url = new URL('https://fbw.stonelabs.io');

        return Telex.fetchConnections(0, 100)
            .then(result =>{
                setFlights(result);
            })
            .catch(() => {
                setFlights(TelexConnectionsEmpty);
            });
    }

    useEffect(() => {
        getLocationData().then(() => {});
    }, []);

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
                <div>
                    {
                        flights.results.map((flight: TelexConnection) =>
                            <Marker
                                position={[flight.location.y, flight.location.x]}
                                icon={planeIcon}
                            />
                        )
                    }

                </div>

            </MapContainer>
        </div>
    );
};

export default Map;
