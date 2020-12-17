import React, {useEffect, useState} from "react";
import {Marker, Popup, Tooltip, useMapEvents} from "react-leaflet";
import L, {LatLngBounds} from "leaflet";

import {Telex, TelexConnection, Airport, AirportResponse, Bounds} from "@flybywiresim/api-client";

type FlightsProps = {
    updateTotalFlights: Function,
    updateFlightData: Function,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    iconsUseShadow: boolean,
    currentFlight: string,
    searchedFlight: string,
}

type SelectedAirportType = {
    airport: AirportResponse,
    tag: string
}

const FlightsLayer = (props: FlightsProps) => {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [data, setData] = useState<TelexConnection[]>([]);
    const [selectedAirports, setSelectedAirports] = useState<SelectedAirportType[]>([]);
    const [refreshInterval, setRefreshInterval] = useState(15000);

    const map = useMapEvents({
        moveend: event => {
            getLocationData(false, event.target.getBounds());
        }
    });

    useEffect(() => {
        if (refreshInterval && refreshInterval > 0) {
            const interval = setInterval(() => getLocationData(false, map.getBounds()), refreshInterval);
            getLocationData(true, map.getBounds());
            return () => clearInterval(interval);
        }
    }, [refreshInterval]);

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
                north: Math.min(bounds.getNorth(), 90),
                east: Math.min(bounds.getEast(), 180),
                south: Math.max(bounds.getSouth(), -90),
                west: Math.max(bounds.getWest(), -180)
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

        try {
            props.updateTotalFlights(await Telex.countConnections());
        } catch (e) {
            console.error(e);
        }

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

    return (
        <div>
            {
                data.map((flight: TelexConnection) =>
                    <Marker
                        key={flight.id}
                        position={[flight.location.y, flight.location.x]}
                        icon={L.divIcon({
                            iconSize: [20, 20],
                            iconAnchor: [14, 10],
                            className: 'planeIcon',
                            html: `<i 
                                style="font-size: 1.75rem;
                                       color: ${flight.flight === props.currentFlight ? props.planeHighlightColor : (props.searchedFlight === flight.flight) ? props.planeHighlightColor : props.planeColor};
                                       transform-origin: center;
                                       transform: rotate(${flight.heading}deg);" 
                                class="material-icons ${props.iconsUseShadow ? 'map-icon-shadow' : ''}">flight</i>`
                        })}>
                        <Popup onOpen={() => getAirports(flight.origin, flight.destination)} onClose={() => clearAirports()}>
                            <h1>Flight {flight.flight}</h1>
                            {
                                (flight.origin && flight.destination) ?
                                    <h2>{flight.origin} <i style={{transform: 'rotate(90deg)', fontSize: '1.1rem'}} className="material-icons">flight</i> {flight.destination}</h2>
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
                            iconSize: [20, 20],
                            iconAnchor: [14, 10],
                            className: "airportIcon",
                            html: `<i 
                                    style="font-size: 1.75rem; color: ${props.airportColor};" 
                                    class="material-icons ${props.iconsUseShadow ? 'map-icon-shadow' : ''}">${(airport.tag === "destination") ? 'flight_land' : 'flight_takeoff'}</i>`
                        })}>
                        <Tooltip direction="top" permanent>
                            <p>{airport.airport.icao} - {airport.airport.name}</p>
                        </Tooltip>
                    </Marker>
                )
            }
        </div>
    );
};

export default FlightsLayer;
