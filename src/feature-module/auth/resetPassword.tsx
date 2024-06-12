import React, { useState } from "react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";

const ResetPassword = () => {
  const route = all_routes;
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };
  return (
    <div className="account-content">
      <div className="login-wrapper account-bg reset-bg">
        <div className="login-content">
          <form>
            <div className="login-user-info">
              <div className="login-logo">
                <ImageWithBasePath
                  src="assets/img/logo.svg"
                  className="img-fluid"
                  alt="Logo"
                />
              </div>
              <div className="login-heading">
                <h4>Reset Password?</h4>
                <p>Enter New Password &amp; Confirm Password to get inside</p>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Password</label>
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
              <div className="form-wrap">
                <label className="col-form-label">Confirm Password</label>
                <div className="pass-group">
                  <input type="password" className="pass-inputs form-control" />
                  <span className="ti toggle-passwords ti-eye-off" />
                </div>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">New Confirm Password</label>
                <div className="pass-group">
                  <input
                    type="password"
                    className="pass-input-new form-control"
                  />
                  <span className="ti toggle-password-new ti-eye-off" />
                </div>
              </div>
              <div className="form-wrap">
                <Link to={route.success} className="btn btn-primary">
                  Change Password
                </Link>
              </div>
              <div className="login-form text-center">
                <h6>
                  Return to{" "}
                  <Link to={route.login} className="hover-a">
                    Log In
                  </Link>
                </h6>
              </div>
              <div className="login-social-link">
                <div className="copyright-text">
                  <p>Copyright ©2024 - CRMS</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
