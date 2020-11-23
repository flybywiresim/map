import React from "react";
import {TileLayer, MapContainer, Marker, Popup} from "react-leaflet";
import L from "leaflet";

import {Telex, TelexConnection} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";

type MapProps = {
    darkMode: boolean,
}

type FlightsState = {
    isUpdating: boolean,
    data: TelexConnection[]
}

export class Map extends React.Component<MapProps, any> {
    constructor(props: MapProps) {
        super(props);
    }

    render() {
        return (
            <div>
                <MapContainer
                    id="mapid"
                    center={[51.505, -0.09]}
                    zoom={5}
                    scrollWheelZoom={true}>
                    {
                        this.props.darkMode ?
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
    }
}

class Flights extends React.Component<any, FlightsState> {
    intervalID: any;

    constructor(props: any) {
        super(props);
        this.state = {
            isUpdating: false,
            data: []
        };
    }

    componentDidMount() {
        this.getLocationData(true);
    }

    componentWillUnmount() {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
    }

    async getLocationData(staged: boolean = false) {
        console.log("Starting update");

        this.setState({
            isUpdating: true
        });

        let flights: TelexConnection[] = [];
        let skip = 0;
        let total = 0;

        do {
            try {
                const data = await Telex.fetchConnections(skip, 100);

                total = data.total;
                skip += data.count;
                flights = flights.concat(data.results);

                if (staged) {
                    this.setState({
                        data: flights
                    });
                }
            } catch (err) {
                console.error(err);
                break;
            }
        }
        while (total > skip);

        this.setState({
            isUpdating: false,
            data: flights
        });
        this.intervalID = setTimeout(this.getLocationData.bind(this), 10000);
        console.log("Update finished");
    }

    render() {
        return (
            <div>
                {
                    this.state.data.map((flight: TelexConnection) =>
                        <Marker
                            key={flight.id}
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
    }
}
