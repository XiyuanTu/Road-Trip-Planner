import React, { useState } from 'react';

import { signIn } from "../API/userAPI";

const SignInForm = ({ onSignIn, onSwitch }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await signIn(username, password);
            localStorage.setItem('token', token);
            onSignIn(token);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
    <div className="container-fluid ps-md-0">
        <div className="row g-0">
            <div className="d-none d-md-flex col-md-4 col-lg-6 bg-image"></div>
            <div className="col-md-8 col-lg-6">
                <div className="login d-flex align-items-center py-5">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-9 col-lg-5 mx-auto">
                                <h3 className="login-heading mb-4">Welcome back!</h3>

                                <form onSubmit={handleSubmit}>
                                    <div className="form-floating mb-3">
                                        <input type="text" value={username}
                                               onChange={(e) => setUsername(e.target.value)} className="form-control"
                                               id="floatingInput" placeholder="name@example.com"/>
                                        <label htmlFor="floatingInput">Username</label>
                                    </div>
                                    <div className="form-floating mb-3">
                                        <input type="password" value={password}
                                               onChange={(e) => setPassword(e.target.value)} className="form-control"
                                               id="floatingPassword" placeholder="Password"/>
                                        <label htmlFor="floatingPassword">Password</label>
                                    </div>

                                    <div className="form-check mb-3">
                                        <input className="form-check-input" type="checkbox" value=""
                                               id="rememberPasswordCheck"/>
                                        <label className="form-check-label" htmlFor="rememberPasswordCheck">
                                            Remember password
                                        </label>
                                    </div>
                                    {error && <p className="error">{error}</p>}
                                    <div className="d-grid">
                                        <button className="btn btn-lg btn-primary btn-login text-uppercase fw-bold mb-2"
                                                type="submit">Sign in
                                        </button>
                                        <button onClick={onSwitch} className="btn btn-lg btn-success btn-login text-uppercase fw-bold mb-2"
                                                type="button">Register
                                        </button>
                                        <div className="text-center">
                                            <a className="small" href="#">Forgot password?</a>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
};

export default SignInForm;