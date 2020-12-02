import React, {useEffect, useState} from "react";
import {Marker, Popup, Tooltip, useMap} from "react-leaflet";
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
    updateCenter: Function,
    zoom: number;
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

    const parentMap = useMap();
    const currentZoom = parentMap.getZoom();

    const [telexData, setTelexData] = useState<TelexConnection[]>([]);
    const [selectedAirports, setSelectedAirports] = useState<SelectedAirportType[]>([]);
    const [popupSelectedFlight, setPopupSelectedFlight] = useState("");

    useEffect(() => {
        getLocationData(true);
    }, []);

    const getLocationData = async (didCancel = false, skip = 0, numberFlights = 100): Promise<TelexConnection[]> => {

        let total = 0;

        if (!didCancel) {
            const data = await Telex.fetchConnections(skip, numberFlights);
            total = data.total;
            skip += data.count;
            const flights = data.results;
            if (total > skip) {
                return flights.concat(await getLocationData(false, skip, numberFlights));
            } else {
                props.updateTotalFlights(total);
                return flights;
            }

        }

        return [];
    };

    function updateCenter(lat: number, lng: number, zoom: number) {
        props.updateCenter([lat, lng], zoom);
        const newZoom = currentZoom > props.zoom ? currentZoom : props.zoom;
        //parentMap.setView([lat, lng], newZoom);
        parentMap.flyTo([lat, lng], newZoom, {
            animate: true,
            duration: 1.0
        });
    }

    useEffect(() => {
        let didCancel = false;
        getLocationData(didCancel)
            .then(flights => {
                setTelexData(flights);
                props.updateFlightData(flights);
            });
        const interval = setInterval(() => {
            getLocationData(didCancel)
                .then(flights => {
                    setTelexData(flights);
                    props.updateFlightData(flights);
                });
        }, 10000);
        return () => {
            didCancel = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        telexData.map((flight: TelexConnection) => {
            if (props.searchedFlight === flight.flight) {
                updateCenter(flight.location.y, flight.location.x, 5);
            } else if (props.currentFlight === flight.flight) {
                updateCenter(flight.location.y, flight.location.x, 5);
            } else if (popupSelectedFlight === flight.flight) {
                updateCenter(flight.location.y, flight.location.x, 5);
            }
        });
    }, [telexData]);

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
                        })}
                        eventHandlers={{
                            popupopen: (e) => {
                                updateCenter(flight.location.y, flight.location.x, 8);
                                setPopupSelectedFlight(flight.flight);
                                getAirports(flight.origin, flight.destination);
                            },
                            popupclose: (e) => {
                                clearAirports();
                                setPopupSelectedFlight("");
                            }
                        }}>
                        <Popup>
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
                        key={airport.airport.icao}
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
