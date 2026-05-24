import { Request, Response} from 'express';
import {
    parseGitHubUrl,
    fetchRepoTree,
    filterRelevantFiles,
    selectTopFiles,
}   from '../services/github.js';

export async function analyzeRepo(req: Request, res: Response) {
    const { url } = req.body;

    //Validation
    if (!url) {
        return res.status(400).json({
            error: 'GitHub URL is required',
        });
    }

    try{
        // step 1: Parse the URL
        const { owner, repo } = parseGitHubUrl(url);

        // step 2: Fetch the tree from GitHub
        const tree = await fetchRepoTree(owner , repo);

        // Step 3: Filter junk files
        const filtered = filterRelevantFiles(tree);

        // step 4: Pick top 30 most important
        const topFiles = selectTopFiles(filtered, 30);

        // step 5: Return the summary

        return res.json({
            message: 'Repo analyzed successfully',
            owner: owner,
            repo: repo,
            stats: {
                totalEntries: tree.length,
                filteredCount: filtered.length,
                selectedCount: topFiles.length,
            },
            files: topFiles.map((f) => ({
                path: f.path,
                size: f.size,
            })),
        });
    } catch (err){
        console.error('Analyze error:', err);

        // Differentiate between bad input and serve errors
        if (err instanceof Error && err.message.includes('Invalid GitHub URL')){
            return res.status(400).json({error: err.message});
        }

        return res.status(500).json({
            error: 'Failed to analyze repo',
        });
    }
}
