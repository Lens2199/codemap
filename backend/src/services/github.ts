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

export async function fetchFileContent(
    owner: string,
    repo: string,
    path: string,
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            'User-Agent': 'CodeMap',
            Accept: 'application/vnd.github+json'
        },

    });

    if (!response.ok){
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.encoding !== 'base64'){
        throw new Error(`Unexpected encoding for ${path}: ${data.encoding}`);
    }

    // Decode base64 -> utf-8 text
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');

    return decoded;
}


// Filenames that are always high-priority (regardless of folder)
const PRIORITY_FILES = [
  'README.md', 'readme.md', 'Readme.md',
  'package.json',
  'tsconfig.json',
  'index.ts', 'index.js',
  'server.ts', 'server.js',
  'app.ts', 'app.js',
  'main.ts', 'main.js',
];

// Folders that are LOWER priority (deprioritize, don't exclude)
const DEPRIORITIZE_FOLDERS = [
  'examples/', 'example/',
  'test/', 'tests/', '__tests__/',
  'fixtures/', 'fixture/',
  'docs/', 'doc/',
  'scripts/',
];

function scoreFile(file: GitHubFile): number {
  const filename = file.path.split('/').pop() ?? '';
  const depth = file.path.split('/').length;
  const isRoot = depth === 1;

  let score = 0;

  // Big boost for priority filenames AT ROOT ONLY
  if (PRIORITY_FILES.includes(filename) && isRoot) {
    score += 100;
  }

  // Smaller boost for priority filenames anywhere else
  else if (PRIORITY_FILES.includes(filename)) {
    score += 20;
  }

  // Boost for root-level files
  if (isRoot) {
    score += 50;
  }

  // Boost for files in primary source folders
  if (
    file.path.startsWith('src/') ||
    file.path.startsWith('lib/') ||
    file.path.startsWith('app/') ||
    file.path.startsWith('source/') ||
    file.path.startsWith('packages/')
  ) {
    score += 40;
  }

  // Penalty for deeply nested files
  score -= depth * 5;

  // STRONGER penalty for deprioritized folders
  if (DEPRIORITIZE_FOLDERS.some((folder) => file.path.startsWith(folder))) {
    score -= 80;
  }

  // Small boost for common code extensions
  if (filename.endsWith('.ts') || filename.endsWith('.js') || filename.endsWith('.py')) {
    score += 10;
  }

  return score;
}


export function selectTopFiles(files: GitHubFile[], maxCount: number = 30): GitHubFile[] {
  // Score each file, sort descending, take top N
  const scored = files.map((file) => ({
    file,
    score: scoreFile(file),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount).map((item) => item.file);
}