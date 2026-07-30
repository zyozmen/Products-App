
import React, { Component } from "react";

class NameFilter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            localName: props.nameFilter || "",
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.nameFilter !== this.props.nameFilter) {
            this.setState({ localName: this.props.nameFilter || "" });
        }
    }

    handleInputChange(event) {
        this.setState({ localName: event.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
        const { onNameFilterChange } = this.props;
        if (onNameFilterChange) {
            onNameFilterChange(this.state.localName);
        }
    }

    handleClear() {
        const { onNameFilterChange } = this.props;
        this.setState({ localName: "" }, () => {
            if (onNameFilterChange) {
                onNameFilterChange("");
            }
        });
    }

    render() {
        const { localName } = this.state;
        const hasValue = localName.trim().length > 0;

        return (
            <div className="bg-light p-4 mb-30">
                <form onSubmit={this.handleSubmit}>
                    <div className="input-group mb-2">
                        <input
                            type="text"
                            className="form-control"
                            value={localName}
                            onChange={this.handleInputChange}
                            placeholder="Filter by product name"
                        />
                        <div className="input-group-append">
                            <button type="submit" className="input-group-text bg-transparent text-primary">
                                <i className="fa fa-search" />
                            </button>
                        </div>
                    </div>
                    {hasValue && (
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={this.handleClear}
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>
        );
    }
}

export default NameFilter;