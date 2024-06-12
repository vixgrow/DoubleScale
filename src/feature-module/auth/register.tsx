import React, { useState } from "react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";

const Register = () => {
  const route = all_routes;
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };
  return (
    <div className="account-content">
      <div className="login-wrapper account-bg register-bg">
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
                <h4>Register</h4>
                <p>Create new CRMS account</p>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Name</label>
                <div className="form-wrap-icon">
                  <input type="text" className="form-control" />
                  <i className="ti ti-user" />
                </div>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Email Address</label>
                <div className="form-wrap-icon">
                  <input type="text" className="form-control" />
                  <i className="ti ti-mail" />
                </div>
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
              <div className="form-wrap form-wrap-checkbox">
                <div className="custom-control custom-checkbox">
                  <label className="check">
                    <input type="checkbox" />
                    <span className="box" />I agree to the{" "}
                    <Link to="#" className="forgot-link ms-1">
                      Terms &amp; Privacy
                    </Link>
                  </label>
                </div>
              </div>
              <div className="form-wrap">
                <Link to={route.login} className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
              <div className="login-form">
                <h6>
                  Already have an account?
                  <Link to={route.login} className="hover-a">
                    {" "}
                    Sign In Instead
                  </Link>
                </h6>
              </div>
              <div className="form-set-login or-text">
                <h4>OR</h4>
              </div>
              <div className="login-social-link">
                <ul className="nav">
                  <li>
                    <Link to="#" className="facebook-logo">
                      <ImageWithBasePath
                        src="assets/img/icons/facebook-logo.svg"
                        alt="Facebook"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <ImageWithBasePath
                        src="assets/img/icons/google-logo.svg"
                        alt="Google"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="apple-logo">
                      <ImageWithBasePath
                        src="assets/img/icons/apple-logo.svg"
                        alt="Apple"
                      />
                    </Link>
                  </li>
                </ul>
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

export default Register;
