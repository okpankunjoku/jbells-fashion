
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const ShippingRate = require("../models/ShippingRate");
const shippingRates = require("../config/shippingRates");

const seedShippingRates = async () => {
  try {
    await connectDB();

    const operations = shippingRates.map((rate) => ({
      updateOne: {
        filter: { state: rate.state },
        update: {
          $setOnInsert: rate,
        },
        upsert: true,
      },
    }));

    const result = await ShippingRate.bulkWrite(operations);

    console.log("Shipping rate seeding completed successfully.");
    console.log(`Destinations configured: ${shippingRates.length}`);
    console.log(`New records inserted: ${result.upsertedCount}`);
    console.log("Existing shipping rates were preserved.");
  } catch (error) {
    console.error("Shipping rate seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
};

seedShippingRates();
