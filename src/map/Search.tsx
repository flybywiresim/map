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
        <div className="leaflet-top leaflet-left panel search-panel">
            <p>Search: </p>
            <input
                type="text"
                list="nameList"
                placeholder="Flight Number"
                onChange={handleSearchChange}
                onKeyPress={handleEnterPress}/>
            <button onClick={handleSearch}>Search</button>
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
