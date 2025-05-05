const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;


// Configure CORS to allow requests from any origin
const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/parse-save', (req, res) => {
    console.log('------------------------------------------------');
    console.log('Request received at /parse-save');
    console.log('------------------------------------------------');


    console.log('Starting request handler for /parse-save');
    console.log(`Request has been received.`);
    try {
        console.log('Request has started');
        if (!req.body.file) {
          throw new Error('No file uploaded.');
        }

        const fileContent = Buffer.from(req.body.file, 'base64');


        const newFilename = `upload_${uuidv4()}`;
        const newFilePath = path.join('/tmp', newFilename);
        const pythonScriptPath = path.join(__dirname, 'python_scripts', 'save_parser.py');

        console.log('File Path from server:', newFilePath);

        fs.writeFileSync(newFilePath, fileContent)

        const command = `python3 ${pythonScriptPath} "${newFilePath}"`;
        console.log('Command to run:', command);

        const result = execSync(command, { encoding: 'utf-8' });

        // Log the result from the Python script before sending the response
        console.log("Python script output:", result);

        res.send(result);

        // Delete the temp file
        fs.unlink(newFilePath, (err) => {
            if (err) {
              console.error('Error deleting temp file:', err);
            } else {
              console.log('Temp file deleted successfully');
            }
          });
    }
   catch (error) {
        console.log('Error has been caught');
        res.status(500).send('Error has occurred');
        console.error('An unexpected error occurred in /parse-save handler:');
        console.error('Error:', error);
         console.error('Error stack:', error.stack);
    }
    console.log(`Request is now completed`)
    console.log('------------------------------------------------\n');
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
