export interface GitHubRepoInfo{
    owner: string;
    repo: string;
}

export function parseGitHubUrl(url: string):  GitHubRepoInfo {
    // Remove trailing slash if present
    const cleanUrl = url.trim().replace(/\/$/, '');

    // Match the owner/repo pattern after github.com/
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

    if (!match) {
        throw new Error('Invalid GitHub URL. Expected format: github.com/owner/repo');
    }

    // Strip ".git" suffix if someone pasted a clone URL
    const repo = match[2].replace(/\.git$/, '');

    return {
        owner: match[1],
        repo: repo,
    };
}

export interface GitHubFile{
    path: string,
    type: 'blob' | 'tree';
    size?: number;
    sha: string;
}

export async function fetchRepoTree(
    owner: string,
    repo: string
): Promise<GitHubFile[]>{
    // First, get the default branch name

    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoResponse = await fetch(repoUrl, {
        headers:{
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            'User-Agent': 'codeMap',
            Accept: 'application/vnd.github+json'
        },
    });

    if (!repoResponse.ok){
        throw new Error(`GitHub API error: ${repoResponse.status} ${repoResponse.statusText}`);
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch;

    // Now fetch the tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeResponse = await fetch(treeUrl, {
        headers:{
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            'User-Agent': 'CodeMap',
            Accept: 'application/vnd.github+json',
        },
    });

    if (!treeResponse.ok) {
       throw new Error(`GitHub API error: ${treeResponse.status} ${treeResponse.statusText}`);
    }

   const treeData = await treeResponse.json();

   return treeData.tree as GitHubFile[];


}

// Folders we never want to analyze

const SKIP_FOLDERS = [
    'node_modules/',
    'dist/',
    'build/',
    '.git/',
    '.github/',
    '.vscode/',
    '.idea/',
    'coverage/',
    '.next/',
    '.nuxt/',
    'out/',
    'vendor/',
];

// Specefic filenames we skip
const SKIP_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
];

// File extensions we skip (binaries, images, etc.)
const SKIP_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.mp4', '.mp3', '.wav', '.mov',
    '.pdf', '.zip', '.tar', '.gz', '.rar',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.exe', '.dll', '.so', '.dylib',
];

const MAX_FILE_SIZE = 100_000; // 100 KB

export function filterRelevantFiles(tree: GitHubFile[]): GitHubFile[] {
  return tree.filter((file) => {
    // Layer 1: must be a file (not a folder)
    if (file.type !== 'blob') return false;

    // Layer 2: path-based filtering
    if (SKIP_FOLDERS.some((folder) => file.path.startsWith(folder))) {
      return false;
    }

    if (SKIP_FILES.includes(file.path)) {
      return false;
    }

     // NEW: skip dot-files at any path depth (.eslintrc, .gitignore, etc.)
    const filename = file.path.split('/').pop() ?? '';
    if (filename.startsWith('.')) {
      return false;
    }
    
    // Layer 3: extension and size filtering
    const lowerPath = file.path.toLowerCase();
    if (SKIP_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) {
      return false;
    }

    if (lowerPath.endsWith('.min.js') || lowerPath.endsWith('.min.css')) {
      return false;
    }

    if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
      return false;
    }

    return true;
  });
}

