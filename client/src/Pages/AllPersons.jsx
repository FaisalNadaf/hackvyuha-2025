/** @format */

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";
import videoClip from "../assets/evolution.mp4";

const AllPersons = () => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch(`http://localhost:5000/api/persons`);
			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}
			const json = await response.json();
			setData(json);
			setError(null);
		} catch (error) {
			console.error("Error fetching data:", error);
			setError("Failed to load data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	if (loading) return <div className="p-10">Loading...</div>;
	if (error) return <div className="p-10 text-red-500">{error}</div>;

	return (
		<div
			className="h-full w-screen p-10 pt-"
			style={{
				background:
					"linear-gradient(to bottom left, rgb(227, 181, 227), #97b8ef)",
			}}>
			<div className="h-36 w-screen"></div>
			{data?.persons?.map((person, index) => {
				console.log(person);
				return (
					<div className="px-20 flex rounded-lg shadow-lg w-[90%] h-20 m-6 items-center justify-between gap-4 p-10">
						<div>
							<Avatar className="h-14 w-14">
								<AvatarImage
									src={`https://avatar.iran.liara.run/public/${index + 1}`}
								/>
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
						</div>
						<div>Employee : {person.person_id}</div>

						<div className=" h-12">
							<video
								src={videoClip}
								className="h-full w-full bg-transparent"
								autoPlay
								muted
								loop></video>
						</div>

						<div>
							<NavLink to={`/person/${person.entries[0]._id}`}>
								<Button
									className="bg-[#ffffff]"
									variant="outline">
									Details <i className="fa-solid fa-square-chevron-right"></i>
								</Button>
							</NavLink>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default AllPersons;
