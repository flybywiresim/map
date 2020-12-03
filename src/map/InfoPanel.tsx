import React, {ChangeEvent, useState} from "react";

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

class InfoPanel extends React.Component<InfoPanelProps, any> {
    retrieveActiveTileSet() {
        try {
            const storedTiles = window.localStorage.getItem("PreferredTileset");
            if (!storedTiles) {
                return this.props.tiles[0];
            }

            return this.props.tiles.find(x => x.value === storedTiles) || this.props.tiles[0];
        } catch {
            return this.props.tiles[0];
        }
    }

    render() {
        return (
            <div className="leaflet-bottom leaflet-left Panel InfoPanel">
                <p className="PanelText">Total Flights: {this.props.totalFlights}</p>
                <p className="PanelText">
                    {"Map Style: "}
                    <select defaultValue={this.retrieveActiveTileSet().value} onChange={(event) => this.props.changeTiles(event.target.value)}>
                        {
                            this.props.tiles.map((tiles: TileSet) =>
                                <option key={tiles.id} value={tiles.value}>{tiles.name}</option>
                            )
                        }
                    </select>
                </p>
            </div>
        );
    }
}

export default InfoPanel;
