import {Marker, Popup} from "react-leaflet";
import L from "leaflet";
import React from "react";
import {TelexConnection} from "@flybywiresim/api-client";

type FlightMarkerProps = {
    flight: TelexConnection;
    icon: string;
    highlightIcon?: string;
    isHighlighted?: boolean;
    onPopupOpen?: Function;
    onPopupClose?: Function;
}

const FlightMarker = (props: FlightMarkerProps) => {
    return (
        <Marker
            position={[props.flight.location.y, props.flight.location.x]}
            // TODO: Need to get rid of L.divIcon. It produces twice as many DOM nodes as L.icon. Issue is the rotation.
            icon={L.divIcon({
                iconSize: [20, 23],
                iconAnchor: [10, 6.5],
                className: 'mapIcon',
                html: `<img alt="${props.flight.flight}" src="${(props.isHighlighted && !!props.highlightIcon) ? props.highlightIcon : props.icon}"
                        style="transform-origin: center; transform: rotate(${props.flight.heading}deg);"/>`
            })}>
            <Popup onOpen={() => props.onPopupOpen ? props.onPopupOpen() : {}} onClose={() => props.onPopupClose ? props.onPopupClose() : {}} >
                <h1>Flight {props.flight.flight}</h1>
                {
                    (props.flight.origin && props.flight.destination) ?
                        <h2>{props.flight.origin}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                            <path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />
                        </svg> {props.flight.destination}</h2>
                        : ""
                }
                <p>Aircraft: {props.flight.aircraftType}</p>
                <p>Altitude: {props.flight.trueAltitude}ft</p>
            </Popup>
        </Marker>
    );
};

export default FlightMarker;
