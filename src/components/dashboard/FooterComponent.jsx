import React, { Component } from 'react';
import './FooterComponent.css';

class FooterComponent extends Component {

  render() {
    return (
      <div className="container-fluid bg-dark text-secondary mt-5 pt-5">
        <div className="row px-xl-5 pt-5">
          <div className="col-lg-4 col-md-12 mb-5 pr-3 pr-xl-5">
            <h5 className="text-secondary text-uppercase mb-4">Get In Touch</h5>
            <p className="mb-4">
              No dolore ipsum accusam no lorem. Invidunt sed clita kasd clita et et
              dolor sed dolor. Rebum tempor no vero est magna amet no
            </p>
            <p className="mb-2">
              <i className="fa fa-map-marker-alt text-primary mr-3" />
              123 Street, New York, USA
            </p>
            <p className="mb-2">
              <i className="fa fa-envelope text-primary mr-3" />
              info@example.com
            </p>
            <p className="mb-0">
              <i className="fa fa-phone-alt text-primary mr-3" />
              +012 345 67890
            </p>
          </div>
          <div className="col-lg-8 col-md-12">
            <div className="row">
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">Quick Shop</h5>
                <div className="d-flex flex-column justify-content-start">
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Home
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Our Shop
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Shop Detail
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Shopping Cart
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Checkout
                  </button>
                  <button type="button" className="btn btn-link text-secondary p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Contact Us
                  </button>
                </div>
              </div>
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">My Account</h5>
                <div className="d-flex flex-column justify-content-start">
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Home
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Shopping Cart
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Checkout
                  </button>
                  <button type="button" className="btn btn-link text-secondary p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    Contact Us
                  </button>
                </div>
              </div>
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">Newsletter</h5>
                <p>Duo stet tempor ipsum sit amet magna ipsum tempor est</p>
                <form action="">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your Email Address"
                    />
                    <div className="input-group-append">
                      <button className="btn btn-primary">Sign Up</button>
                    </div>
                  </div>
                </form>
                <h6 className="text-secondary text-uppercase mt-4 mb-3">Follow Us</h6>
                <div className="d-flex">
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="Twitter">
                    <i className="fab fa-twitter" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="Facebook">
                    <i className="fab fa-facebook-f" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="LinkedIn">
                    <i className="fab fa-linkedin-in" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square" aria-label="Instagram">
                    <i className="fab fa-instagram" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row border-top mx-xl-5 py-4 footer-border-top">
          <div className="col-md-6 px-xl-0">
            <p className="mb-md-0 text-center text-md-left text-secondary">
              ©{" "}
              <button type="button" className="btn btn-link text-primary p-0">
                Domain
              </button>
              . All Rights Reserved. Designed by
              <a className="text-primary" href="https://htmlcodex.com">
                HTML Codex
              </a>
            </p>
          </div>
          <div className="col-md-6 px-xl-0 text-center text-md-right">
            <img className="img-fluid" src="img/payments.png" alt="" />
          </div>
        </div>
      </div>

    );
  }
}
export default FooterComponent;