import React from "react";
import {Marker, Popup, Tooltip} from "react-leaflet";
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

type TileSet = {
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    iconsUseShadow: boolean,
}

class FlightsLayer extends React.Component<FlightsProps, FlightsState> {
    constructor(props: FlightsProps) {
        super(props);
    }

    intervalID: any;

    state: FlightsState = {
        isUpdating: false,
        data: [],
        selectedAirports: [],
    };

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
        this.props.updateFlightData(flights);
        this.props.updateTotalFlights(total);
        this.intervalID = setTimeout(this.getLocationData.bind(this), 10000);
        console.log("Update finished");
    }

    async getAirports(origin: string, destination: string) {
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

        this.setState({selectedAirports: airports});
    }

    clearAirports() {
        this.setState({selectedAirports: []});
    }

    render() {
        return (
            <div>
                {
                    this.state.data.map((flight: TelexConnection) =>
                        <Marker
                            key={flight.id}
                            position={[flight.location.y, flight.location.x]}
                            icon={L.divIcon({
                                iconSize: [20, 20],
                                iconAnchor: [14, 10],
                                className: 'planeIcon',
                                html: `<i 
                                style="font-size: 1.75rem; color: ${flight.flight === this.props.currentFlight ? this.props.planeHighlightColor : (this.props.searchedFlight === flight.flight) ? this.props.planeHighlightColor : this.props.planeColor};transform-origin: center; transform: rotate(${flight.heading}deg);" 
                                class="material-icons ${this.props.iconsUseShadow ? 'map-icon-shadow' : ''}">flight</i>`
                            })}>
                            <Popup onOpen={() => this.getAirports(flight.origin, flight.destination)} onClose={() => this.clearAirports()}>
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
                    this.state.selectedAirports.map(airport =>
                        <Marker
                            position={[airport.airport.lat, airport.airport.lon]}
                            icon={L.divIcon({
                                iconSize: [20, 20],
                                iconAnchor: [14, 10],
                                className: "airportIcon",
                                html: `<i 
                                    style="font-size: 1.75rem; color: ${this.props.airportColor};" 
                                    class="material-icons ${this.props.iconsUseShadow ? 'map-icon-shadow' : ''}">${(airport.tag === "destination") ? 'flight_land' : 'flight_takeoff'}</i>`
                            })}>
                            <Tooltip direction="top" permanent>
                                <p>{airport.airport.icao} - {airport.airport.name}</p>
                            </Tooltip>
                        </Marker>
                    )
                }
            </div>
        );
    }
}

export default FlightsLayer;
