import React from 'react';
import Map from './map/Map';
import './App.scss';

function App() {
    return (
        <div className="App">
            <Map currentFlight="" disableSearch={true} disableInfo={false} disableFlights={false} />
        </div>
    );
}

export default App;
