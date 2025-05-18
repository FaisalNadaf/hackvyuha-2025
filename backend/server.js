/** @format */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const { User } = require("./model/User");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// MongoDB Connection
mongoose
	.connect("mongodb://localhost:27017/productivity", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("✅ Connected to MongoDB"))
	.catch((err) => console.error("❌ MongoDB connection error:", err));

// Mongoose Schema & Model
const zoneTimesSchema = new mongoose.Schema(
	{
		desk1: { type: Number, default: 0 },
		desk2: { type: Number, default: 0 },
		meeting: { type: Number, default: 0 },
		break: { type: Number, default: 0 },
	},
	{ _id: false },
);

const productivitySchema = new mongoose.Schema({
	person_id: { type: String, required: true },
	zone_times: { type: zoneTimesSchema, required: true },
	movement_times: { type: Number, default: 0 },
	timestamp: { type: Date, default: Date.now },
});

productivitySchema.index({ person_id: 1 });

const Productivity = mongoose.model(
	"Productivity",
	productivitySchema,
	"person_logs",
);

// ROUTES

// Route 1: Get all unique person_ids
// app.get("/api/persons", async (req, res) => {
// 	try {
// 		const persons = await Productivity.distinct("_id").lean();

// 		if (!persons.length) {
// 			return res.status(404).json({ error: "No persons found" });
// 		}

// 		console.log(persons);
// 		res.json({ persons });
// 	} catch (err) {
// 		res.status(500).json({ error: "Failed to fetch persons" });
// 	}
// });

// Route 1: Get all persons with grouped productivity data
app.get("/api/persons", async (req, res) => {
	try {
		const persons = await Productivity.aggregate([
			{
				$group: {
					_id: "$person_id",
					entries: { $push: "$$ROOT" },
					totalDesk1: { $sum: "$zone_times.desk1" },
					totalDesk2: { $sum: "$zone_times.desk2" },
					totalMeeting: { $sum: "$zone_times.meeting" },
					totalBreak: { $sum: "$zone_times.break" },
					totalMovement: { $sum: "$movement_times" },
				},
			},
			{
				$project: {
					person_id: "$_id",
					entries: 1,
					totalZoneTimes: {
						desk1: "$totalDesk1",
						desk2: "$totalDesk2",
						meeting: "$totalMeeting",
						break: "$totalBreak",
						movement_times: "$totalMovement",
					},
					_id: 0,
				},
			},
		]);

		if (!persons.length) {
			return res.status(404).json({ error: "No persons found" });
		}

		res.json({ persons });
	} catch (err) {
		console.error("Error fetching persons:", err);
		res.status(500).json({ error: "Failed to fetch persons" });
	}
});

// Route 2: Get aggregated zone times for all persons
app.get("/api/zones", async (req, res) => {
	try {
		const data = await Productivity.find({}).lean();
		const result = {};

		data.forEach((entry) => {
			const pid = entry._id.toString();
			if (!result[pid]) {
				result[pid] = {
					desk1: 0,
					desk2: 0,
					meeting: 0,
					break: 0,
					movement_times: 0,
				};
			}

			result[pid].desk1 += entry.zone_times.desk1;
			result[pid].desk2 += entry.zone_times.desk2;
			result[pid].meeting += entry.zone_times.meeting;
			result[pid].break += entry.zone_times.break;
			result[pid].movement_times += entry.movement_times;
		});

		res.json(result);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch zone data" });
	}
});

// Route 3: Get data for a specific person by person_id
app.get("/api/person/:id", async (req, res) => {
	const { id } = req.params;
	try {
		const entries = await Productivity.find({ _id: id })
			.sort({ timestamp: 1 })
			.lean();
		if (!entries.length) {
			return res.status(404).json({ error: "Person not found" });
		}

		const total = {
			desk1: 0,
			desk2: 0,
			meeting: 0,
			break: 0,
			movement_times: 0,
		};

		entries.forEach((entry) => {
			total.desk1 += entry.zone_times.desk1;
			total.desk2 += entry.zone_times.desk2;
			total.meeting += entry.zone_times.meeting;
			total.break += entry.zone_times.break;
			total.movement_times += entry.movement_times;
		});
		return res.status(200).json({
			person_id: id,
			total_zone_times: total,
			entries,
		});
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch person data" });
	}
});

// Route 4: Add a new productivity entry
// app.post("/api/productivity", async (req, res) => {
// 	try {
// 		const newEntry = new Productivity(req.body);
// 		await newEntry.save();
// 		res.status(201).json({ message: "Entry saved", entry: newEntry });
// 	} catch (err) {
// 		res.status(400).json({ error: "Invalid data", details: err.message });
// 	}
// });

app.post("/api/register", async (req, res) => {
	try {
		let { email, password } = req.body;

		//check if any field missingt
		if (!email || !password) {
			res.status(400).json({
				message: "Field is missing",
			});
		}
		//check if user allready have account
		const user = await User.findOne({ email });

		if (user) {
			return res.status(400).json({
				message: "User already has a account",
			});
		} else {
			//hash the password ->  secure password
			const salt = bcrypt.genSaltSync(10);
			const hashedPassword = bcrypt.hashSync(password, salt);

			//user authentication
			const token = jwt.sign({ email }, "supersecret", { expiresIn: "365d" });

			//create user in database
			await User.create({
				password: hashedPassword,
				email,
				token,
				role: "admin",
			});

			return res.status(200).json({
				message: "User created successfully",
			});
		}
	} catch (error) {
		console.log(error);
		res.status(400).json({
			message: "Internal server error",
		});
	}
});

app.post("/api/login", async (req, res) => {
	try {
		let { email, password } = req.body;

		//check all fields are there or not
		if (!email || !password) {
			return res.status(400).json({
				message: "Field is missing",
			});
		}
		//checking user having account
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({
				message: "User not Registered",
			});
		}
		const isPasswordMatched = bcrypt.compareSync(password, user.password);

		if (!isPasswordMatched) {
			return res.status(404).json({
				message: "Password is wrong",
			});
		}

		return res.status(200).json({
			message: "User loged in successfully",
			id: user._id,
			name: user.name,
			token: user.token,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			message: "Internal server error",
		});
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});
