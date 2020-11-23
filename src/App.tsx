import React from 'react';
import {Map} from './map/Map';
import './App.scss';

function App() {
    return (
        <div className="App">
            <Map tiles="carto-dark" />
        </div>
    );
}

export default App;
