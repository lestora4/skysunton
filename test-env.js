require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);