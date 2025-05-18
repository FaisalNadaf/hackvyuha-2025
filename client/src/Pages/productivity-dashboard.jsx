























































import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Activity, Calendar, Clock, BarChart2 } from "lucide-react";

// Dashboard to visualize productivity data
export default function ProductivityDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Hardcoded personId for demo - in a real app, you'd get this from useParams() or props
  const personId = "user123";

  // Colors for the charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real environment, this would be your actual API endpoint
        const response = await fetch(`/api/person/${personId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load productivity data. Please try again.");
        
        // For demo purposes only - load mock data when API fails
        // Remove this in production code
        setData({
          person_id: personId,
          total_zone_times: {
            desk1: 24300, // in seconds (6.75 hours)
            desk2: 10800, // in seconds (3 hours)
            meeting: 7200, // in seconds (2 hours)
            break: 3600, // in seconds (1 hour)
            movement_times: 45 // count of movements
          },
          entries: [
            {
              _id: "entry1",
              timestamp: "2025-05-18T08:00:00.000Z",
              zone_times: {
                desk1: 10800, // 3 hours
                desk2: 3600, // 1 hour
                meeting: 3600, // 1 hour
                break: 1800 // 30 minutes
              },
              movement_times: 15
            },
            {
              _id: "entry2",
              timestamp: "2025-05-17T08:00:00.000Z",
              zone_times: {
                desk1: 7200, // 2 hours
                desk2: 3600, // 1 hour
                meeting: 1800, // 30 minutes
                break: 900 // 15 minutes
              },
              movement_times: 12
            },
            {
              _id: "entry3",
              timestamp: "2025-05-16T08:00:00.000Z",
              zone_times: {
                desk1: 6300, // 1.75 hours
                desk2: 3600, // 1 hour
                meeting: 1800, // 30 minutes
                break: 900 // 15 minutes
              },
              movement_times: 18
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [personId]);

  // Function to convert seconds to hours:minutes format
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Prepare data for the pie chart
  const preparePieData = () => {
    if (!data) return [];
    
    const { total_zone_times } = data;
    return [
      { name: "Primary Desk", value: total_zone_times.desk1 },
      { name: "Secondary Desk", value: total_zone_times.desk2 },
      { name: "Meeting Area", value: total_zone_times.meeting },
      { name: "Break Area", value: total_zone_times.break }
    ];
  };

  // Prepare data for the daily comparison chart
  const prepareDailyData = () => {
    if (!data) return [];
    
    return data.entries.map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      return {
        date,
        desk1: entry.zone_times.desk1 / 3600, // Convert to hours
        desk2: entry.zone_times.desk2 / 3600,
        meeting: entry.zone_times.meeting / 3600,
        break: entry.zone_times.break / 3600,
        movements: entry.movement_times
      };
    }).reverse(); // Show oldest to newest
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">Loading productivity data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-red-500">{error}</div>
      </div>
    );
  }

  const pieData = preparePieData();
  const dailyData = prepareDailyData();
  
  // Calculate total tracked time
  const totalSeconds = data.total_zone_times.desk1 + 
                       data.total_zone_times.desk2 + 
                       data.total_zone_times.meeting + 
                       data.total_zone_times.break;
                       
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productivity Dashboard</h1>
        <p className="text-gray-600">Workspace analytics for user: {data.person_id}</p>
      </div>
      
      {/* Navigation tabs */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex items-center px-4 py-2 mr-4 ${activeTab === "overview" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          <BarChart2 className="mr-2 w-4 h-4" />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab("daily")}
          className={`flex items-center px-4 py-2 mr-4 ${activeTab === "daily" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          <Calendar className="mr-2 w-4 h-4" />
          Daily Analysis
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Primary Desk</h3>
              <p className="text-xl font-bold text-gray-800">{formatTime(data.total_zone_times.desk1)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Secondary Desk</h3>
              <p className="text-xl font-bold text-gray-800">{formatTime(data.total_zone_times.desk2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Meeting Area</h3>
              <p className="text-xl font-bold text-gray-800">{formatTime(data.total_zone_times.meeting)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Break Area</h3>
              <p className="text-xl font-bold text-gray-800">{formatTime(data.total_zone_times.break)}</p>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Total Tracked Time</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">{formatTime(totalSeconds)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Movement Count</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">{data.total_zone_times.movement_times}</p>
            </div>
          </div>
          
          {/* Time Distribution Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Time Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTime(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Daily Analysis Tab */}
      {activeTab === "daily" && (
        <div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Zone Time Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="desk1" name="Primary Desk" stackId="a" fill="#0088FE" />
                  <Bar dataKey="desk2" name="Secondary Desk" stackId="a" fill="#00C49F" />
                  <Bar dataKey="meeting" name="Meeting Area" stackId="a" fill="#FFBB28" />
                  <Bar dataKey="break" name="Break Area" stackId="a" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Movement Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="movements" name="Movements" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
