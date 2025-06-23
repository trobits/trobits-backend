import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// Path to the temporary JSON file
const tempFilePath = path.join(__dirname, "gameScores.json");

// Helper to read scores
function readScores() {
  if (!fs.existsSync(tempFilePath)) return {};
  const data = fs.readFileSync(tempFilePath, "utf-8");
  return data ? JSON.parse(data) : {};
}

// Helper to write scores
function writeScores(scores: any) {
  fs.writeFileSync(tempFilePath, JSON.stringify(scores, null, 2));
}

// POST /:userId/games/:gameId/setscore
router.post("/:userId/games/:gameId/setscore", (req: Request, res: Response) => {
  const { userId, gameId } = req.params;
  const body = req.body;
  const scores = readScores();
  if (!scores[gameId]) scores[gameId] = {};
  // Always set/overwrite the user's score for this game
  scores[gameId][userId] = body;
  writeScores(scores);
  res.status(201).json({ message: "Score set successfully", data: body });
});

// GET /games/:gameId/getallscores
router.get("/games/:gameId/getallscores", (req: Request, res: Response) => {
  const { gameId } = req.params;
  const scores = readScores();
  const data = scores[gameId] || {};
  res.json({ scores: data });
});

export const gameScoreRoutes = router;
