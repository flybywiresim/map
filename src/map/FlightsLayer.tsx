import React, {useEffect, useState} from "react";
import {FeatureGroup, Marker, Popup, Tooltip, useMapEvents} from "react-leaflet";
import L, {LatLngBounds} from "leaflet";

import {Telex, TelexConnection, Airport, AirportResponse, Bounds} from "@flybywiresim/api-client";

type FlightsProps = {
    updateFlightData: Function,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    currentFlight: string,
    searchedFlight: string,
    refreshInterval: number
}

type SelectedAirportType = {
    airport: AirportResponse,
    tag: string
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
    const [selectedAirports, setSelectedAirports] = useState<SelectedAirportType[]>([]);
    const [bounds, setBounds] = useState<LatLngBounds>(map.getBounds());

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
        console.log("Starting update");

        setIsUpdating(true);

        let flights: TelexConnection[] = [];
        let skip = 0;
        let total = 0;

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

        do {
            try {
                const data = await Telex.fetchConnections(skip, 100, apiBounds);

                total = data.total;
                skip += data.count;
                flights = flights.concat(data.results);

                if (staged) {
                    setData(flights);
                }
            } catch (err) {
                console.error(err);
                break;
            }
        }
        while (total > skip);

        setIsUpdating(false);
        setData(flights);
        props.updateFlightData(flights);

        console.log("Update finished");
    }

    async function getAirports(origin: string, destination: string) {
        const airports: SelectedAirportType[] = [];

        // Two individual try/catch: If one fails the other should still show
        if (origin) {
            try {
                const originArpt = await Airport.get(origin);
                airports.push({airport: originArpt, tag: 'origin'});
            } catch (e) {
                console.error(e);
            }
        }

        if (destination) {
            try {
                const destinationArpt = await Airport.get(destination);
                airports.push({airport: destinationArpt, tag: 'destination'});
            } catch (e) {
                console.error(e);
            }
        }

        setSelectedAirports(airports);
    }

    function clearAirports() {
        setSelectedAirports([]);
    }

    function dropShadow() {
        return (
            `<filter id="dropshadow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.8"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="1"/>
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>`
        );
    }

    return (
        <FeatureGroup>
            {
                data.map((flight: TelexConnection) =>
                    <Marker
                        key={flight.id}
                        position={[flight.location.y, flight.location.x]}
                        icon={L.divIcon({
                            iconSize: [26, 26],
                            iconAnchor: [13, 13],
                            className: 'planeIcon',
                            html: `<svg xmlns="http://www.w3.org/2000/svg"
                                        style="transform-origin: center; transform: rotate(${flight.heading - 90}deg);"
                                        width="26" height="26" viewBox="0 0 24 24"
                                        fill="${flight.flight === props.currentFlight ? props.planeHighlightColor : (props.searchedFlight === flight.flight) ? props.planeHighlightColor : props.planeColor}"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        ${dropShadow()}
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                      <path filter="url(#dropshadow)" d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />
                                    </svg>`
                        })}>
                        <Popup onOpen={() => getAirports(flight.origin, flight.destination)} onClose={() => clearAirports()}>
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
                selectedAirports.map(airport =>
                    <Marker
                        key={airport.airport.icao + '-' + airport.tag}
                        position={[airport.airport.lat, airport.airport.lon]}
                        icon={L.divIcon({
                            iconSize: [26, 26],
                            iconAnchor: [13, 13],
                            className: "airportIcon",
                            html: `<svg xmlns="http://www.w3.org/2000/svg"
                                        stroke="${props.airportColor}"
                                        fill="${props.airportColor}"
                                        width="26" height="26" viewBox="0 0 24 24"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        ${dropShadow()}
                                      ${(airport.tag === "destination") ?
            `<path d="M15 12h5a2 2 0 0 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3z" filter="url(#dropshadow)" transform="rotate(15 12 12) translate(0 -1)" />` :
            `<path d="M15 12h5a2 2 0 0 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3z" filter="url(#dropshadow)" transform="rotate(-15 12 12) translate(0 -1)" />`}
                                       <line x1="3" y1="21" x2="21" y2="21" stroke-width="3" />
                                    </svg>`
                        })}>
                        <Tooltip direction="top" permanent>
                            <p>{airport.airport.icao} - {airport.airport.name}</p>
                        </Tooltip>
                    </Marker>
                )
            }
        </FeatureGroup>
    );
};

export default FlightsLayer;
