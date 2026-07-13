import mongoose from 'mongoose';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import SalarySlip from '../models/SalarySlip.js';
import Announcement from '../models/Announcement.js';
import Department from '../models/Department.js';

export const initialUsers = [];

export const initialDepartments = [];

export const initialAttendance = [];

export const initialLeaves = [];

export const initialSalarySlips = [];

export const initialAnnouncements = [];

const todayStr = new Date().toISOString().split('T')[0];


export const connectDB = async () => {
  // Retrieve the MongoDB URI from environment variables (checking both MONGODB_URI and MONGO_URI)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  // If no URI is provided, log a warning and run the server in offline / local fallback mode
  if (!uri) {
    console.warn('⚠️ MONGODB_URI/MONGO_URI is not defined. Running in Local Fallback storage mode (session-based).');
    return false;
  }

  try {
    // Attempt to connect to the MongoDB instance using Mongoose
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // Seed default collections (departments, users, attendance, leaves, etc.) if they are empty
    await seedDatabase();
    return true;

  } catch (error) {
    // Catch and log any connection errors, allowing the app to fall back safely
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};

const seedDatabase = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'Admin' });
    if (adminCount === 0) {
      console.log('🌱 No Admin found in database. Seeding default Admin user...');
      const defaultAdmin = new User({
        id: 'EMP-1001',
        name: 'EMS Admin',
        email: 'admin@company.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
        role: 'Admin',
        password: 'adminpassword',
        department: 'HR Operations',
        designation: 'Operations Manager',
        joiningDate: 'June 01, 2026',
        contact: '+919999999999',
        address: 'Softwallet Corporate Office, India',
        gender: 'Male',
        dob: '1990-01-01',
        salary: 120000,
        bloodGroup: 'A+',
        status: 'Active',
        documents: []
      });
      await defaultAdmin.save();
      console.log('✅ Default Admin seeded successfully: admin@company.com / adminpassword');
    } else {
      console.log('ℹ️ Admin user already exists in database.');
    }
  } catch (err) {
    console.error('❌ Error in database initialization/seeding:', err);
  }
};
