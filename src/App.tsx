import React from 'react';
import Map from './map/Map';
import './App.scss';

function App() {
    return (
        <div className="App">
            <Map forceTileset={"carto-dark"} disableSearch={true} disableInfo={true} disableFlights={false} />
        </div>
    );
}

export default App;
