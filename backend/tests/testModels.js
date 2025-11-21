import mongoose from "mongoose";
import dotenv from "dotenv";
import * as Models from "../models/index.js";

dotenv.config();

async function testModels() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test each model by getting its collection info
    const modelNames = Object.keys(Models);
    console.log(`\n📋 Testing ${modelNames.length} models:`);
    
    for (const modelName of modelNames) {
      const Model = Models[modelName];
      const collectionName = Model.collection.name;
      const count = await Model.countDocuments();
      console.log(`✅ ${modelName} -> Collection: ${collectionName} (${count} documents)`);
    }

    console.log("\n🎯 All models are properly defined and accessible!");
    
    // Test creating a mood document
    const testMood = new Models.Mood({
      key: "test_mood",
      label: "Test Mood",
      defaults: {
        energyRange: [0.5, 0.8],
        brightnessRange: [0.4, 0.7],
        tempoRange: [100, 140]
      },
      icon: "🧪",
      order: 999
    });

    console.log("\n📝 Testing model validation...");
    await testMood.validate();
    console.log("✅ Model validation passed");

    // Clean up test data
    await Models.Mood.deleteOne({ key: "test_mood" });
    
    console.log("\n🚀 Model testing completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing models:", error);
    process.exit(1);
  }
}

testModels();
