const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// User Schema (inline to avoid model conflicts)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Alumni', 'Faculty', 'Institute_Admin', 'Employer', 'Super_Admin'],
    default: 'Student'
  },
  isVerified: { type: Boolean, default: false },
  graduationYear: { type: Number },
  department: { type: String },
  bio: { type: String },
  skills: [{ type: String }],
  profilePicture: { type: String },
  linkedIn: { type: String },
  twitter: { type: String },
  website: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Test users to seed
const testUsers = [
  {
    name: 'Student User',
    email: 'student@test.com',
    password: 'student123',
    role: 'Student',
    isVerified: true,
    graduationYear: 2026,
    department: 'Computer Science',
    bio: 'A passionate computer science student looking for mentorship and career opportunities.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python']
  },
  {
    name: 'Alumni User',
    email: 'alumni@test.com',
    password: 'alumni123',
    role: 'Alumni',
    isVerified: true,
    graduationYear: 2020,
    department: 'Computer Science',
    bio: 'Software Engineer at a top tech company. Happy to mentor students and share experiences.',
    skills: ['JavaScript', 'React', 'Node.js', 'AWS', 'MongoDB', 'System Design']
  },
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'Institute_Admin',
    isVerified: true,
    department: 'Administration',
    bio: 'Institute administrator managing the alumni portal.'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/legacylink';
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in logs
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully!\n');

    console.log('🌱 Seeding test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n========================================');
    console.log('🎉 Seeding completed successfully!');
    console.log('========================================\n');
    console.log('Test Credentials:');
    console.log('----------------------------------------');
    console.log('📚 STUDENT');
    console.log('   Email:    student@test.com');
    console.log('   Password: student123');
    console.log('----------------------------------------');
    console.log('🎓 ALUMNI');
    console.log('   Email:    alumni@test.com');
    console.log('   Password: alumni123');
    console.log('----------------------------------------');
    console.log('👑 ADMIN (Institute_Admin)');
    console.log('   Email:    admin@test.com');
    console.log('   Password: admin123');
    console.log('----------------------------------------\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('\n💡 Tip: Make sure your MongoDB is running.');
      console.error('   For local MongoDB: mongodb://localhost:27017/legacylink');
      console.error('   For Atlas: Check your cluster is active and IP is whitelisted.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed
seedUsers();
