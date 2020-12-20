import React, {useEffect, useState} from "react";
import {TileSet} from "./Map";
import {Telex} from "@flybywiresim/api-client";

type InfoPanelProps = {
    tiles: TileSet[],
    changeTiles: Function,
    refreshInterval: number,
}

const InfoPanel = (props: InfoPanelProps) => {
    const [totalFlights, setTotalFlights] = useState<number>();

    useEffect(() => {
        if (props.refreshInterval && props.refreshInterval > 0) {
            const interval = setInterval(() => getTotalFlights(), props.refreshInterval);
            getTotalFlights();
            return () => clearInterval(interval);
        }
    }, [props.refreshInterval]);

    async function getTotalFlights() {
        try {
            setTotalFlights(await Telex.countConnections());
        } catch (err) {
            console.error(err);
        }
    }

    function retrieveActiveTileSet() {
        try {
            const storedTiles = window.localStorage.getItem("PreferredTileset");
            if (!storedTiles) {
                return props.tiles[0];
            }

            return props.tiles.find(x => x.value === storedTiles) || props.tiles[0];
        } catch {
            return props.tiles[0];
        }
    }

    return (
        <div className="leaflet-bottom leaflet-left Panel InfoPanel">
            <p className="PanelText">Total Flights: {totalFlights}</p>
            <p className="PanelText">
                {"Map Style: "}
                <select defaultValue={retrieveActiveTileSet().value} onChange={(event) => props.changeTiles(event.target.value)}>
                    {
                        props.tiles.map((tiles: TileSet) =>
                            <option key={tiles.id} value={tiles.value}>{tiles.name}</option>
                        )
                    }
                </select>
            </p>
        </div>
    );
};

export default InfoPanel;
