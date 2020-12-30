import React, {useEffect, useState} from "react";
import {FeatureGroup, useMapEvents} from "react-leaflet";
import {LatLngBounds} from "leaflet";

import {Telex, TelexConnection, Bounds} from "@flybywiresim/api-client";
import AirportsLayer from "./AirportsLayer";
import FlightMarker from "./FlightMarker";

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
                    <FlightMarker
                        key={flight.id}
                        flight={flight}
                        icon={props.planeIcon}
                        highlightIcon={props.planeIconHighlight}
                        isHighlighted={props.searchedFlight === flight.flight || props.currentFlight === flight.flight}
                        onPopupOpen={() => setSelectedConnection(flight)}
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
