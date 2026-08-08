import React, { Component } from "react";
import TabsComponent from "../../ui/TabsComponent";
import ReviewsComponent from "./ReviewsComponent";

class ProductDescriptionComponent extends Component {
     constructor(props) {
        super(props);
    }

    render() {
            const product = this.props.params?.product || {};
        return (
        <div className="row px-xl-5">
                    <div className="col">
                        <div className="bg-light p-30">
                            <TabsComponent
                                tabs={[
                                    {
                                        key: 'description',
                                        label: 'Description',
                                        content: (
                                            <div>
                                                <h4 className="mb-3">Product Description</h4>
                                                <p>{product.description}</p>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'information',
                                        label: 'Information',
                                        content: (
                                            <div>
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
                                                            <li className="list-group-item px-0">Sit erat duo lorem duo ea consetetur, et eirmod takimata.</li>
                                                            <li className="list-group-item px-0">Amet kasd gubergren sit sanctus et lorem eos sadipscing at.</li>
                                                            <li className="list-group-item px-0">Duo amet accusam eirmod nonumy stet et et stet eirmod.</li>
                                                            <li className="list-group-item px-0">Takimata ea clita labore amet ipsum erat justo voluptua. Nonumy.</li>
                                                        </ul>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <ul className="list-group list-group-flush">
                                                            <li className="list-group-item px-0">Sit erat duo lorem duo ea consetetur, et eirmod takimata.</li>
                                                            <li className="list-group-item px-0">Amet kasd gubergren sit sanctus et lorem eos sadipscing at.</li>
                                                            <li className="list-group-item px-0">Duo amet accusam eirmod nonumy stet et et stet eirmod.</li>
                                                            <li className="list-group-item px-0">Takimata ea clita labore amet ipsum erat justo voluptua. Nonumy.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'reviews',
                                        label: 'Reviews (0)',
                                        content: <ReviewsComponent />,
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </div>
        )
    }
}

export default ProductDescriptionComponent;