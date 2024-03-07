import React, {useState} from 'react';

import {register, signIn} from "../API/userAPI";

const RegisterForm = ({ onSignIn, onSwitch }) => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [email, setEmail] = useState('');
        const [error, setError] = useState('');

        const handleRegister = async (e) => {
            e.preventDefault();
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            try {
                await register(username, password, email);
                const token = await signIn(username, password);
                localStorage.setItem('token', token);
                onSignIn(token);
            } catch (err) {
                setError(err.message);
            }
        }

        return (
            <div className="register-body">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-10 col-xl-9 mx-auto">
                            <div className="card flex-row my-5 border-0 shadow rounded-3 overflow-hidden">
                                <div className="card-img-left d-none d-md-flex">
                                </div>
                                <div className="card-body p-4 p-sm-5">
                                    <h5 className="card-title text-center mb-5 fw-light fs-1">Register</h5>
                                    <form onSubmit={handleRegister}>
                                        <div className="form-floating mb-3">
                                            <input type="text" className="form-control" id="floatingInputUsername"
                                                   placeholder="myusername" required
                                                   onChange={(e) => setUsername(e.target.value)} />
                                                <label htmlFor="floatingInputUsername">Username</label>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input type="email" className="form-control" id="floatingInputEmail"
                                                   placeholder="name@example.com"
                                                   onChange={(e) => setEmail(e.target.value)}/>
                                            <label htmlFor="floatingInputEmail">Email address</label>
                                        </div>

                                        <hr/>

                                        <div className="form-floating mb-3">
                                            <input type="password" className="form-control" id="floatingPassword"
                                                   placeholder="Password" required
                                                   onChange={(e) => setPassword(e.target.value)}/>
                                                    <label htmlFor="floatingPassword">Password</label>
                                            </div>

                                            <div className="form-floating mb-3">
                                                <input type="password" className="form-control" id="floatingPasswordConfirm"
                                                       placeholder="Confirm Password" required
                                                       onChange={(e) => setConfirmPassword(e.target.value)} />
                                                    <label htmlFor="floatingPasswordConfirm">Confirm Password</label>
                                            </div>
                                            {error && <p className="error-message text-warning-emphasis">{error}</p>}
                                            <div className="d-grid mb-2">
                                                <button className="btn btn-lg btn-primary btn-success fw-bold text-uppercase"
                                                        type="submit">Register
                                                </button>
                                            </div>

                                            <a className="d-block text-center mt-2 small" onClick={onSwitch} style={{ cursor: 'pointer' }}>
                                                Already have an account? Sign In
                                            </a>

                                            <hr className="my-4"/>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
    };

    export default RegisterForm;
