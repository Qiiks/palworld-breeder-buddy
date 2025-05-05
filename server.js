const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


const app = express();
const port = 3001;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
})

// Configure CORS to allow requests from any origin
const corsOptions = {
  origin: '*',
};

const upload = multer({ storage: storage });
app.use(cors(corsOptions));
app.use(express.json());

app.post('/parse-save', upload.single('file'), (req, res) => {
  console.log('------------------------------------------------');
  console.log('Request received at /parse-save');
  console.log('------------------------------------------------');
  
  console.log('Starting request handler for /parse-save');
  try {
    if (req.fileValidationError) {
      console.error('Multer file validation error:', req.fileValidationError);
      console.log("------------------------------------------------");
      return res.status(400).send('File validation error.');
    }

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    console.log('File path:', filePath);
    const pythonScriptPath = path.join(__dirname, 'python_scripts', 'save_parser.py');
    console.log('Python script path:', pythonScriptPath);
    const command = `python3 ${pythonScriptPath} "${filePath}"`;
    console.log('Command:', command);

    const result = execSync(command, { encoding: 'utf-8' });
    console.log('Result:', result);
    fs.unlinkSync(filePath);
    res.send(result);

    console.log('Ending request handler for /parse-save');

    
  } catch (error) {
    console.error('An unexpected error occurred in /parse-save handler:');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('An unexpected error occurred.');
  }
  console.log('------------------------------------------------');
});
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
