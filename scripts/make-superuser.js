// Script to make a user a superuser
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  is_super_user: Boolean,
  super_admin: Boolean
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function makeSuperUser(email) {
  await connectDB();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    // Update user to be super admin
    user.is_super_user = true;
    user.super_admin = true;
    await user.save();

    console.log(`✅ Successfully made ${email} a super admin`);
    console.log('User details:', {
      id: user._id.toString(),
      email: user.email,
      is_super_user: user.is_super_user,
      super_admin: user.super_admin
    });

  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-superuser.js <email>');
  console.log('Example: node scripts/make-superuser.js doanthan@gmail.com');
  process.exit(1);
}

makeSuperUser(email);