import fs from "fs";
import path from "path";
import prisma from "../../../shared/prisma";

// Path to your existing JSON file
const jsonFilePath = path.join(__dirname, "gameScores.json");

interface GameScoreData {
  user_id: string;
  game_id: string;
  game_name: string;
  timestamp: string;
  highscore: number;
  first_name: string;
  last_name: string;
}

interface JsonStructure {
  [gameId: string]: {
    [userId: string]: GameScoreData;
  };
}

async function migrateJsonToDatabase() {
  try {
    // Check if JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.log("No gameScores.json file found. Nothing to migrate.");
      return;
    }

    // Read and parse JSON file
    const jsonData = fs.readFileSync(jsonFilePath, "utf-8");
    const scores: JsonStructure = JSON.parse(jsonData);

    console.log("Starting migration from JSON to database...");

    let migrationCount = 0;
    let errorCount = 0;

    // Iterate through each game
    for (const [gameId, gameScores] of Object.entries(scores)) {
      console.log(`\nMigrating scores for game: ${gameId}`);

      // Iterate through each user's score for this game
      for (const [userId, scoreData] of Object.entries(gameScores)) {
        try {
          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });

          if (!user) {
            console.log(`  ⚠️  User ${userId} not found in database. Skipping...`);
            errorCount++;
            continue;
          }

          // Create or update game score
          const gameScore = await prisma.gameScore.upsert({
            where: {
              userId_gameId: {
                userId: scoreData.user_id,
                gameId: scoreData.game_id
              }
            },
            update: {
              highscore: scoreData.highscore,
              gameName: scoreData.game_name,
              timestamp: new Date(scoreData.timestamp)
            },
            create: {
              userId: scoreData.user_id,
              gameId: scoreData.game_id,
              gameName: scoreData.game_name,
              highscore: scoreData.highscore,
              timestamp: new Date(scoreData.timestamp)
            }
          });

          console.log(`  ✅ Migrated score for user ${user.firstName} ${user.lastName}: ${scoreData.highscore}`);
          migrationCount++;

        } catch (error) {
          console.log(`  ❌ Error migrating score for user ${userId}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Successfully migrated: ${migrationCount} scores`);
    console.log(`   ❌ Errors encountered: ${errorCount} scores`);

    // Optionally backup and remove JSON file
    const backupPath = path.join(__dirname, `gameScores_backup_${Date.now()}.json`);
    fs.copyFileSync(jsonFilePath, backupPath);
    console.log(`   📁 JSON file backed up to: ${backupPath}`);
    
    // Uncomment the next line if you want to delete the original JSON file after migration
    // fs.unlinkSync(jsonFilePath);
    // console.log(`   🗑️  Original JSON file deleted`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateJsonToDatabase();
}

export { migrateJsonToDatabase };