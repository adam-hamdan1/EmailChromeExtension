const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to run the Python script
app.post('/run-python', (req, res) => {
    const { sender_email, label_name } = req.body;

    if (!sender_email || !label_name) {
        return res.status(400).send('Both sender_email and label_name are required.');
    }

    // Pass the arguments to the Python script
    const pythonProcess = spawn('python', ['sort.py', sender_email, label_name]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.json({ output });
        } else {
            res.status(500).json({ error: errorOutput || 'Error running script' });
        }
    });
});



// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
