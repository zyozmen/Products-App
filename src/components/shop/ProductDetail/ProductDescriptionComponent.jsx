import React, { Component } from "react";
import ReviewsComponent from "./ReviewsComponent";

class ProductDescriptionComponent extends Component {
     constructor(props) {
        super(props);
    }

    render() {
            const product = this.props.params?.product || {};
             const ranking = product.ranking || {};
             const price = product.price || {};
        return (
        <div className="row px-xl-5">
                    <div className="col">
                        <div className="bg-light p-30">
                            <div className="nav nav-tabs mb-4">
                                <a
                                    className="nav-item nav-link text-dark active"
                                    data-toggle="tab"
                                    href="#tab-pane-1"
                                >
                                    Description
                                </a>
                                <a
                                    className="nav-item nav-link text-dark"
                                    data-toggle="tab"
                                    href="#tab-pane-2"
                                >
                                    Information
                                </a>
                                <a
                                    className="nav-item nav-link text-dark"
                                    data-toggle="tab"
                                    href="#tab-pane-3"
                                >
                                    Reviews (0)
                                </a>
                            </div>
                            <div className="tab-content">
                                <div className="tab-pane fade show active" id="tab-pane-1">
                                    <h4 className="mb-3">Product Description</h4>
                                    <p>
                                        {product.description}
                                    </p>
                                </div>
                                <div className="tab-pane fade" id="tab-pane-2">
                                    <h4 className="mb-3">Additional Information</h4>
                                    <p>
                                        Eos no lorem eirmod diam diam, eos elitr et gubergren diam sea.
                                        Consetetur vero aliquyam invidunt duo dolores et duo sit. Vero
                                        diam ea vero et dolore rebum, dolor rebum eirmod consetetur
                                        invidunt sed sed et, lorem duo et eos elitr, sadipscing kasd ipsum
                                        rebum diam. Dolore diam stet rebum sed tempor kasd eirmod.
                                        Takimata kasd ipsum accusam sadipscing, eos dolores sit no ut diam
                                        consetetur duo justo est, sit sanctus diam tempor aliquyam eirmod
                                        nonumy rebum dolor accusam, ipsum kasd eos consetetur at sit
                                        rebum, diam kasd invidunt tempor lorem, ipsum lorem elitr sanctus
                                        eirmod takimata dolor ea invidunt.
                                    </p>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item px-0">
                                                    Sit erat duo lorem duo ea consetetur, et eirmod takimata.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Amet kasd gubergren sit sanctus et lorem eos sadipscing at.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Duo amet accusam eirmod nonumy stet et et stet eirmod.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Takimata ea clita labore amet ipsum erat justo voluptua.
                                                    Nonumy.
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item px-0">
                                                    Sit erat duo lorem duo ea consetetur, et eirmod takimata.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Amet kasd gubergren sit sanctus et lorem eos sadipscing at.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Duo amet accusam eirmod nonumy stet et et stet eirmod.
                                                </li>
                                                <li className="list-group-item px-0">
                                                    Takimata ea clita labore amet ipsum erat justo voluptua.
                                                    Nonumy.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <ReviewsComponent />
                            </div>
                        </div>
                    </div>
                </div>
        )
    }
}

export default ProductDescriptionComponent;