import React, {useState, useEffect} from "react";
import {Telex, TelexConnection} from "@flybywiresim/api-client";
import {useMap} from "react-leaflet";
import {LatLng} from "leaflet";
import {TileSet} from "./Map";

type SearchBarProps = {
    connections: TelexConnection[],
    onFound?: (conn: TelexConnection) => void;
    onNotFound?: () => void;
    onReset?: () => void;
    availableTileSets?: TileSet[];
    onTileSetSelect?: (key: string) => void;
}

const SearchBar = (props: SearchBarProps) => {
    const mapRef = useMap();

    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [totalFlights, setTotalFlights] = useState<number>(NaN);
    const [searchValue, setSearchValue] = useState<string>("");

    // Update total flights
    useEffect(() => {
        const getTotalFlights = async () => {
            try {
                setTotalFlights(await Telex.countConnections());
            } catch (e) {
                console.error(e);
            }
        };

        const interval = setInterval(() => getTotalFlights(), 15000);
        getTotalFlights();
        return () => clearInterval(interval);
    });

    async function handleSearch() {
        if (!searchValue) {
            if (props.onReset) {
                props.onReset();
            }
            return;
        }

        try {
            const res = await Telex.findConnection(searchValue);

            if (props.onFound) {
                props.onFound(res);
            }

            mapRef.flyTo(new LatLng(res.location.y, res.location.x), 7);
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
                    onChange={event => setSearchValue(event.target.value.toString())}
                    onKeyPress={event => event.key === "Enter" ? handleSearch() : {}}
                    onFocus={(event) => event.target.select()}
                    onBlur={handleSearch} />
                <button type="submit" onClick={handleSearch} className="search-button">
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
                        props.connections.map(connection => !searchValue || connection.flight.startsWith(searchValue) ?
                            <option key={connection.id} value={connection.flight} /> : <></>)
                    }
                </datalist>
            </div>
            <div className="detail-area" hidden={!showDetails}>
                <p>Total Flights: {totalFlights}</p>
            </div>
        </div>
    );
};

export default SearchBar;
