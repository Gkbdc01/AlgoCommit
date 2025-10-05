import React from 'react';

const LoginView = ({ onLogin }) => {
  return (
    <div>
      <p>Please log in to get started.</p>
      <button className="button" onClick={onLogin}>
        Login with GitHub Token
      </button>
      <p className="token-info">Your token needs the full 'repo' scope.</p>
    </div>
  );
};

export default LoginView;