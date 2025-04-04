import React from "react";
import PropTypes from "prop-types";
import "./SideBanner.scss";

const SideBanner = ({ image, position }) => {
  return (
    <div className={`side-banner ${position}`}>
      <img src={image} alt={`${position} Banner`} />
    </div>
  );
};

SideBanner.propTypes = {
  image: PropTypes.string.isRequired,
  position: PropTypes.oneOf(["left-banner", "right-banner"]).isRequired,
};

export default SideBanner;
