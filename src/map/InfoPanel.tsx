import React from "react";

type TileSet = {
    id: number;
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    iconsUseShadow: boolean,
}

type InfoPanelProps = {
    totalFlights: number,
    tiles: TileSet[],
    changeTiles: Function,
}

const InfoPanel = (props: InfoPanelProps) => {

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
            <p className="PanelText">Total Flights: {props.totalFlights}</p>
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
