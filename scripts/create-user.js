import dotenv from 'dotenv';
import { UserModel } from '../lib/user-model.js';

// Load environment variables
dotenv.config();

async function createUser() {
  try {
    console.log('Creating new user...');
    
    const newUser = await UserModel.createUser({
      email: 'doanthan@gmail.com',
      password: '123123123',
      name: 'Doan Than',
      role: 'admin', // You can change this to 'user' if needed
      stores: ['store1', 'store2', 'store3', 'store4', 'store5'], // Access to all stores
      permissions: {
        stores: ['view', 'create', 'edit', 'delete', 'manage'],
        calendar: ['view', 'create', 'edit', 'delete'],
        dashboard: ['view', 'edit'],
        email_builder: ['view', 'create', 'edit', 'delete'],
        multi_account: ['view', 'create', 'edit', 'delete'],
        account_reports: ['view', 'create', 'edit'],
        permissions: ['view', 'manage']
      }
    });

    console.log('✅ User created successfully!');
    console.log('User details:', {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

// Run the function
createUser();