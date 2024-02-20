import React, { useState } from 'react';
import SignInForm from './sign-in-form';
import RegisterForm from './register-form';

const AuthPage = ({ onSignIn }) => {
    const [showSignIn, setShowSignIn] = useState(true);

    return (
        <div>
            {showSignIn ? (
                <SignInForm onSignIn={onSignIn} onSwitch={() => setShowSignIn(false)} />
            ) : (
                <RegisterForm onSignIn={onSignIn} onSwitch={() => setShowSignIn(true)} />
            )}
        </div>
    );
};

export default AuthPage;
