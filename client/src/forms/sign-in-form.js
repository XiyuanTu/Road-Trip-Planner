import React, {useEffect, useState} from 'react';

import { signIn } from "../API/userAPI";

const SignInForm = ({ onSignIn, onSwitch }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [remember, setRemember] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await signIn(username, password);
            if (remember) {
                localStorage.setItem('rememberedUsername', username);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedUsername');
                localStorage.removeItem('rememberedPassword');
            }
            localStorage.setItem('token', token);
            onSignIn(token);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRememberChange = (e) => {
        const checked = e.target.checked;
        setRemember(checked);
        if (!checked) {
            localStorage.removeItem('rememberedUsername');
            localStorage.removeItem('rememberedPassword');
        }
    };

    useEffect(() => {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        const rememberedPassword = localStorage.getItem('rememberedPassword');
        if (rememberedUsername && rememberedPassword) {
            setUsername(rememberedUsername);
            setPassword(rememberedPassword);
            setRemember(true);
        } else {
            setRemember(false);
        }
    }, []);

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
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={ remember }
                                            onChange={ handleRememberChange }
                                            id="rememberPasswordCheck"
                                        />
                                        <label className="form-check-label" htmlFor="rememberPasswordCheck">
                                            Remember credentials
                                        </label>

                                    </div>
                                    { error && <p className="error">{ error }</p> }
                                    <div className="d-grid">
                                        <button className="btn btn-lg btn-primary btn-login text-uppercase fw-bold mb-2"
                                                type="submit">Sign in
                                        </button>
                                        <button onClick={onSwitch} className="btn btn-lg btn-success btn-login text-uppercase fw-bold mb-2"
                                                type="button">Register
                                        </button>
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