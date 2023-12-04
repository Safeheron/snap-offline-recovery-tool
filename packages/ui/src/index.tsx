/* eslint-disable jsx-a11y/anchor-is-valid */
import "./index.css"
import React from "react";
import ReactDOM from "react-dom/client";
import LandingPage from './pages/Landing'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div>
      <nav className="navbar flex justify-center mt-[30px]">
        <div className="navbar-brand flex items-center">
          <a className="navbar-item" href="#">
            <img src={require('./assets/logo.png')} alt="logo" width={40} className="!max-h-none" />
          </a>
          <div>
            <div className="title is-5 mb-0">Safeheron Snap</div>
            <p className="text-sm">Enables MPC Wallet inside MetaMask</p>
          </div>
        </div>
      </nav>
      <div className="container m-auto w-4/5">
        <LandingPage />
      </div>
    </div>
  </React.StrictMode>
);

