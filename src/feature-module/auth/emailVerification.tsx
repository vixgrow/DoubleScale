import React from "react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from 'react-router-dom'
import { all_routes } from "../router/all_routes";

const EmailVerification = () => {
  const route = all_routes;

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
              <div className="login-heading text-center">
                <h4>Verify Your Email</h4>
                <p>
                  We've sent a link to your email ter4@example.com. Please
                  follow the link inside to continue
                </p>
              </div>
              <div className="login-form text-center">
                <h6>
                  Didn't receive an email?{" "}
                  <Link to="#" className="hover-a">
                    Resend Link
                  </Link>
                </h6>
              </div>
              <div className="form-wrap">
                <Link to={route.dealsDashboard} className="btn btn-primary">
                  Skip Now
                </Link>
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

export default EmailVerification;
