import React from "react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from 'react-router-dom'
import { all_routes } from "../router/all_routes";

const ForgotPassword = () => {
  const route = all_routes;
  return (
    <div className="account-content">
      <div className="login-wrapper account-bg forgot-bg">
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
                <h4>Forgot Password?</h4>
                <p>
                  If you forgot your password, well, then we’ll email you
                  instructions to reset your password.
                </p>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Email Address</label>
                <div className="form-wrap-icon">
                  <input type="text" className="form-control" />
                  <i className="ti ti-mail" />
                </div>
              </div>
              <div className="form-wrap">
                <Link to={route.login} className="btn btn-primary">
                  Submit
                </Link>
              </div>
              <div className="login-form text-center">
                <h6>
                  Return to
                  <Link to={route.login} className="hover-a">
                    {" "}
                    Log In
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
                      <ImageWithBasePath src="assets/img/icons/apple-logo.svg" alt="Apple" />
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

export default ForgotPassword;
