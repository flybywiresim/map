import React, {useState, useEffect} from "react";
import {Telex, TelexConnection} from "@flybywiresim/api-client";
import {useMap} from "react-leaflet";
import {LatLng} from "leaflet";
import {TileSet} from "./Map";

type MenuPanelProps = {
    onFound?: (conn: TelexConnection) => void;
    onNotFound?: () => void;
    onReset?: () => void;
    weatherOpacity?: number;
    onWeatherOpacityChange?: (opacity: number) => void;
    activeTileSet?: TileSet;
    availableTileSets?: TileSet[];
    onTileSetChange?: (tileSet: TileSet) => void;
    refreshInterval?: number;
    currentFlight?: string;
    onCurrentFlightChange?: (flight: string) => void;
    showOthers?: boolean;
    onShowOthersChange?: (show: boolean) => void;
}

const MenuPanel = (props: MenuPanelProps) => {
    const mapRef = useMap();

    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [totalFlights, setTotalFlights] = useState<number>(NaN);
    const [searchValue, setSearchValue] = useState<string>("");
    const [autocompleteList, setAutocompleteList] = useState<TelexConnection[]>([]);

    // Update total flights
    useEffect(() => {
        const getTotalFlights = async () => {
            try {
                setTotalFlights(await Telex.countConnections());
            } catch (e) {
                console.error(e);
            }
        };

        const interval = setInterval(() => getTotalFlights(), props.refreshInterval || 10000);
        getTotalFlights();
        return () => clearInterval(interval);
    });

    async function handleSearch(flyTo?: boolean) {
        if (!searchValue) {
            if (props.onReset) {
                props.onReset();
            }
            return;
        }

        try {
            const res = await Telex.findConnections(searchValue);

            if (res.length === 0) {
                if (props.onNotFound) {
                    props.onNotFound();
                }
            } else if (res.length >= 1) {
                setAutocompleteList(res);

                if (res[0].flight === searchValue) {
                    if (props.onFound) {
                        props.onFound(res[0]);
                    }

                    if (flyTo === undefined || flyTo) {
                        mapRef.flyTo(new LatLng(res[0].location.y, res[0].location.x), 7);
                    }
                }
            }
        } catch (e) {
            console.error(e);

            if (props.onNotFound) {
                props.onNotFound();
            }
        }
    }

    return (
        <div className="leaflet-top leaflet-left search-panel">
            <div className="search-bar">
                <button
                    className="menu-button"
                    onClick={() => setShowDetails(!showDetails)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg" strokeWidth="2" stroke="#b5b5b5" fill="none"
                        width="24" height="24" viewBox="0 0 24 24"
                        strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6"/>
                        <line x1="4" y1="12" x2="20" y2="12"/>
                        <line x1="4" y1="18" x2="20" y2="18"/>
                    </svg>
                </button>
                <input
                    type="text"
                    className="search-term"
                    list="autocomplete"
                    placeholder="Flight Number"
                    onChange={event => {
                        setSearchValue(event.target.value.toString());
                        handleSearch(false);
                    }}
                    onKeyPress={event => event.key === "Enter" ? handleSearch() : {}}
                    onFocus={(event) => event.target.select()}
                    onBlur={() => handleSearch()}/>
                <button type="submit" onClick={() => handleSearch()} className="search-button">
                    <svg
                        xmlns="http://www.w3.org/2000/svg" strokeWidth="3" stroke="#fff" fill="none"
                        width="24" height="24" viewBox="0 0 24 24"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="10" cy="10" r="7"/>
                        <line x1="21" y1="21" x2="15" y2="15"/>
                    </svg>
                </button>
                <datalist id="autocomplete">
                    {
                        autocompleteList.sort((a, b) => {
                            if (a.flight < b.flight) {
                                return -1;
                            }
                            if (a.flight > b.flight) {
                                return 1;
                            }

                            return 0;
                        }).map(connection => !searchValue || connection.flight.startsWith(searchValue) ?
                            <option key={connection.id} value={connection.flight}/> : <></>)
                    }
                </datalist>
            </div>
            <div className="detail-area" hidden={!showDetails}>
                <h1>Work in progress</h1>
                <p>Total Flights: {totalFlights}</p>
                {
                    (props.weatherOpacity !== undefined && props.onWeatherOpacityChange) ?
                        <>
                            <p>Weather opacity</p>
                            <input
                                type="range"
                                value={100 * props.weatherOpacity}
                                min={0}
                                max={100}
                                onChange={event => props.onWeatherOpacityChange && props.onWeatherOpacityChange(Number(event.target.value) / 100)}
                            />
                        </> : <></>
                }
                {
                    (props.activeTileSet && props.availableTileSets && props.onTileSetChange) ?
                        <select
                            defaultValue={props.activeTileSet.value}
                            onChange={(event) =>
                                props.onTileSetChange && props.availableTileSets &&
                                props.onTileSetChange(
                                    props.availableTileSets.find(x => x.value === event.target.value) || props.availableTileSets[0])}>
                            {
                                props.availableTileSets.map((tiles: TileSet) =>
                                    <option key={tiles.id} value={tiles.value}>{tiles.name}</option>
                                )
                            }
                        </select> : <></>
                }
                {
                    props.onCurrentFlightChange ?
                        <input
                            type="text"
                            placeholder="Current Flight Number"
                            onChange={event => props.onCurrentFlightChange ? props.onCurrentFlightChange(event.target.value.toString()) : {}}
                            onBlur={event => props.onCurrentFlightChange ? props.onCurrentFlightChange(event.target.value.toString()) : {}}
                            onFocus={(event) => event.target.select()}
                            value={props.currentFlight}
                        /> : <></>
                }
                {
                    props.onShowOthersChange ?
                        <>
                            <p>Show others</p>
                            <input
                                type="checkbox"
                                checked={props.showOthers}
                                onChange={event => props.onShowOthersChange ? props.onShowOthersChange(event.target.checked) : {}}
                            />
                        </> : <></>
                }
            </div>
        </div>
    );
};

export default MenuPanel;
