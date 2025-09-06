import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyUser() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log('\n✅ User found:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  ID:', user._id);
    console.log('  Role:', user.role);
    console.log('  Is Active:', user.isActive !== false);
    console.log('  Has Password:', !!user.password);
    
    // Test password
    const testPassword = '123123123';
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('\n🔐 Password Test:');
      console.log('  Testing password:', testPassword);
      console.log('  Password valid:', isValid);
      
      if (!isValid) {
        console.log('\n⚠️  Password does not match!');
        console.log('Let me reset the password for you...');
        
        // Reset password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        
        const result = await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log('✅ Password has been reset to: 123123123');
        }
      }
    } else {
      console.log('\n❌ User has no password set!');
      console.log('Setting password...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Password has been set to: 123123123');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Verifying user credentials...\n');
verifyUser();