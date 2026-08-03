import React, { Component } from 'react';
import './CategoryComponent.css';

class CategoryComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            category:
                [
                    { id: 1, Description: 'Category Name 1' },
                    { id: 2, Description: 'Category Name 2' },
                    { id: 3, Description: 'Category Name 3' },
                    { id: 4, Description: 'Category Name 4' }
                ]

        };
    }
    render() {
        return (
            <div className="container-fluid pt-5">
                <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
                    <span className="bg-secondary pr-3">Categories</span>
                </h2>
                <div className="row px-xl-5 pb-3">
                    {this.state.category.map(category =>

                    <div className="col-lg-3 col-md-4 col-sm-6 pb-1" key={category.id}>
                        <button type="button" className="text-decoration-none btn btn-link p-0">
                            <div className="cat-item d-flex align-items-center mb-4">
                                <div className="overflow-hidden category-image-wrapper">
                                    <img className="img-fluid" src={`/img/cat-${category.id}.jpg`} alt="" />
                                </div>
                                <div className="flex-fill pl-3">
                                    <h6>{category.Description}</h6>
                                    <small className="text-body">100 Products</small>
                                </div>
                            </div>
                        </button>
                    </div>
                    )}
                </div>
            </div>
        );
    }
}
export default CategoryComponent;