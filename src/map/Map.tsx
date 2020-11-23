import React from "react";
import {TileLayer, MapContainer, Marker, Popup, Tooltip} from "react-leaflet";
import L from "leaflet";

import {Telex, TelexConnection} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";

type MapProps = {
    tiles: string,
}
type MapState = {
    totalFlights: number,
    tiles: Tiles[],
    selectedTile: string,
}

type FlightsProps = {
    updateTotalFlights: Function,
    planeColor: string,
}
type FlightsState = {
    isUpdating: boolean,
    data: TelexConnection[],
}

type InfoWidgetProps = {
    totalFlights: number,
    tiles: Tiles[],
    changeTiles: Function,
}

type Tiles = {
    value: string,
    name: string,
}

export class Map extends React.Component<MapProps, MapState> {
    constructor(props: MapProps) {
        super(props);
        this.updateTotalFlights = this.updateTotalFlights.bind(this);
        this.selectTile = this.selectTile.bind(this);
    }

    state: MapState = {
        totalFlights: 0,
        selectedTile: "carto-dark",
        tiles: [
            {value: "carto-dark", name: "Carto Dark"},
            {value: "carto-light", name: "Carto Light"},
            {value: "osm", name: "Open Street Map"},
        ]
    }

    updateTotalFlights(flights: number) {
        this.setState({ totalFlights: flights });
    }

    selectTile(tile: string | null) {
        if (typeof tile === null) {
            this.setState({selectedTile: "carto-light"});
        }

        if (tile === "carto-dark") {
            this.setState({selectedTile: "carto-dark"});
        } else if (tile === "carto-light") {
            this.setState({selectedTile: "carto-light"});
        } else if (tile === "osm") {
            this.setState({selectedTile: "osm"});
        }
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
                        this.state.selectedTile === "carto-dark" ?
                            <>
                                <TileLayer
                                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                                    url='https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
                                />
                                <Flights planeColor="#00c2cb" updateTotalFlights={this.updateTotalFlights} />
                            </>
                            :
                            this.state.selectedTile === "osm" ?
                                <>
                                    <TileLayer
                                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Flights planeColor="#000000" updateTotalFlights={this.updateTotalFlights} />
                                </>
                                :
                                <>
                                    <TileLayer
                                        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                                        url='https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
                                    />
                                    <Flights planeColor="#000000" updateTotalFlights={this.updateTotalFlights} />
                                </>
                    }
                    <InfoWidget totalFlights={this.state.totalFlights} tiles={this.state.tiles} changeTiles={this.selectTile} />
                </MapContainer>
            </div>
        );
    }
}

class Flights extends React.Component<FlightsProps, FlightsState> {
    constructor(props: FlightsProps) {
        super(props);
    }

    intervalID: any;

    state: FlightsState = {
        isUpdating: false,
        data: [],
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
        this.props.updateTotalFlights(total);
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
                                style="font-size: 1.75rem; color: ${this.props.planeColor};transform-origin: center; transform: rotate(${flight.heading}deg);" 
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

class InfoWidget extends React.Component<InfoWidgetProps, any> {
    render() {
        return (
            <div className="leaflet-bottom leaflet-left" id="MapPanel">
                <p className="PanelText">Total Flights: {this.props.totalFlights}</p>
                <p className="PanelText">
                    {"Tile type: "}
                    {/*@ts-ignore*/}
                    <select onChange={(event) => this.props.changeTiles(event.target.item(event.target.selectedIndex).nodeValue)}>
                        {
                            this.props.tiles.map((tiles: Tiles) =>
                                <option value={tiles.value}>{tiles.name}</option>
                            )
                        }
                    </select>
                </p>
            </div>
        );
    }
}
