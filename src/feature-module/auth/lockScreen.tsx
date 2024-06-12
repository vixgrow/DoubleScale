import React, { useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { all_routes } from "../router/all_routes";

const LockScreen = () => {
  const route = all_routes;
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };
  return (
    <div className="account-content">
      <div className="login-wrapper login-new">
        <div className="login-shapes">
          <div className="login-right-shape">
            <ImageWithBasePath
              src="assets/img/authentication/shape-01.png"
              alt="Shape"
            />
          </div>
          <div className="login-left-shape">
            <ImageWithBasePath
              src="assets/img/authentication/shape-02.png"
              alt="Shape"
            />
          </div>
        </div>
        <div className="container">
          <div className="login-content user-login">
            <div className="login-logo">
              <ImageWithBasePath
                src="assets/img/logo.svg"
                className="img-fluid"
                alt="Logo"
              />
            </div>
            <form>
              <div className="login-user-info login-user-inner">
                <div className="login-heading text-center">
                  <p className="welcome-content">Welcome back!</p>
                  <div className="lock-screen-profile">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-14.jpg"
                      className="img-fluid"
                      alt="Profile"
                    />
                    <h6>Adrian Davies</h6>
                  </div>
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Enter Password</label>
                  <div className="pass-group">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      className="pass-input form-control"
                    />
                    <span
                      className={`ti toggle-password ${
                        isPasswordVisible ? "ti-eye" : "ti-eye-off"
                      }`}
                      onClick={togglePasswordVisibility}
                    ></span>
                  </div>
                </div>
                <div className="form-wrap mb-0">
                  <Link to={route.dealsDashboard} className="btn btn-primary">
                    Log In
                  </Link>
                </div>
              </div>
            </form>
          </div>
          <div className="lock-screen-list">
            <ul className="nav">
              <li>
                <Link to="#">Terms &amp; Condition</Link>
              </li>
              <li>
                <Link to="#">Privacy</Link>
              </li>
              <li>
                <Link to="#">Help</Link>
              </li>
              <li>
                <div className="language-dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    English
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end">
                    <Link to="#" className="dropdown-item">
                      American
                    </Link>
                    <Link to="#" className="dropdown-item">
                      British
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
            <div className="copyright-text">
              <p>Copyright ©2024 - CRMS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
