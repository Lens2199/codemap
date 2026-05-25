import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { pool } from '../db/pool.js';

export async function createShare(req: Request<{ id: string }>, res: Response) {
  // Step 1: Read analysis_id from URL
  const analysisId = parseInt(req.params.id, 10);

  if (isNaN(analysisId)) {
    return res.status(400).json({
      error: 'Invalid analysis ID',
    });
  }

  try {
    // Step 2: Check the analysis exists AND belongs to this user
    const analysisResult = await pool.query(
      'SELECT id FROM analyses WHERE id = $1 AND user_id = $2',
      [analysisId, req.userId]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Analysis not found or you do not have access',
      });
    }

    // Step 3: Generate a random share token
    const shareToken = randomBytes(12).toString('base64url');

    // Step 4: Insert into shares table
    const shareResult = await pool.query(
      `INSERT INTO shares (analysis_id, share_token)
       VALUES ($1, $2)
       RETURNING id, share_token, created_at`,
      [analysisId, shareToken]
    );

    const newShare = shareResult.rows[0];

    // Step 5: Respond
    return res.status(201).json({
      message: 'Share link created',
      share: {
        id: newShare.id,
        token: newShare.share_token,
        analysis_id: analysisId,
        created_at: newShare.created_at,
      },
    });
  } catch (err) {
    console.error('Create share error:', err);
    return res.status(500).json({
      error: 'Failed to create share link',
    });
  }
}

export async function viewShare(req: Request <{ token: string }>, res: Response){
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({
            error:  'Share token is required',
        });
    }

    try{
        // Look up the share — but JOIN to get the analysis content in one query
        const result = await pool.query(
           `SELECT 
         s.id AS share_id,
         s.share_token,
         s.created_at AS shared_at,
         a.id AS analysis_id,
         a.repo_name,
         a.github_url,
         a.analysis_content,
         a.created_at AS analyzed_at
         FROM shares s
         JOIN analyses a ON s.analysis_id = a.id
         WHERE s.share_token = $1 AND s.is_active = true`,
         [token]  
      );

      if (result.rows.length === 0){
        return res.status(404).json({
            error:  'Share link not found or no longer active',
        });
      }

      const row = result.rows[0];

      return res.json({
        analysis:{
            id: row.analysis_id,
            repo: row.repo_name,
            github_url: row.github_url,
            content: row.analysis_content,
            analyzed_at: row.analyzed_at,
        },
        shared_at: row.shared_at
      });
    } catch (err) {
        console.error('view share error:', err);
        return res.status(500).json({
            error: 'Failed to load shared analysis'
        });
    }
}