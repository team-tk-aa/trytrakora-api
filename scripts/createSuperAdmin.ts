import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    const email = "mymail1410@email.com";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("Superadmin already exists");
      process.exit(0);
    }

    await User.create({
      email,
      passwordHash: "123456", // will be hashed by model
      role: "superadmin",
      // NO gymId
    });

    console.log("Superadmin created successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createSuperAdmin();

//how to run this script:
// npm run create:superadmin