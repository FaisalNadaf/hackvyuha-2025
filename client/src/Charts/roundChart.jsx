/** @format */

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

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
import { useParams } from "react-router";

const chartConfig = {
	visitors: {
		label: "Visitors",
	},
	chrome: {
		label: "Chrome",
		color: "hsl(var(--chart-1))",
	},
	safari: {
		label: "Safari",
		color: "hsl(var(--chart-2))",
	},
	firefox: {
		label: "Firefox",
		color: "hsl(var(--chart-3))",
	},
	edge: {
		label: "Edge",
		color: "hsl(var(--chart-4))",
	},
	other: {
		label: "Other",
		color: "hsl(var(--chart-5))",
	},
};

export function DataChart() {
	const [data, setData] = useState({
		total_zone_times: {
			desk1: 0,
			desk2: 0,
			meeting: 0,
			break: 0,
			movement_times: 0,
		},
	});

	const chartData = [
		{
			browser: "meeting",
			visitors: data.total_zone_times.meeting,
			fill: "#00CCE8",
		},
		{
			browser: "break",
			visitors: data.total_zone_times.break,
			fill: "#5D91A7",
		},
		{
			browser: "movement",
			visitors: data.total_zone_times.movement_times,
			fill: "#94A9CF",
		},
	];
	const [totalVisitors, setTotalVisitors] = useState(0);

	useEffect(() => {
		const total = chartData.reduce((acc, curr) => acc + curr.visitors, 0);
		setTotalVisitors(total);
	}, [chartData]);

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
	console.log(data);

	return (
		<Card
			className="flex flex-col"
			style={{
				background:
					"linear-gradient(to bottom left, rgb(227, 181, 227), #97b8ef)",
			}}>
			<CardHeader className="items-center pb-0">
				{/* <CardTitle>Pie Chart - Donut with Text</CardTitle> */}
				<CardDescription>May-18 - May-19 2025</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[250px]">
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={chartData}
							dataKey="visitors"
							nameKey="browser"
							innerRadius={60}
							strokeWidth={5}>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle">
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-3xl font-bold">
													{(totalVisitors / 60).toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground">
													Minutes
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				<div className="flex items-center gap-2 font-medium leading-none">
					Productivy Rate <TrendingUp className="h-4 w-4" />
				</div>
			</CardFooter>
		</Card>
	);
}
