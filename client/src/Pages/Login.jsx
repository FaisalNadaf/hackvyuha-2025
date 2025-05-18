/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../Context/AuthContext";
import logo from "../assets/logo.png";

const AdminLogin = () => {
	// const navigate = useNavigate();
	// const { setUser, setIsAuthenticated } = useAuth();

	// const [error, setError] = useState("");
	// const [loading, setLoading] = useState(false);

	// const handleSubmit = async (e) => {
	// 	e.preventDefault();
	// 	const formData = new FormData(e.currentTarget);
	// 	const email = formData.get("email");
	// 	const password = formData.get("password");

	// 	try {
	// 		setLoading(true);
	// 		setError("");
	// 		const user = await login({ email, password });

	// 		// Store auth and user
	// 		localStorage.setItem("user", JSON.stringify(user));
	// 		localStorage.setItem("isAuthenticated", true);
	// 		setUser(user);
	// 		setIsAuthenticated(true);

	// 		navigate("/");
	// 	} catch (err) {
	// 		setError("Invalid email or password");
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	const navigate = useNavigate();
	const { setUser, setIsAuthenticated } = useAuth();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const email = formData.get("email");
		const password = formData.get("password");

		try {
			setLoading(true);
			setError("");
			const user = await login({ email, password });
			localStorage.setItem("user", JSON.stringify(user));
			localStorage.setItem("isAuthenticatedd", true);
			navigate("/");
		} catch (err) {
			setError("Invalid email or password");
		} finally {
			setLoading(false);
		}
	}

	const styles = {
		wrapper: {
			margin: 0,
			fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
			background:
				"linear-gradient(to bottom left, rgb(227, 181, 227), #97b8ef)",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			height: "100vh",
		},
		container: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			background:
				"linear-gradient(to bottom right, rgb(227, 181, 227), #a2c6f3)",
			padding: "40px",
			borderRadius: "15px",
			boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
			width: "100%",
			maxWidth: "400px",
			textAlign: "center",
		},
		logo: {
			width: "200px",
			marginBottom: "20px",
			filter: "brightness(0)",
		},
		heading: {
			marginBottom: "30px",
			color: "#1b2a41",
		},
		input: {
			boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
			width: "100%",
			padding: "12px 15px",
			margin: "10px 0",
			border: "1px solid #ccc",
			borderRadius: "8px",
			boxSizing: "border-box",
			border: "none",
			backgroundColor: "transparent",
			outline: "none",
		},
		inputFocus: {
			outline: "none",
		},
		button: {
			width: "100%",
			padding: "12px",
			background:'#719ade',
			color: "white",
			border: "none",
			borderRadius: "8px",
			fontSize: "16px",
			cursor: "pointer",
			transition: "background-color 0.3s ease",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
		},
		buttonDisabled: {
			opacity: 0.5,
			cursor: "not-allowed",
		},
		error: {
			color: "red",
			fontSize: "14px",
			marginTop: "10px",
		},
	};

	return (
		<div style={styles.wrapper}>
			<div style={styles.container}>
				<img
					src={logo}
					alt="ASTUTE Logo"
					style={styles.logo}
				/>
				{/* <h2 style={styles.heading}>Admin Login</h2> */}

				<form onSubmit={handleSubmit}>
					<input
						type="email"
						name="email"
						placeholder="Admin Email"
						required
						style={styles.input}
					/>
					<input
						type="password"
						name="password"
						placeholder="Password"
						required
						style={styles.input}
					/>

					{error && <div style={styles.error}>{error}</div>}

					<button
						type="submit"
						style={{
							...styles.button,
							...(loading ? styles.buttonDisabled : {}),
						}}
						disabled={loading}>
						{loading ? "Signing in..." : "Login"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default AdminLogin;
