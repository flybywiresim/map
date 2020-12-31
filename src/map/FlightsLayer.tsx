import React, {useEffect, useState} from "react";
import {FeatureGroup, useMapEvents} from "react-leaflet";
import {LatLngBounds} from "leaflet";

import {Telex, TelexConnection, Bounds} from "@flybywiresim/api-client";
import AirportsLayer from "./AirportsLayer";
import FlightMarker from "./FlightMarker";

type FlightsProps = {
    onConnectionsUpdate: (connections: TelexConnection[]) => void,
    planeIcon: string,
    planeIconHighlight: string,
    departureIcon: string,
    arrivalIcon: string,
    currentFlight: string,
    searchedFlight?: TelexConnection,
    refreshInterval: number,
    hideOthers?: boolean,
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
    }, [props.refreshInterval, props.hideOthers]);

    useEffect(() => {
        getLocationData(false, bounds);
    }, [bounds, props.hideOthers]);

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

        let flights: TelexConnection[] = [];

        try {
            if (props.hideOthers) {
                const flt = await Telex.findConnection(props.currentFlight);
                flights.push(flt);
            } else {
                flights = await Telex.fetchAllConnections(apiBounds, staged ? setData : undefined);
            }
        } catch (e) {
            console.error(e);
        }

        setIsUpdating(false);
        setData(flights);
        props.onConnectionsUpdate(flights);
    }

    return (
        <FeatureGroup>
            {
                data.map((connection: TelexConnection) =>
                    <FlightMarker
                        key={connection.id}
                        connection={connection}
                        icon={props.planeIcon}
                        highlightIcon={props.planeIconHighlight}
                        isHighlighted={(props.searchedFlight && props.searchedFlight.flight === connection.flight) || props.currentFlight === connection.flight}
                        onPopupOpen={() => setSelectedConnection(connection)}
                        onPopupClose={() => setSelectedConnection(null)} />
                )
            }
            {
                (selectedConnection !== null) ?
                    <AirportsLayer
                        connection={selectedConnection}
                        departureIcon={props.departureIcon}
                        arrivalIcon={props.arrivalIcon} /> : ""
            }
        </FeatureGroup>
    );
};

export default FlightsLayer;
