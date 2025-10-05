import React from 'react';

const LoginView = ({ onLogin }) => {
  return (
    <div>
      <p>Please log in to get started.</p>
      <button className="button" onClick={onLogin}>
        Login with GitHub Token
      </button>
    </div>
  );
};

export default LoginView;