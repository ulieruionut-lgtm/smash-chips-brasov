// Vercel Serverless Function - Save products to GitHub
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: 'Invalid products data' });
        }

        // GitHub API configuration
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = 'ulieruionut-lgtm';
        const GITHUB_REPO = 'smash-chips-brasov';
        const FILE_PATH = 'products.json';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        // Get current file SHA (needed for update)
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha = null;
        if (getFileResponse.ok) {
            const fileData = await getFileResponse.json();
            sha = fileData.sha;
        }

        // Prepare content
        const content = JSON.stringify(products, null, 2);
        const base64Content = Buffer.from(content).toString('base64');

        // Update or create file on GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update products.json via admin panel - ${new Date().toISOString()}`,
                    content: base64Content,
                    sha: sha || undefined,
                    branch: 'main'
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('GitHub API Error:', errorData);
            return res.status(500).json({ 
                error: 'Failed to update GitHub',
                details: errorData.message 
            });
        }

        const result = await updateResponse.json();
        
        return res.status(200).json({
            success: true,
            message: 'Products saved successfully to GitHub',
            commit: result.commit.sha,
            url: result.content.html_url
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
