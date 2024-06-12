import React from "react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";

const ComingSoon = () => {
  return (
    <div className="comming-soon">
      <div className="comming-shapes">
        <div className="comming-right-shape">
          <ImageWithBasePath
            src="assets/img/authentication/shape-03.png"
            alt="Shape"
          />
        </div>
        <div className="comming-left-shape">
          <ImageWithBasePath
            src="assets/img/authentication/shape-04.png"
            alt="Shape"
          />
        </div>
      </div>
      <div className="coming-soon-box">
        <div className="crms-logo">
          <ImageWithBasePath
            src="assets/img/icons/coming-icon.svg"
            alt="Coming Icon"
          />
        </div>
        <span>Our Website is</span>
        <h1>
          <span> COMING </span> SOON{" "}
        </h1>
        <p>
          Please check back later, We are working hard to get everything just
          right.
        </p>
        <ul className="coming-soon-timer">
          <li>
            <span className="days">54</span>days
          </li>
          <li className="seperate-dot">:</li>
          <li>
            <span className="hours">10</span>Hrs
          </li>
          <li className="seperate-dot">:</li>
          <li>
            <span className="minutes">47</span>Min
          </li>
          <li className="seperate-dot">:</li>
          <li>
            <span className="seconds">00</span>Sec
          </li>
        </ul>
        <div className="subscribe-form">
          <div className="form-wrap">
            <label className="col-form-label">Subscribe to get notified!</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter Your Email"
            />
            <Link to="#" className="btn btn-primary subscribe-btn">
              Subscribe
            </Link>
          </div>
        </div>
        <ul className="social-media-icons">
          <li>
            <Link to="#">
              <i className="fab fa-facebook-f" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="fab fa-instagram" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="fab fa-twitter" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="fab fa-pinterest-p" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="fab fa-linkedin" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ComingSoon;
