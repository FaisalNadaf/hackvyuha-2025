/** @format */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, LayoutDashboard, Monitor } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { Close } from "@mui/icons-material";

const Sidebar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { setUser, setIsAuthenticated } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.clear();
		setUser(null);
		setIsAuthenticated(false);
		navigate("/login");
	};

	const styles = {
		sidebar: {
			position: "fixed",

			top: 0,
			left: isOpen ? 0 : "-220px",
			width: "180px",
			height: "100vh",
			background: "rgba(27, 42, 65, 0.2)",
			color: "white",
			transition: "left 0.3s ease",
			paddingTop: "60px",
			zIndex: 1000,
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			backdropFilter: "blur(16px) saturate(180%)",
			WebkitBackdropFilter: "blur(16px) saturate(180%)",
			borderRight: "1px solid rgba(255, 255, 255, 0.18)",
			// boxShadow: "2px 0 24px 0 rgba(0,0,0,0.12)",
		},
		nav: {
			display: "flex",
			flexDirection: "column",
			gap: "0px",
		},
		toggleBtn: {
			position: "fixed",
			top: "20px",
			left: isOpen ? "20px" : "20px",
			zIndex: 1100,
			background: "rgba(27, 42, 65, 0.3)",
			color: "white",
			padding: "6px 8px",
			borderRadius: "5px",
			cursor: "pointer",
			transition: "left 0.3s ease",
			display: "flex",
			alignItems: "center",
			border: "none",
			backdropFilter: "blur(8px)",
			WebkitBackdropFilter: "blur(8px)",
			boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
		},
		navItem: {
			padding: "15px 20px",
			display: "flex",
			alignItems: "center",
			gap: "10px",
			textDecoration: "none",
			color: "black",
			fontSize: "16px",
			cursor: "pointer",
			borderRadius: "8px",
			transition: "background 0.2s",
		},
		navItemHover: {
			backgroundColor: "rgba(42, 60, 89, 0.5)",
		},
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(!isOpen)}
				style={styles.toggleBtn}>
				{!isOpen ? <Menu size={20} /> : <Close />}
			</button>

			<div style={styles.sidebar}>
				<div style={styles.nav}>
					<Link
						to="/"
						style={styles.navItem}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link
						to="#"
						onClick={() => {}}
						style={styles.navItem}>
						<Monitor size={18} /> Monitoring
					</Link>
				</div>
				<div
					onClick={handleLogout}
					style={styles.navItem}>
					<LogOut size={18} /> Logout
				</div>
			</div>
		</>
	);
};

export default Sidebar;
