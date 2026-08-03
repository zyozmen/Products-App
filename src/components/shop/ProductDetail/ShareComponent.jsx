import React, { Component } from "react";

class ShareComponent extends Component {

    render() {

        return (
            <div className="d-flex pt-2">
                <strong className="text-dark mr-2">Share on:</strong>
                <div className="d-inline-flex">
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label="Compartir en Facebook">
                        <i className="fab fa-facebook-f" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label="Compartir en Twitter">
                        <i className="fab fa-twitter" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label="Compartir en LinkedIn">
                        <i className="fab fa-linkedin-in" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label="Compartir en Pinterest">
                        <i className="fab fa-pinterest" />
                    </button>
                </div>
            </div>
        );
    }
}

export default ShareComponent;