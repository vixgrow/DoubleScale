import React from 'react'
import ImageWithBasePath from '../../core/common/imageWithBasePath'
import { all_routes } from '../router/all_routes';
import { Link } from 'react-router-dom';

const TwoStepVerification = () => {
  const route = all_routes;
  return (
    <div className="account-content">
        <div className="login-wrapper account-bg reset-bg">
          <div className="login-content">
            <form method="get" className="digit-group login-form-control" data-group-name="digits" data-autosubmit="false" autoComplete="off">
              <div className="login-user-info">
                <div className="login-logo">
                  <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                </div>
                <div className="login-heading">
                  <h4>Login With Your Email Address</h4>
                  <p className="verfy-mail-content">We sent a verification code to your email. Enter the code from the email in the field below</p>
                </div>
                <div className="otp-box text-center">
                  <div className="form-wrap">
                    <input type="text" id="digit-1" name="digit-1" data-next="digit-2" maxLength={1} />
                    <input type="text" id="digit-2" name="digit-2" data-next="digit-3" data-previous="digit-1" maxLength={1} />
                    <input type="text" id="digit-3" name="digit-3" data-next="digit-4" data-previous="digit-2" maxLength={1} />
                    <input type="text" id="digit-4" name="digit-4" data-next="digit-5" data-previous="digit-3" maxLength={1} />
                  </div>
                </div>
                <div className="otp-expire">
                  <p>Otp will expire in 09 :10</p>
                </div>
                <div className="form-wrap">
                  <Link to={route.dealsDashboard} className="btn btn-primary">Verify My Account</Link>
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
  )
}

export default TwoStepVerification