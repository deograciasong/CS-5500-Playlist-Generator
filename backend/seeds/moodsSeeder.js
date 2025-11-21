import mongoose from "mongoose";
import dotenv from "dotenv";
import { Mood } from "../src/models/index.js";

dotenv.config();

const defaultMoods = [
  {
    key: "happy",
    label: "Happy",
    defaults: {
      energyRange: [0.6, 1.0],
      brightnessRange: [0.6, 1.0],
      tempoRange: [120, 180]
    },
    icon: "😊",
    order: 1
  },
  {
    key: "sad",
    label: "Sad",
    defaults: {
      energyRange: [0.0, 0.4],
      brightnessRange: [0.0, 0.4],
      tempoRange: [60, 100]
    },
    icon: "😢",
    order: 2
  },
  {
    key: "energetic",
    label: "Energetic",
    defaults: {
      energyRange: [0.7, 1.0],
      brightnessRange: [0.5, 1.0],
      tempoRange: [140, 200]
    },
    icon: "⚡",
    order: 3
  },
  {
    key: "chill",
    label: "Chill",
    defaults: {
      energyRange: [0.0, 0.5],
      brightnessRange: [0.3, 0.7],
      tempoRange: [70, 120]
    },
    icon: "😌",
    order: 4
  },
  {
    key: "focus",
    label: "Focus",
    defaults: {
      energyRange: [0.3, 0.7],
      brightnessRange: [0.2, 0.6],
      tempoRange: [90, 130]
    },
    icon: "🎯",
    order: 5
  },
  {
    key: "party",
    label: "Party",
    defaults: {
      energyRange: [0.8, 1.0],
      brightnessRange: [0.7, 1.0],
      tempoRange: [120, 200]
    },
    icon: "🎉",
    order: 6
  }
];

async function seedMoods() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing moods
    await Mood.deleteMany({});
    console.log("Cleared existing moods");

    // Insert default moods
    const insertedMoods = await Mood.insertMany(defaultMoods);
    console.log(`Inserted ${insertedMoods.length} default moods`);

    console.log("Mood seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding moods:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMoods();
}

export { seedMoods, defaultMoods };
