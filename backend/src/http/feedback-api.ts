/**
 * Feedback API HTTP Routes
 * 
 * REST endpoints for AI service polling integration.
 * These endpoints are used by the AI moderation service to:
 * 1. Fetch unmoderated comments
 * 2. Batch update moderation results
 */

import type { Request, Response } from "express";
import { feedbackService } from "`../services/feedback.service.js";

/**
 * GET /api/feedback/unmoderated
 * Returns comments that haven't been moderated yet
 */
export async function getUnmoderatedComments(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await feedbackService.getUnmoderatedComments(limit);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching unmoderated comments:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch unmoderated comments" });
  }
}

/**
 * POST /api/feedback/batch-moderation
 * Updates multiple comments with their moderation results
 */
export async function batchUpdateModeration(req: Request, res: Response) {
  try {
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Invalid request body - results array required" });
    }

    const updateResult = await feedbackService.batchUpdateModeration(results);
    return res.status(200).json(updateResult);
  } catch (err: any) {
    console.error("Error updating moderation results:", err);
    return res.status(500).json({ error: err.message || "Failed to update moderation results" });
  }
}
