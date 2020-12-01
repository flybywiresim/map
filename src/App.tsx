import React from 'react';
import Map from './map/Map';
import './App.scss';

function App() {
    return (
        <div className="App">
            <Map currentFlight="" disableSearch={false} disableInfo={false} />
        </div>
    );
}

export default App;
