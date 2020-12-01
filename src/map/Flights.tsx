import React, {useEffect, useState} from "react";
import {TileLayer, MapContainer, Marker, Popup, Tooltip, useMap} from "react-leaflet";
import L from "leaflet";
import {Telex, TelexConnection, Airport, AirportResponse} from "@flybywiresim/api-client";

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
type FlightsState = {
    isUpdating: boolean,
    data: TelexConnection[],
    selectedAirports: SelectedAirportType[],
}

type SelectedAirportType = {
    airport: AirportResponse,
    tag: string
}

const FlightsLayer = (props: FlightsProps) => {

    const [telexData, setTelexData] = useState<TelexConnection[]>([]);
    const [data, setData] = useState([]);
    const [selectedAirports, setSelectedAirports] = useState<SelectedAirportType[]>([]);

    useEffect(() => {
        getLocationData(true);
    }, []);

    function getLocationData(didCancel = false) {
        console.log("Starting update");

        let flights: TelexConnection[] = [];
        let skip = 0;
        let total = 0;
        if (!didCancel) {
            do {
                Telex.fetchConnections(skip, 100)
                    .then(data => {
                        total = data.total;
                        skip += data.count;
                        flights = flights.concat(data.results);
                        setTelexData(flights);
                        console.log("Collected " + total);
                        props.updateTotalFlights(total);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
            while (total > skip);
        }
    }

    useEffect(() => {
        let didCancel = false;
        getLocationData(didCancel);
        const interval = setInterval(() => {
            getLocationData(didCancel);
        }, 10000);
        return () => {
            didCancel = true;
            clearInterval(interval);
        };
    }, []);

    function getAirports(origin: string, destination: string) {

        const airports: SelectedAirportType[] = [];

        // Two individual try/catch: If one fails the other should still show
        if (origin) {
            const originArpt = Airport.get(origin)
                .then(data => {
                    airports.push({airport: data, tag: origin});
                })
                .catch((e) => {
                    console.error(e);
                });
        }

        if (destination) {

            const destArpt = Airport.get(destination)
                .then(data => {
                    airports.push({airport: data, tag: destination});
                })
                .catch((e) => {
                    console.error(e);
                });
        }

        setSelectedAirports(airports);
    };

    function clearAirports() {
        setSelectedAirports([]);
    }

    return (
        <div>
            {
                telexData.map((flight: TelexConnection) =>
                    <Marker
                        key={flight.id}
                        position={[flight.location.y, flight.location.x]}
                        icon={L.divIcon({
                            iconSize: [20, 20],
                            iconAnchor: [14, 10],
                            className: 'planeIcon',
                            html: `<i 
                            style="font-size: 1.75rem; color: ${flight.flight === props.currentFlight ? props.planeHighlightColor : (props.searchedFlight === flight.flight) ? props.planeHighlightColor : props.planeColor};transform-origin: center; transform: rotate(${flight.heading}deg);" 
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
                selectedAirports.map((airport: SelectedAirportType) =>
                    <Marker
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
