import React, { useState } from 'react';
import { FeatureGroup, useMapEvents } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';

import { Telex, TelexConnection, Bounds } from '@flybywiresim/api-client';
import AirportsLayer from './AirportsLayer';
import FlightMarker from './FlightMarker';
import useInterval from '../hooks/useInterval';

export type FlightsLayerProps = {
    // eslint-disable-next-line no-unused-vars
    onConnectionsUpdate?: (connections: TelexConnection[]) => void,
    planeIcon: string,
    planeIconHighlight: string,
    departureIcon: string,
    arrivalIcon: string,
    currentFlight: string,
    searchedFlight?: TelexConnection,
    refreshInterval: number,
    hideOthers?: boolean,
}

const FlightsLayer = (props: FlightsLayerProps): JSX.Element => {
    const map = useMapEvents({
        moveend: event => {
            const newBounds = event.target.getBounds();

            if (!bounds.contains(newBounds)) {
                setBounds(newBounds);
            }
        }
    });

    // eslint-disable-next-line no-unused-vars
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [data, setData] = useState<TelexConnection[]>([]);
    const [bounds, setBounds] = useState<LatLngBounds>(map.getBounds());
    const [selectedConnection, setSelectedConnection] = useState<TelexConnection | null>(null);

    useInterval(async () => {
        await getLocationData(false, map.getBounds());
    }, props.refreshInterval || 10000,
    { runOnStart: true, additionalDeps: [props.hideOthers, bounds] });

    async function getLocationData(staged = false, bounds?: LatLngBounds) {
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
                const result = await Telex.findConnections(props.currentFlight);

                if (!result.fullMatch) {
                    console.error('Current FLT NBR did not return a full match');
                    return;
                }

                flights.push(result.fullMatch);
                map.flyTo({ lat: result.fullMatch.location.y, lng: result.fullMatch.location.x });
            } else {
                flights = await Telex.fetchAllConnections(apiBounds, staged ? setData : undefined);
            }
        } catch (e) {
            console.error(e);
        }

        setIsUpdating(false);
        setData(flights);
        if (props.onConnectionsUpdate) {
            props.onConnectionsUpdate(flights);
        }
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
                        arrivalIcon={props.arrivalIcon} /> : ''
            }
        </FeatureGroup>
    );
};

export default FlightsLayer;
