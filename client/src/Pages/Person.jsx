/** @format */

import React from "react";
import { DataChart } from "../Charts/roundChart";
import { LineChart } from "@/Charts/LineChart";
import { useEffect, useState } from "react";


const Person = () => {


	return (
		<div className="flex  w-full h-full items-center justify-center gap-4 p-10" 
			style={{
				background:
					"linear-gradient(to bottom left, rgb(227, 181, 227), #97b8ef)",
			}}
		>
			<div className="w-2/3 h-full">
				<LineChart />
			</div>
			<div className="w-1/3 h-full">
				<DataChart />
			</div>
		</div>
	);
};

export default Person;
