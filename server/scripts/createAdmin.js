
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const User = require("../models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = async (question) => {
  return (await rl.question(question)).trim();
};

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("\nConnected to MongoDB.");

    const existingAdmin = await User.countDocuments({
      role: "admin",
    });

    if (existingAdmin > 0) {
      console.log("An administrator already exists.");
      console.log("Admin setup stopped for security.");
      return;
    }

    console.log("\nCreate your first administrator account.");

    const firstName = await ask("First name: ");
    const lastName = await ask("Last name: ");
    const email = (await ask("Email address: ")).toLowerCase();

    if (!firstName || !lastName) {
      throw new Error("First name and last name are required.");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("This email already belongs to an account.");
    }

    const password = await ask(
      "Password (minimum 12 characters): "
    );

    if (
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error(
        "Password must contain at least 12 characters and cannot exceed 72 UTF-8 bytes."
      );
    }

    const confirmPassword = await ask("Confirm password: ");

    if (password !== confirmPassword) {
      throw new Error("The passwords do not match.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("\nAdministrator account created successfully!");
    console.log("Name:", `${admin.firstName} ${admin.lastName}`);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);

  } catch (error) {
    console.error("\nAdmin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("\nMongoDB connection closed.");
    }
  }
};

createAdmin();
