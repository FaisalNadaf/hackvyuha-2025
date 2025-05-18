/** @format */

"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

function splitNumberIntoParts(num, partsCount = 5) {
	const parts = [];
	let remaining = num;

	for (let i = 0; i < partsCount - 1; i++) {
		const max = remaining - (partsCount - i - 1); // leave space for rest
		const val = Math.floor(Math.random() * max) + 1;
		parts.push(val);
		remaining -= val;
	}

	parts.push(remaining); // last part gets the remaining sum
	return parts;
}

const result = splitNumberIntoParts(100); // e.g., [15, 8, 14, 21, 9, 33]
// console.log(result);

export function LineChart() {
	const [data, setData] = useState({
		total_zone_times: {
			desk1: 0,
			desk2: 0,
			meeting: 0,
			break: 0,
			movement_times: 0,
		},
	});
	const brk = splitNumberIntoParts(data.total_zone_times.break);
	const mov = splitNumberIntoParts(data.total_zone_times.movement_times);

	const chartData = [
		{ Day: "January", movement: mov[0], break: brk[0] },
		{ Day: "February", movement: mov[1], break: brk[1] },
		{ Day: "March", movement: mov[2], break: brk[2] },
		{ Day: "April", movement: mov[3], break: brk[3] },
		{ Day: "May", movement: mov[4], break: brk[4] },
	];

	const chartConfig = {
		movement: {
			label: "Movement",
			color: "#5D91A7",
		},
		break: {
			label: "Break",
			color: "#94A9CF",
		},
	};

	const { personId } = useParams();
	const [loading, setLoading] = useState(true);

	const [error, setError] = useState(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`http://localhost:5000/api/person/${personId}`,
			);
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
		if (personId) fetchData();
	}, [personId]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	// console.log("Fetched Data:", data);
	// console.log(data);

	return (
		<Card  
			style={{
				background:
					"linear-gradient(to bottom left, rgb(227, 181, 227), #97b8ef)",
			}}>
			<CardHeader>
				<CardTitle>PERSON : {data.entries[0].person_id}</CardTitle>
				<CardDescription>PERSON ID : {personId}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 12,
							right: 12,
						}}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" />}
						/>
						<Area
							dataKey="break"
							type="natural"
							fill="#94A9CF"
							fillOpacity={0.4}
							stroke="#94A9CF"
							stackId="a"
						/>
						<Area
							dataKey="movement"
							type="natural"
							fill="#5D91A7"
							fillOpacity={0.4}
							stroke="#5D91A7"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
			{/* <CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 font-medium leading-none">
							Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
						</div>
						<div className="flex items-center gap-2 leading-none text-muted-foreground">
							January - June 2024
						</div>
					</div>
				</div>
			</CardFooter> */}
		</Card>
	);
}
