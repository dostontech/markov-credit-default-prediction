import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type State = "G" | "D" | "F" | "R";

const states: State[] = ["G", "D", "F", "R"];

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<number>(12);
  const [chartData, setChartData] = useState<{ state: State; count: number }[]>([]);
  const [results, setResults] = useState<{ customer: string; finalState: State }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith(".csv") && !selected.name.endsWith(".txt")) {
      alert("Only .csv and .txt files are allowed.");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a valid file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("steps", steps.toString());

    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/simulate-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      const formatted = states.map((s) => ({
        state: s,
        count: data.summary[s] || 0,
      }));

      setChartData(formatted);
      setResults(data.results || []);
    } catch (error) {
      alert("Simulation failed.");
      console.error(error);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const header = "CustomerID,FinalState\n";
    const rows = results.map((r) => `${r.customer},${r.finalState}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "simulation_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>📊 Credit Default State Simulation</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept=".csv,.txt" onChange={handleFileChange} />
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(Number(e.target.value))}
          min={1}
          max={60}
          style={{ marginLeft: 10, width: 60 }}
        />
        <button onClick={handleUpload} style={{ marginLeft: 10 }}>
          {loading ? "Simulating..." : "Upload & Simulate"}
        </button>
        {results.length > 0 && (
          <button onClick={handleExportCSV} style={{ marginLeft: 10 }}>
            Export CSV
          </button>
        )}
      </div>

      {chartData.length > 0 && (
        <>
          <h2>📈 Final State Summary</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0074D9" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {results.length > 0 && (
        <>
          <h2>📋 Customer-Level Results</h2>
          <table border={1} cellPadding={6} style={{ width: "100%", marginTop: 20 }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Final State</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={index}>
                  <td>{row.customer}</td>
                  <td>{row.finalState}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default App;
