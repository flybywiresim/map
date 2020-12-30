import React, {useState, useEffect} from "react";
import {TileLayer, MapContainer} from "react-leaflet";

import {TelexConnection} from "@flybywiresim/api-client";

import FlightsLayer from './FlightsLayer';
import SearchBar from './Search';
import InfoPanel from './InfoPanel';

import "leaflet/dist/leaflet.css";
import "./Map.scss";

import ArrivalWhite from './icons/arrival_white.png';
import ArrivalGray from './icons/arrival_gray.png';
import DepartureWhite from './icons/departure_white.png';
import DepartureGray from './icons/arrival_gray.png';
import PlaneCyan from './icons/plane_cyan.png';
import PlaneBlue from './icons/plane_blue.png';
import {LatLng} from "leaflet";
import WeatherLayer from "./WeatherLayer";

type MapProps = {
    disableSearch?: boolean,
    disableInfo?: boolean,
    disableFlights?: boolean,
    disableWeather?: boolean,
    forceTileset?: string,
    currentFlight?: string,
    disableScroll?: boolean,
    refreshInterval?: number,
    hideOthers?: boolean,
    center?: LatLng,
    zoom?: number,
}

export type TileSet = {
    id: number,
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeIcon: string,
    planeIconHighlight: string,
    departureIcon: string,
    arrivalIcon: string,
}

const Map = (props: MapProps) => {
    const availableTileSets: TileSet[] = [
        {
            id: 1,
            value: "carto-dark",
            name: "Dark",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            planeIcon: PlaneCyan,
            planeIconHighlight: PlaneBlue,
            departureIcon: DepartureWhite,
            arrivalIcon: ArrivalWhite,
        },
        {
            id: 2,
            value: "carto-light",
            name: "Light",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            planeIcon: PlaneCyan,
            planeIconHighlight: PlaneBlue,
            departureIcon: DepartureGray,
            arrivalIcon: ArrivalGray,
        },
        {
            id: 3,
            value: "osm",
            name: "Open Street Map",
            attribution: "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            planeIcon: PlaneCyan,
            planeIconHighlight: PlaneBlue,
            departureIcon: DepartureGray,
            arrivalIcon: ArrivalGray,
        }
    ];

    const [currentFlight, setCurrentFlight] = useState<string>(props.currentFlight || "");
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
        <MapContainer
            id="mapid"
            key={keyMap}
            center={props.center || [50, 8]}
            zoom={props.zoom || 5}
            scrollWheelZoom={!props.disableScroll}
            worldCopyJump={true}>
            <TileLayer attribution={selectedTile.attribution} url={selectedTile.url} />
            {
                (!props.disableWeather) ?
                    <WeatherLayer /> : <></>
            }
            {
                (!props.disableFlights) ?
                    <FlightsLayer
                        planeIcon={selectedTile.planeIcon}
                        planeIconHighlight={selectedTile.planeIconHighlight}
                        departureIcon={selectedTile.departureIcon}
                        arrivalIcon={selectedTile.arrivalIcon}
                        updateFlightData={updateFlightData}
                        currentFlight={currentFlight}
                        searchedFlight={searchedFlight}
                        refreshInterval={props.refreshInterval || 10000}
                        hideOthers={props.hideOthers}
                    /> : <></>
            }
            {
                !props.disableInfo ?
                    <InfoPanel refreshInterval={props.refreshInterval || 10000}
                        tiles={availableTileSets} changeTiles={selectTile}/>
                    : <></>
            }
            {
                !props.disableSearch ?
                    <SearchBar flightData={flightData} updateSearchedFlight={updateSearchedFlight}/>
                    : <></>
            }
        </MapContainer>
    );
};

export default Map;
