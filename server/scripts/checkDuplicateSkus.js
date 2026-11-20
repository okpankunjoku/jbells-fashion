require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/Product");

const checkDuplicateSkus = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB.");
    console.log("Checking for duplicate variant SKUs...\n");

    const duplicates = await Product.aggregate([
      {
        $unwind: "$variants",
      },
      {
        $project: {
          sku: {
            $toUpper: {
              $trim: {
                input: "$variants.sku",
              },
            },
          },
          productName: "$name",
          productId: "$_id",
        },
      },
      {
        $group: {
          _id: "$sku",
          count: { $sum: 1 },
          products: {
            $push: {
              name: "$productName",
              id: "$productId",
            },
          },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    if (duplicates.length === 0) {
      console.log("SUCCESS: No duplicate SKUs found.");
      console.log("Your existing products are ready for the uniqueness review.");
    } else {
      console.log("DUPLICATE SKUs FOUND:\n");

      duplicates.forEach((duplicate) => {
        console.log(`SKU: ${duplicate._id}`);
        console.log(`Number of occurrences: ${duplicate.count}`);

        duplicate.products.forEach((product) => {
          console.log(`- Product: ${product.name}`);
          console.log(`  Product ID: ${product.id}`);
        });

        console.log("------------------------------");
      });

      console.log(
        "\nPlease review these duplicates before creating a unique index."
      );
    }
  } catch (error) {
    console.error("SKU check failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

checkDuplicateSkus();