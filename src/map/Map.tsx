import React, {useState, useEffect} from "react";
import {TileLayer, MapContainer} from "react-leaflet";

import {TelexConnection} from "@flybywiresim/api-client";

import FlightsLayer from './FlightsLayer';
import SearchBar from './Search';
import InfoPanel from './InfoPanel';

import "leaflet/dist/leaflet.css";
import "./Map.scss";

type MapProps = {
    disableSearch?: boolean,
    disableInfo?: boolean,
    disableFlights?: boolean,
    forceTileset?: string,
    currentFlight?: string,
    disableScroll?: boolean,
    refreshInterval?: number,
}

export type TileSet = {
    id: number,
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
}

const Map = (props: MapProps) => {
    const availableTileSets: TileSet[] = [
        {
            id: 1,
            value: "carto-dark",
            name: "Dark",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#ffffff",
        },
        {
            id: 2,
            value: "carto-light",
            name: "Light",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
        },
        {
            id: 3,
            value: "osm",
            name: "Open Street Map",
            attribution: "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
        }
    ];

    const [currentFlight, setCurrentFlight] = useState<string>(props.currentFlight || "");
    const [totalFlights, setTotalFlights] = useState<number>(0);
    const [selectedTile, setSelectedTile] = useState<TileSet>(setAndFind(props.forceTileset || ""));
    const [flightData, setFlightData] = useState<TelexConnection[]>([]);
    const [searchedFlight, setSearchedFlight] = useState<string>("");
    const [keyMap, setKeyMap] = useState<number>(Math.random());

    useEffect(() => {
        setKeyMap(Math.random());
    }, [selectedTile]);

    function setAndFind(key: string): TileSet {
        if (key) {
            window.localStorage.setItem("PreferredTileset", key);
        }
        return findPreferredTile();
    }

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
    }

    return (
        <div>
            <MapContainer
                id="mapid"
                key={keyMap}
                center={[51.505, -0.09]}
                zoom={5}
                scrollWheelZoom={!props.disableScroll}
                worldCopyJump={true}>
                <TileLayer attribution={selectedTile.attribution} url={selectedTile.url} />
                {
                    !props.disableSearch ?
                        <SearchBar flightData={flightData} updateSearchedFlight={updateSearchedFlight}/>
                        :
                        <></>
                }
                {
                    !props.disableFlights ?
                        <FlightsLayer
                            planeColor={selectedTile.planeColor}
                            planeHighlightColor={selectedTile.planeHighlightColor}
                            airportColor={selectedTile.airportColor}
                            updateTotalFlights={updateTotalFlights}
                            updateFlightData={updateFlightData}
                            currentFlight={currentFlight}
                            searchedFlight={searchedFlight}
                            refreshInterval={props.refreshInterval ?? 10_000}
                        />
                        :
                        <>
                        </>
                }
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
