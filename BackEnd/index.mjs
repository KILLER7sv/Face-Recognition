import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const bodyParser = require('body-parser');
const faceapi = require('face-api.js');
const cors = require('cors');
const {convert} = require('base64-to-tensor')
const serverless = require("serverless-http");
const AWS = require('aws-sdk');

const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client } = require("@aws-sdk/client-s3");
require('dotenv').config();

const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const credentials = new AWS.Credentials({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});

const s3 = new AWS.S3({ credentials: credentials, region: region });

const app = express();
// const PORT = 5000;

// app.use(bodyParser.json());
app.use(cors());

// Configure body parser
app.use(bodyParser.json());

// Serve static files (e.g., models)
app.use(express.static('public'));

// Load face recognition models
const { canvas, faceDetectionNet, faceDetectionOptions } = faceapi;

if (typeof window !== 'undefined') {
  // code that requires window object
  faceapi.env.monkeyPatch({ fetch: fetch.bind(window) });
}


const loadModels = async () => {
  console.log("Loading models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./public/models')
  await faceapi.nets.tinyFaceDetector.loadFromDisk('./public/models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./public/models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./public/models');
  console.log("Loaded models");
};

await loadModels();

// Register a user
app.post('/register', async (req, res) => {
  const imageBase64 = req.body.imageBase64;
  const base64Data = imageBase64.split(';base64,').pop();
  // Convert base64 image to buffer
  let imageBuffer = Buffer.from(base64Data, 'base64');  
  
  try {
    const img = convert(imageBase64)
    
    // Detect faces in the image
    const detection = await faceapi.detectSingleFace(img, faceDetectionOptions);
    if (!detection) {
      console.log("Face-not-detected")
      return res.status(400).json({ message: 'No face detected' });
    }
    // Save the image for future recognition
    console.log("face-Detected!")
    //upload to s3

    new Upload({
      client: new S3Client({
          credentials: {
              accessKeyId,
              secretAccessKey
          },
          region
      }),
      params: {
          ACL: 'public-read',
          Bucket,
          Key: `${Date.now().toString()}.jpeg`,
          Body: imageBuffer
      },
      tags: [], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
  })
  .done()
  .then(data => {
    res.status(200).send({ message: 'User registered successfully' });
  }).catch((err) => {
    console.log(err)
    res.status(500).send({ message: 'Internal server error' });
  })

    // fs.writeFileSync(`./public/users/user_${Date.now()}.jpeg`, imageBuffer);
    
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Login with face recognition
app.post('/login', async (req, res) => {
  const imageBase64 = req.body.imageBase64;
  const base64Data = imageBase64.split(';base64,').pop();
  // Convert base64 image to buffer
  let imageBuffer = Buffer.from(base64Data, 'base64');  
  try {
    const img = convert(imageBase64)
    const detection = await faceapi.detectSingleFace(img, faceDetectionOptions);

    if (!detection) {
      return res.status(400).send({ message: 'No face detected' });
    }
    const inputDescriptor = await faceapi.computeFaceDescriptor(img);

    // Compare the detected face with registered users
    // const users = fs.readdirSync('./public/users');
    const users = await fetchAllObjects();
    let matchFound = false;
    await Promise.all(users.map(async user => {
      // const registeredImg = await loadImage(`./public/users/${user}`);
      // const data = fs.readFileSync(`./public/users/${user}`)
      const data = user.data
      let registeredImg = Buffer.from(data, "binary").toString("base64")
      registeredImg = "data:image/jpeg;base64," + registeredImg
      const imgTensor = convert(registeredImg)
      
      const descriptors = await faceapi.computeFaceDescriptor(imgTensor);
      const faceMatcher = new faceapi.FaceMatcher(descriptors);
      const match = faceMatcher.findBestMatch(inputDescriptor);

      if (match.label !== 'unknown') {
        matchFound = true;
      }
      
    }));
    if (matchFound) {
      res.status(200).send({ message: 'Login successful' });
    } else {
      res.status(401).send({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

async function fetchAllObjects() {
  try {
    const objects = await s3.listObjects({ Bucket: Bucket }).promise();
    const objectDataArray = [];

    for (const object of objects.Contents) {
      const objectData = await fetchObject(object.Key);
      objectDataArray.push({ key: object.Key, data: objectData });
      console.log(`Fetched object: ${object.Key}`);
    }

    console.log("All objects fetched successfully.");
    return objectDataArray;
  } catch (err) {
    console.error("Error fetching objects:", err);
    return [];
  }
}

function fetchObject(key) {
  return new Promise((resolve, reject) => {
    const getObjectParams = {
      Bucket: Bucket,
      Key: key
    };

    s3.getObject(getObjectParams, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Body);
      }
    });
  });
}

// Start server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

export const handler = serverless(app);