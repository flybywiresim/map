import React, {ChangeEvent, useState} from "react";
import {TelexConnection} from "@flybywiresim/api-client";

type SearchBarProps = {
    flightData: TelexConnection[],
    updateSearchedFlight: Function,
}
type SearchBarState = {
    nameList: string[],
    searchValue: string,
}


class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    state: SearchBarState = {
        nameList: this.generateNameList(),
        searchValue: "",
    }

    componentDidUpdate(prevProps: Readonly<SearchBarProps>) {
        if (prevProps.flightData !== this.props.flightData) {
            const names = this.generateNameList();
            this.setState({nameList: names});
        }
    }

    generateNameList() {
        const data = this.props.flightData;
        const nameList: string[] = [];
        data.map(flight => {
            nameList.push(flight.flight);
        });

        return nameList;
    }

    handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({searchValue: event.target.value.toString()});
    }

    handleSearch() {
        this.props.updateSearchedFlight(this.state.searchValue);
    }

    handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }

    render() {
        return (
            <div className="leaflet-top leaflet-left Panel SearchPanel">
                <p className="PanelText">Search: </p>
                <input
                    type="text"
                    list="nameList"
                    placeholder="Flight Number"
                    onChange={this.handleSearchChange}
                    onKeyPress={this.handleEnterPress}/>
                <button onClick={this.handleSearch.bind(this)}>Search</button>
                <datalist id="nameList">
                    {
                        this.state.nameList.map(name =>
                            <option key={name} value={name} />
                        )
                    }
                </datalist>
            </div>
        );
    }
}

export default SearchBar;