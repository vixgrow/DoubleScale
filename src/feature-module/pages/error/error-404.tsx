import React from 'react'
import { all_routes } from '../../router/all_routes';
import { Link } from "react-router-dom";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';

const Error404 = () => {
  const route = all_routes;
  return (
    <div className="container">
        <div className="error-box">
          <div className="error-img">
            <ImageWithBasePath src="assets/img/authentication/error-404.png" className="img-fluid" alt="" />
          </div>
          <div className="error-content">
            <h3>Oops, something went wrong</h3>
            <p>Error 404 Page not found. Sorry the page you looking for doesn’t exist or has been moved</p>
            <Link to={route.dealsDashboard} className="btn btn-primary">
              <i className="ti ti-arrow-narrow-left" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
  )
}

export default Error404