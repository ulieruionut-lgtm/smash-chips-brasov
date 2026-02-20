// Vercel Serverless Function - Save products and images to GitHub
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = 'ulieruionut-lgtm';
        const GITHUB_REPO = 'smash-chips-brasov';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        const body = req.body;

        // Handle image upload
        if (body.action === 'upload-image') {
            const { filename, imageData } = body;
            if (!filename || !imageData) {
                return res.status(400).json({ error: 'Missing filename or imageData' });
            }

            // imageData is base64 string (may include data:image/...;base64, prefix)
            const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;

            // Check if file exists to get SHA
            const getResp = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(filename)}`,
                { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
            );

            let imageSha = null;
            if (getResp.ok) {
                const imgData = await getResp.json();
                imageSha = imgData.sha;
            }

            const uploadResp = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(filename)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Upload image ${filename} via admin panel`,
                        content: base64Image,
                        ...(imageSha && { sha: imageSha }),
                        branch: 'main'
                    })
                }
            );

            if (!uploadResp.ok) {
                const err = await uploadResp.json();
                return res.status(500).json({ error: 'Failed to upload image', details: err.message });
            }

            return res.status(200).json({ success: true, message: `Image ${filename} uploaded successfully` });
        }

        // Handle products save
        const { products } = body;

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: 'Invalid products data' });
        }

        const FILE_PATH = 'products.json';

        // Get current file SHA
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

        // Wrap products in correct format {"products": [...]}
        const fileContent = { products };
        const content = JSON.stringify(fileContent, null, 2);
        const base64Content = Buffer.from(content).toString('base64');

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
                    ...(sha && { sha }),
                    branch: 'main'
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('GitHub API Error:', errorData);
            return res.status(500).json({ error: 'Failed to update GitHub', details: errorData.message });
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
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
