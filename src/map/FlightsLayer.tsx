import React, {useEffect, useState} from "react";
import {FeatureGroup, Marker, Popup, useMapEvents} from "react-leaflet";
import L, {LatLngBounds} from "leaflet";

import {Telex, TelexConnection, Bounds} from "@flybywiresim/api-client";
import AirportsLayer from "./AirportsLayer";

type FlightsProps = {
    updateFlightData: Function,
    planeIcon: string,
    planeIconHighlight: string,
    departureIcon: string,
    arrivalIcon: string,
    currentFlight: string,
    searchedFlight: string,
    refreshInterval: number
}

const FlightsLayer = (props: FlightsProps) => {
    const map = useMapEvents({
        moveend: event => {
            const newBounds = event.target.getBounds();

            if (!bounds.contains(newBounds)) {
                setBounds(newBounds);
            }
        }
    });

    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [data, setData] = useState<TelexConnection[]>([]);
    const [bounds, setBounds] = useState<LatLngBounds>(map.getBounds());
    const [selectedConnection, setSelectedConnection] = useState<TelexConnection | null>(null);

    useEffect(() => {
        if (props.refreshInterval && props.refreshInterval > 0) {
            const interval = setInterval(() => getLocationData(false, map.getBounds()), props.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [props.refreshInterval]);

    useEffect(() => {
        getLocationData(false, bounds);
    }, [bounds]);

    async function getLocationData(staged: boolean = false, bounds?: LatLngBounds) {
        setIsUpdating(true);

        let apiBounds: Bounds = {
            north: 90,
            east: 180,
            south: -90,
            west: 0
        };
        if (bounds) {
            apiBounds = {
                north: Math.ceil(Math.min(bounds.getNorth(), 90)),
                east: Math.ceil(Math.min(bounds.getEast(), 180)),
                south: Math.floor(Math.max(bounds.getSouth(), -90)),
                west: Math.floor(Math.max(bounds.getWest(), -180))
            };
        }

        const flights = await Telex.fetchAllConnections(apiBounds, staged ? setData : undefined);

        setIsUpdating(false);
        setData(flights);
        props.updateFlightData(flights);
    }

    return (
        <FeatureGroup>
            {
                data.map((flight: TelexConnection) =>
                    <Marker
                        key={flight.id}
                        position={[flight.location.y, flight.location.x]}
                        icon={L.divIcon({
                            iconSize: [20, 23],
                            iconAnchor: [10, 6.5],
                            className: 'mapIcon',
                            html: `<img alt="${flight.flight}" src="${flight.flight === props.currentFlight ? props.planeIconHighlight : (props.searchedFlight === flight.flight) ? props.planeIconHighlight : props.planeIcon}"
                                        style="transform-origin: center; transform: rotate(${flight.heading}deg);"/>`
                        })}>
                        <Popup onOpen={() => setSelectedConnection(flight)} onClose={() => setSelectedConnection(null)}>
                            <h1>Flight {flight.flight}</h1>
                            {
                                (flight.origin && flight.destination) ?
                                    <h2>{flight.origin}<svg xmlns="http://www.w3.org/2000/svg"
                                        width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />
                                    </svg> {flight.destination}</h2>
                                    : ""
                            }
                            <p>Aircraft: {flight.aircraftType}</p>
                            <p>Altitude: {flight.trueAltitude}ft</p>
                        </Popup>
                    </Marker>
                )
            }
            {
                (selectedConnection !== null) ?
                    <AirportsLayer connection={selectedConnection} departureIcon={props.departureIcon} arrivalIcon={props.arrivalIcon} /> : ""
            }
        </FeatureGroup>
    );
};

export default FlightsLayer;
