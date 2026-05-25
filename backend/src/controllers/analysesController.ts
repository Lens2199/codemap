import { Request, Response} from 'express';
import {
    parseGitHubUrl,
    fetchRepoTree,
    filterRelevantFiles,
    selectTopFiles,
    fetchFileContent,
}   from '../services/github.js';
import { analyzeCodebase, FileForAnalysis } from '../services/claude.js';
import { pool } from '../db/pool.js';

export async function analyzeRepo(req: Request, res: Response) {
    const { url } = req.body;

    // Validation
    if (!url) {
        return res.status(400).json({
            error: 'GitHub URL is required',
        });
    }

    try {
        // Step 1: Parse the URL
        const { owner, repo } = parseGitHubUrl(url);
        const repoName = `${owner}/${repo}`;

        // Step 2: Fetch the tree from GitHub
        const tree = await fetchRepoTree(owner, repo);

        // Step 3: Filter and select top files
        const filtered = filterRelevantFiles(tree)
        const topFiles = selectTopFiles(filtered, 30);

        // step 4: Fetch all file contents in parallel
        console.log(`fetching ${topFiles.length} file contents in parallel...`);
        const contents = await Promise.all(
            topFiles.map((file) => fetchFileContent(owner, repo, file.path))
        );

        //step 5: Build the input for Claude
        const filesForAnalysis: FileForAnalysis[] = topFiles.map((file, i) => ({
            path: file.path,
            content: contents[i],
        }));

        // Step 6: Ask Claude to analyze
        console.log('Asking Claude to analyze...');
        const analysisContent = await analyzeCodebase( repoName, filesForAnalysis);

        // step 7: Save to database
        const result = await pool.query(
             `INSERT INTO analyses (user_id, github_url, repo_name, analysis_content)
              VALUES ($1, $2, $3, $4)
             RETURNING id, created_at`,
             [req.userId, url, repoName, analysisContent]
        );

        const newAnalysis = result.rows[0];

        // Step 8: Respond
        return res.status(201).json({
            message: 'Analysis complete',
            analysis:{
                id: newAnalysis.id,
                repo: repoName,
                content: analysisContent,
                created_at: newAnalysis.created_at,
            },
        });
    } catch (err) {
        console.error('Analyze error:', err);

        if (err instanceof Error && err.message.includes('Invalid GitHub URL')){
            return res.status(400).json({error: err.message});
        }

        return res.status(500).json({
            error: 'Failed to analyze repo'
        });
    }
}

export async function listAnalyses(req: Request, res: Response){
    try{
        const result = await pool.query(
           `SELECT id, repo_name, github_url, created_at
            FROM analyses
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [req.userId]
        );

        return res.json({
            count: result.rows.length,
            analyses: result.rows,
        });
    } catch (err){
        console.error('List analyses error:', err);
        return res.status(500).json({
            error: 'Failed to load analyses'
        });
    }
}