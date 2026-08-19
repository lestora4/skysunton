require('dotenv').config();
console.log('From src/test-env.js:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);