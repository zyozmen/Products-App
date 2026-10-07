import React, { Component } from "react";
import './Reviews.css';

class Reviews extends Component {
    render() {
        const t = this.props.t;

        return (<div className="col-md-6">
                        <h4 className="mb-4">{t('review_sample_heading')}</h4>
                        <div className="media mb-4">
                            <img
                                src="/img/user.jpg"
                                alt={t('product_image')}
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
                                <p>{t('review_sample_text')}</p>
                            </div>
                        </div>
                    </div>
        );
    }
}

export default Reviews;