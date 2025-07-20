import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// POST /:userId/games/:gameId/setscore
router.post("/:userId/games/:gameId/setscore", async (req: Request, res: Response) => {
  try {
    const { userId, gameId } = req.params;
    const { game_name, highscore, first_name, last_name } = req.body;

    // Validate required fields
    if (!highscore || !game_name) {
      return res.status(400).json({ 
        error: "Missing required fields: highscore and game_name" 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Use upsert to either create new score or update existing one
    const gameScore = await prisma.gameScore.upsert({
      where: {
        userId_gameId: {
          userId: userId,
          gameId: gameId
        }
      },
      update: {
        highscore: parseInt(highscore),
        gameName: game_name,
        timestamp: new Date()
      },
      create: {
        userId: userId,
        gameId: gameId,
        gameName: game_name,
        highscore: parseInt(highscore),
        timestamp: new Date()
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Format response to match your current structure
    const responseData = {
      user_id: gameScore.userId,
      game_id: gameScore.gameId,
      game_name: gameScore.gameName,
      timestamp: gameScore.timestamp,
      highscore: gameScore.highscore,
      first_name: gameScore.user.firstName,
      last_name: gameScore.user.lastName
    };

    res.status(201).json({ 
      message: "Score set successfully", 
      data: responseData 
    });

  } catch (error) {
    console.error("Error setting game score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /games/:gameId/getallscores
router.get("/games/:gameId/getallscores", async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    // Fetch all scores for the specific game
    const gameScores = await prisma.gameScore.findMany({
      where: {
        gameId: gameId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        highscore: 'desc' // Order by highest score first
      }
    });

    // Format response to match your current JSON structure
    const formattedScores: { [userId: string]: any } = {};
    
    gameScores.forEach(score => {
      formattedScores[score.userId] = {
        user_id: score.userId,
        game_id: score.gameId,
        game_name: score.gameName,
        timestamp: score.timestamp,
        highscore: score.highscore,
        first_name: score.user.firstName,
        last_name: score.user.lastName
      };
    });

    res.json({ scores: formattedScores });

  } catch (error) {
    console.error("Error fetching game scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /games/:gameId/leaderboard - Bonus: Get leaderboard for a game
router.get("/games/:gameId/leaderboard", async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await prisma.gameScore.findMany({
      where: {
        gameId: gameId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        highscore: 'desc'
      },
      take: limit
    });

    const formattedLeaderboard = leaderboard.map((score, index) => ({
      rank: index + 1,
      user_id: score.userId,
      game_id: score.gameId,
      game_name: score.gameName,
      highscore: score.highscore,
      timestamp: score.timestamp,
      user: {
        first_name: score.user.firstName,
        last_name: score.user.lastName,
        profile_image: score.user.profileImage
      }
    }));

    res.json({ leaderboard: formattedLeaderboard });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /users/:userId/scores - Get all scores for a specific user
router.get("/users/:userId/scores", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userScores = await prisma.gameScore.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedScores = userScores.map((score: { userId: any; gameId: any; gameName: any; timestamp: any; highscore: any; user: { firstName: any; lastName: any; }; }) => ({
      user_id: score.userId,
      game_id: score.gameId,
      game_name: score.gameName,
      timestamp: score.timestamp,
      highscore: score.highscore,
      first_name: score.user.firstName,
      last_name: score.user.lastName
    }));

    res.json({ scores: formattedScores });

  } catch (error) {
    console.error("Error fetching user scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const gameScoreRoutes = router;