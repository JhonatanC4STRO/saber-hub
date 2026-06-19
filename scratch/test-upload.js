require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

async function testUpload() {
  const cloudName = cloudinary.config().cloud_name;
  const apiKey = cloudinary.config().api_key;
  const apiSecret = cloudinary.config().api_secret;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = 'saberhub-cursos';

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  // We need a dummy file to upload. Let's create a small temp file.
  const tempFile = 'scratch/temp-file.txt';
  fs.writeFileSync(tempFile, 'Hello Cloudinary!');

  // Now simulate a browser FormData upload using node-fetch or similar.
  // Since we are in Node.js, we can use standard fetch (built-in in newer Node versions) or we can use form-data package.
  // Let's use FormData from the global scope (available in Node 18+) or construct a boundary.
  const FormData = globalThis.FormData;
  if (!FormData) {
    console.error("FormData not available on this Node version.");
    return;
  }

  const fd = new FormData();
  // Read file as Blob
  const blob = new Blob([fs.readFileSync(tempFile)], { type: 'text/plain' });
  fd.append('file', blob, 'temp-file.txt');
  fd.append('api_key', apiKey);
  fd.append('timestamp', timestamp.toString());
  fd.append('signature', signature);
  fd.append('folder', folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

  console.log("Uploading to:", cloudinaryUrl);
  console.log("Params:", {
    api_key: apiKey,
    timestamp,
    signature,
    folder
  });

  try {
    const res = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: fd,
    });
    console.log("Status:", res.status, res.statusText);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Upload Error:", err);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

testUpload();
