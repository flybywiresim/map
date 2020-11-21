import React, {useEffect, useState} from "react";
import {TileLayer, MapContainer, Marker, Popup} from "react-leaflet";
import L from "leaflet";

import {NXApi, Paginated, Telex, TelexConnection} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";
import flightIcon from "material-design-icons/maps/svg/production/ic_flight_48px.svg";

const TelexConnectionsEmpty: Paginated<TelexConnection> = {
    count: 0,
    results: [],
    total: 0
};

type MapProps = {
    darkMode: boolean,
}

export const Map = (props: MapProps) => {
    return (
        <div>
            <MapContainer
                id="mapid"
                center={[51.505, -0.09]}
                zoom={5}
                scrollWheelZoom={true}>
                {
                    props.darkMode ?
                        <>
                            <TileLayer
                                attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                                url='https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
                            />
                        </>
                        :
                        <>
                            <TileLayer
                                attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                                url='https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
                            />
                        </>
                }
                <Flights />
            </MapContainer>
        </div>
    );
};

const Flights = (props: any) => {

    const [flights, setFlights] = useState<Paginated<TelexConnection>>(TelexConnectionsEmpty);
    const [tempFlights, setTempFlights] = useState<Paginated<TelexConnection>>(TelexConnectionsEmpty);

    function getLocationData() {
        Telex.fetchConnections(0, 100)
            .then(result =>{
                setFlights(result);
            })
            .catch(() => {
                setFlights(TelexConnectionsEmpty);
            });

        const flightsCombiner = flights;
        const total = flights.total;
        let totalFetched = flights.count;
        let skip = 100;

        while (total > totalFetched) {
            console.log("iter");
            Telex.fetchConnections(skip, 100)
                .then(result => {
                    setTempFlights(result);
                })
                .catch(() => {
                    setTempFlights(TelexConnectionsEmpty);
                });
            totalFetched += 100;
            skip += 100;
            flightsCombiner.results.concat(tempFlights.results);
        }
        console.log(totalFetched);
        setFlights(flightsCombiner);
    }

    useEffect(() => {
        getLocationData();
    }, []);

    return (
        <div>
            {
                flights.results.map((flight: TelexConnection) =>
                    <Marker
                        position={[flight.location.y, flight.location.x]}
                        icon={ L.divIcon({
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                            className: 'planeIcon',
                            html: `<i 
                                style="font-size: 1.75rem; color: #00c2cb ;transform-origin: center; transform: rotate(${flight.heading}deg);" 
                                class="material-icons">flight</i>`
                        })}>
                        <Popup>
                            {
                                !((flight.origin === "") || (flight.destination === "")) ?
                                    "Flight " + flight.flight + " flying from " + flight.origin + " to " + flight.destination
                                    :
                                    !(flight.flight === "") ? "Flight " + flight.flight : flight.aircraftType
                            }
                        </Popup>
                    </Marker>
                )
            }
        </div>
    );
};

export default Map;
