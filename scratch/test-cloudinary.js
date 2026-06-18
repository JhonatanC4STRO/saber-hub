require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

console.log("Cloudinary Config:");
console.log("Cloud Name:", cloudinary.config().cloud_name);
console.log("API Key:", cloudinary.config().api_key);
console.log("API Secret is present:", !!cloudinary.config().api_secret);

const timestamp = Math.round(new Date().getTime() / 1000);
const folder = 'saberhub-cursos';

const paramsToSign = {
  timestamp,
  folder,
};

try {
  const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);
  console.log("Generated Signature successfully:", signature);
} catch (err) {
  console.error("Error signing:", err);
}
