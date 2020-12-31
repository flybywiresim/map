import React, {ChangeEvent, useState, useEffect} from "react";
import {TelexConnection} from "@flybywiresim/api-client";

type SearchBarProps = {
    flightData: TelexConnection[],
    updateSearchedFlight: Function,
}

const SearchBar = (props: SearchBarProps) => {

    const [nameList, setNameList] = useState(generateNameList());
    const [searchValue, setSearchValue] = useState("");
    const [prevPropsFD, setPrevPropsFD] = useState(props.flightData);

    useEffect(() => {
        const names = generateNameList();
        setNameList(names);
        setPrevPropsFD(props.flightData);
    }, []);

    useEffect(() => {
        if (prevPropsFD !== props.flightData) {
            const names = generateNameList();
            setNameList(names);
            setPrevPropsFD(props.flightData);
        }
    });

    function generateNameList() {
        const data = props.flightData;
        const nameList: string[] = [];
        data.map(flight => {
            nameList.push(flight.flight);
        });

        return nameList;
    }

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.target.value.toString());
    }

    function handleSearch() {
        props.updateSearchedFlight(searchValue);
    }

    function handleEnterPress(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <div className="leaflet-top leaflet-left search-panel">
            <input
                type="text"
                className="search-term"
                list="nameList"
                placeholder="Flight Number"
                onChange={handleSearchChange}
                onKeyPress={handleEnterPress} />
            <button type="submit" onClick={handleSearch} className="search-button">
                <svg xmlns="http://www.w3.org/2000/svg" strokeWidth="3" stroke="#fff" fill="none"
                    width="24" height="24" viewBox="0 0 24 24"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="10" cy="10" r="7"/>
                    <line x1="21" y1="21" x2="15" y2="15"/>
                </svg>
            </button>
            <datalist id="nameList">
                {
                    nameList.map(name =>
                        <option key={name} value={name} />
                    )
                }
            </datalist>
        </div>
    );
};

export default SearchBar;
