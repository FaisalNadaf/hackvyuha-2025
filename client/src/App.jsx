/** @format */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";

import Login from "./Pages/Login";
import Home from "./Pages/Home";
import Person from "./Pages/Person";
import Sidebar from "./Pages/Sidebar";

function PrivateRoute({ children }) {
	const { isAuthenticated } = useAuth();
	return localStorage.getItem("isAuthenticatedd") === "true" ? (
		<>
			<Sidebar />
			{children}
		</>
	) : (
		<Navigate to="/login" />
	);
}

function PublicRoute({ children }) {
	const { isAuthenticated } = useAuth();
	return localStorage.getItem("isAuthenticatedd") !== "true" ? (
		<>{children}</>
	) : (
		<Navigate to="/" />
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<PrivateRoute>
						<Home />
					</PrivateRoute>
				}
			/>
			<Route
				path="/person/:personId"
				element={
					<PrivateRoute>
						<Person />
					</PrivateRoute>
				}
			/>
			<Route
				path="/login"
				element={
					<PublicRoute>
						<Login />
					</PublicRoute>
				}
			/>
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
