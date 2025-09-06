#!/usr/bin/env node

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ email: 'doanthan@gmail.com' });
    
    if (user) {
      console.log('✅ User found in database!');
      console.log('\n📋 User Information:');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Created:', user.createdAt);
      console.log('Stores Access:', user.stores);
      console.log('Permissions:', JSON.stringify(user.permissions, null, 2));
      
      // Test password
      const testPassword = '123123123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('\n🔐 Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyUser();