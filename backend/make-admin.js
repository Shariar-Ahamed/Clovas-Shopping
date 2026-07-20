const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('Error: Please provide an email address. Example: node make-admin.js user@example.com');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.error(`Error: User with email "${email}" not found in database.`);
      console.log('Please register or log in on the website first so your profile is created in MongoDB!');
      process.exit(1);
    }
    user.role = 'admin';
    await user.save();
    console.log(`\n==============================================`);
    console.log(`SUCCESS: User "${email}" is now an ADMIN!`);
    console.log(`==============================================\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
