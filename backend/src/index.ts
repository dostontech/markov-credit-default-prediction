import express from "express";
import cors from "cors";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 4000;

type State = "G" | "D" | "F" | "R";
const states: State[] = ["G", "D", "F", "R"];

// Transition probabilities: from G, D, F, R to others
const transitionMatrix: number[][] = [
    [0.85, 0.10, 0.03, 0.02], // From G
    [0.30, 0.50, 0.15, 0.05], // From D
    [0.00, 0.00, 0.90, 0.10], // From F
    [0.60, 0.10, 0.05, 0.25], // From R
];

app.use(cors());
app.use(express.json());

// Handle file upload
const upload = multer({ dest: "uploads/" });

// Simulate a single customer for given months
function simulateMarkov(start: State, steps: number): State {
    let currentIndex = states.indexOf(start);
    for (let i = 0; i < steps; i++) {
        const probabilities = transitionMatrix[currentIndex];
        const rand = Math.random();
        let cumulative = 0;

        for (let j = 0; j < probabilities.length; j++) {
            cumulative += probabilities[j];
            if (rand < cumulative) {
                currentIndex = j;
                break;
            }
        }
    }
    return states[currentIndex];
}

// API endpoint for file upload and simulation
app.post("/api/simulate-upload", upload.single("file"), (req, res) => {
    const filePath = path.resolve(req.file?.path || "");
    const steps = parseInt(req.body.steps || "12");

    const finalCounts: Record<State, number> = { G: 0, D: 0, F: 0, R: 0 };
    const results: { customer: string; finalState: State }[] = [];

    fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (row: { CustomerID: string; CurrentState: State }) => {
            const { CustomerID, CurrentState } = row;
            if (!states.includes(CurrentState)) return;
            const final = simulateMarkov(CurrentState, steps);
            finalCounts[final]++;
            results.push({ customer: CustomerID, finalState: final });
        })
        .on("end", () => {
            fs.unlinkSync(filePath); // delete temp file
            res.json({ summary: finalCounts, results });
        })
        .on("error", (err) => {
            res.status(500).json({ error: "Error parsing CSV", details: err.message });
        });
});

app.listen(PORT, () => {
    console.log(`✅ Markov Credit API running at http://localhost:${PORT}`);
});
