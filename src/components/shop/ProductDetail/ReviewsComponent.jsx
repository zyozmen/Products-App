import React, { Component } from "react";
import Reviews from "./Reviews";

class ReviewsComponent extends Component {

    render() {

        return (
            <div className="tab-pane fade" id="tab-pane-3">
                <div className="row">
                    <Reviews />
                    <div className="col-md-6">
                        <h4 className="mb-4">Leave a review</h4>
                        <small>
                            Your email address will not be published. Required fields are
                            marked *
                        </small>
                        <div className="d-flex my-3">
                            <p className="mb-0 mr-2">Your Rating * :</p>
                            <div className="text-primary">
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                            </div>
                        </div>
                        <form>
                            <div className="form-group">
                                <label htmlFor="message">Your Review *</label>
                                <textarea
                                    id="message"
                                    cols={30}
                                    rows={5}
                                    className="form-control"
                                    defaultValue={""}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Your Name *</label>
                                <input type="text" className="form-control" id="name" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Your Email *</label>
                                <input type="email" className="form-control" id="email" />
                            </div>
                            <div className="form-group mb-0">
                                <input
                                    type="submit"
                                    defaultValue="Leave Your Review"
                                    className="btn btn-primary px-3"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}
export default ReviewsComponent;