import React, { Component } from "react";

class ShareComponent extends Component {

    render() {

        return (
            <div className="d-flex pt-2">
                <strong className="text-dark mr-2">Share on:</strong>
                <div className="d-inline-flex">
                    <a className="text-dark px-2" href="">
                        <i className="fab fa-facebook-f" />
                    </a>
                    <a className="text-dark px-2" href="">
                        <i className="fab fa-twitter" />
                    </a>
                    <a className="text-dark px-2" href="">
                        <i className="fab fa-linkedin-in" />
                    </a>
                    <a className="text-dark px-2" href="">
                        <i className="fab fa-pinterest" />
                    </a>
                </div>
            </div>
        );
    }
}

export default ShareComponent;