/** @format */

import React from "react";
import { NavLink } from "react-router";

import { FColors } from "../constants/colors.js";
import { FButtonWidths, FSizes } from "../constants/sizes.js";
import AllPersons from "./AllPersons.jsx";

const Home = () => {
	return (
		<div className="h-screen w-screen flex items-center justify-center">
			<NavLink to="#">
				<AllPersons />
			</NavLink>
		</div>
	);
};

export default Home;
