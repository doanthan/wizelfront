#!/usr/bin/env node

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Load environment variables first
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function createUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    const email = 'doanthan@gmail.com';
    const plainPassword = '123123123';
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      console.log('⚠️  User with email', email, 'already exists');
      console.log('Existing user details:', {
        id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        createdAt: existingUser.createdAt
      });
      return;
    }
    
    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Create user document
    const user = {
      email: email,
      password: hashedPassword,
      name: 'Doan Than',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      stores: ['store1', 'store2', 'store3', 'store4', 'store5'],
      permissions: {
        stores: ['view', 'create', 'edit', 'delete', 'manage'],
        calendar: ['view', 'create', 'edit', 'delete'],
        dashboard: ['view', 'edit'],
        email_builder: ['view', 'create', 'edit', 'delete'],
        multi_account: ['view', 'create', 'edit', 'delete'],
        account_reports: ['view', 'create', 'edit'],
        permissions: ['view', 'manage']
      }
    };
    
    // Insert the user
    console.log('Inserting user into database...');
    const result = await usersCollection.insertOne(user);
    
    console.log('✅ User created successfully!');
    console.log('User details:', {
      id: result.insertedId,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
    console.log('\n📧 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', plainPassword);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
createUser().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});