import React, { Component } from "react";
import './Reviews.css';

class Reviews extends Component {

    render() {

        return (<div className="col-md-6">
                        <h4 className="mb-4">1 review for "Product Name"</h4>
                        <div className="media mb-4">
                            <img
                                src="/img/user.jpg"
                                alt="Image"
                                className="img-fluid mr-3 mt-1"
                                className="img-fluid mr-3 mt-1 review-avatar"
                            />
                            <div className="media-body">
                                <h6>
                                    John Doe
                                    <small>
                                        {" "}
                                        - <i>01 Jan 2045</i>
                                    </small>
                                </h6>
                                <div className="text-primary mb-2">
                                    <i className="fas fa-star" />
                                    <i className="fas fa-star" />
                                    <i className="fas fa-star" />
                                    <i className="fas fa-star-half-alt" />
                                    <i className="far fa-star" />
                                </div>
                                <p>
                                    Diam amet duo labore stet elitr ea clita ipsum, tempor
                                    labore accusam ipsum et no at. Kasd diam tempor rebum
                                    magna dolores sed sed eirmod ipsum.
                                </p>
                            </div>
                        </div>
                    </div>
        );
    }
}

export default Reviews;