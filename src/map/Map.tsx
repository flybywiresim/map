import React, {useState} from "react";
import {TileLayer, MapContainer} from "react-leaflet";
import L from "leaflet";

import {TelexConnection} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";
import FlightsLayer from './Flights';
import SearchBar from './SearchBar';
import InfoPanel from './InfoPanel';

type MapProps = {
    currentFlight: string,
    disableSearch: boolean,
    disableInfo: boolean,
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

const Map = (props: MapProps) => {
    const availableTileSets: TileSet[] = [
        {
            value: "carto-dark",
            name: "Dark",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#ffffff",
            iconsUseShadow: true,
        },
        {
            value: "carto-light",
            name: "Light",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
            iconsUseShadow: true,
        },
        {
            value: "osm",
            name: "Open Street Map",
            attribution: "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
            iconsUseShadow: true,
        }
    ];

    const [currentFlight, setCurrentFlight] = useState<string>("");
    const [totalFlights, setTotalFlights] = useState<number>(0);
    const [selectedTile, setSelectedTile] = useState<TileSet>(findPreferredTile());
    const [flightData, setFlightData] = useState<TelexConnection[]>([]);
    const [searchedFlight, setSearchedFlight] = useState<string>("");

    function findPreferredTile(): TileSet {
        try {
            const storedTiles = window.localStorage.getItem("PreferredTileset");
            if (!storedTiles) {
                return availableTileSets[0];
            }

            return availableTileSets.find(x => x.value === storedTiles) || availableTileSets[0];
        } catch {
            return availableTileSets[0];
        }
    }

    function updateTotalFlights(flights: number) {
        setTotalFlights(flights);
    }

    function updateFlightData(data: TelexConnection[]) {
        setFlightData(data);
    }

    function updateSearchedFlight(flightName: string) {
        setSearchedFlight(flightName);
    }

    function selectTile(tile: string | null) {
        if (!tile) {
            return availableTileSets[0];
        }

        const newTiles = availableTileSets.find(x => x.value === tile) || availableTileSets[0];

        setSelectedTile(newTiles);
        window.localStorage.setItem("PreferredTileset", newTiles.value);

        location.reload();
    }

    return (
        <div>
            <MapContainer
                id="mapid"
                center={[51.505, -0.09]}
                zoom={5}
                scrollWheelZoom={true}>
                <TileLayer attribution={selectedTile.attribution} url={selectedTile.url} />
                {
                    !props.disableSearch ?
                        <SearchBar flightData={flightData} updateSearchedFlight={updateSearchedFlight}/>
                        :
                        <></>
                }
                <FlightsLayer
                    planeColor={selectedTile.planeColor}
                    planeHighlightColor={selectedTile.planeHighlightColor}
                    airportColor={selectedTile.airportColor}
                    updateTotalFlights={updateTotalFlights}
                    updateFlightData={updateFlightData}
                    iconsUseShadow={selectedTile.iconsUseShadow}
                    currentFlight={currentFlight}
                    searchedFlight={searchedFlight}
                />
                {
                    !props.disableInfo ?
                        <InfoPanel totalFlights={totalFlights} tiles={availableTileSets} changeTiles={selectTile}/>
                        :
                        <></>
                }
            </MapContainer>
        </div>
    );
};

export default Map;
