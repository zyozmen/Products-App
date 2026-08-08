import React, { Component } from 'react';
import './LoginComponent.css';
import AuthenticationService from '../../services/AuthenticationService.js';

class LoginComponent extends Component {
    render() {
        return (
            <div className="LoginComponent">
                <LoginForm navigate={this.props.navigate} />
            </div>
        );
    }
}

class LoginForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            hasLoginFailed: false,
            showSuccessMessage: false
        };

        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleSignUp = this.handleSignUp.bind(this);
    }

    

    render() {
        
        return (
            <div className="container" id="container">
                <div className="form-container sign-up-container">
                    <form action="#" className="LoginComponentForm">
                        <h1>Create Account</h1>
                        <span>or use your email for registration</span>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <input type="password" placeholder="Password" />
                        <button type="button" onClick={this.handleSignUp}>Sign Up</button>
                    </form>
                </div>
                <div className="form-container sign-in-container">
                    <form action="#" className="LoginComponentForm">
                        <h1>Sign in</h1>
                        <span>or use your account</span>
                        <label htmlFor="username" className="d-block mt-2">User Name</label>
                        <input id="username" className="LoginInput" type="text" placeholder="User Name" value={this.state.username} onChange={e => this.setState({ username: e.target.value })} />
                        <label htmlFor="password" className="d-block mt-2">Password</label>
                        <input id="password" className="LoginInput" type="password" placeholder="Password" value={this.state.password} onChange={e => this.setState({ password: e.target.value })} />
                        <button type="button" className="btn btn-link forgot-password p-0">Forgot your password?</button>
                        <ShowInvalidCredentials hasLoginFailed={this.state.hasLoginFailed} />
                        <button type="button" className="live" onClick={this.handleSignIn}>Sign In</button>
                    </form>
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button type="button" className="ghost live" id="signIn">Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>Hello, Friend!</h1>
                            <p>Enter your personal details and start journey with us</p>
                            <button type="button" className="ghost live" id="signUp">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleSignUp = (e) => {
        e.preventDefault();
        console.log("Sign Up clicked");
    }

    handleSignIn(e) {

        e.preventDefault();

        if (this.state.username === "admin" && this.state.password === "admin") {
            AuthenticationService.registerSuccessfulLogin(this.state.username, this.state.password);
           this.props.navigate(`/welcome/${this.state.username}`);

        
            
        }
        else {
            console.log("Login failed");
            this.setState({ showSuccessMessage: false, hasLoginFailed: true });
        }
    }



}

function ShowInvalidCredentials(props) {
    if (props.hasLoginFailed) {
        return <div className="alert alert-warning">Invalid Credentials</div>;
    }
    return null;
}

export default LoginComponent;