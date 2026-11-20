
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUp,
} from "lucide-react";

import logo from "../assets/jbells-logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">

        <div className="footer-brand-section">
          <Link to="/" className="footer-brand">
            <img src={logo} alt="JBELLS Logo" />
          </Link>

          <h3>Style that speaks for you.</h3>

          <p>
            Discover quality male and unisex clothing designed
            to bring together style, comfort and confidence.
          </p>

          <p className="footer-tagline">
            STYLE. COMFORT. CONFIDENCE.
          </p>
        </div>

        <div className="footer-column">
          <h4>SHOP</h4>
          <Link to="/shop">Shop All</Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/account">My Account</Link>
        </div>

        <div className="footer-column">
          <h4>INFORMATION</h4>
          <Link to="/about">About JBELLS</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
        </div>

        <div className="footer-column footer-contact">
          <h4>CONTACT US</h4>

          <p>
            <Phone size={15} />
            <a href="tel:08105056702">08105056702</a>
          </p>

          <p>
            <Mail size={15} />
            <a href="mailto:Jbellscreations@gmail.com">
              Jbellscreations@gmail.com
            </a>
          </p>

          <p>
            <MapPin size={15} />
            <span>
              No. 1 Gaeron Crescent, Dawaki News Engineering,
              FCT Abuja, Nigeria.
            </span>
          </p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} JBELLS. All rights reserved.
        </p>

        <p>Designed for style. Made for confidence.</p>

        <Link to="/" className="footer-back-top">
          BACK TO TOP <ArrowUp size={13} />
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
