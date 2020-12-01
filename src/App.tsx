import React from 'react';
import Map from './map/Map';
import './App.scss';

function App() {
    return (
        <div className="App">
            <Map currentFlight="" disableSearch={false} disableInfo={false} center={[52.164863,4.470761]} zoom={8}/>
        </div>
    );
}

export default App;
