
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const checkUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("\nMongoDB connected successfully.");

    const totalUsers = await User.countDocuments();

    console.log("\nTotal registered users:", totalUsers);

    if (totalUsers === 0) {
      console.log("No user accounts have been created yet.");
    } else {
      const users = await User.find()
        .select("firstName lastName email role isActive createdAt")
        .sort({ createdAt: -1 });

      console.log("\nRegistered accounts:");

      console.table(
        users.map((user) => ({
          Name: `${user.firstName} ${user.lastName}`,
          Email: user.email,
          Role: user.role,
          Active: user.isActive,
          Created: user.createdAt.toLocaleDateString(),
        }))
      );
    }
  } catch (error) {
    console.error("\nError checking users:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("\nMongoDB connection closed.");
    }
  }
};

checkUsers();
