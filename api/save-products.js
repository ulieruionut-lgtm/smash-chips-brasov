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

            const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
            const FILE_PATH = `images/${filename}`;

            // Check if file exists to get SHA
            let imageSha = null;
            const checkFile = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
                {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`
                    }
                }
            );

            if (checkFile.ok) {
                const fileData = await checkFile.json();
                imageSha = fileData.sha;
            }

            const uploadResp = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
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

            return res.status(200).json({
                success: true,
                message: `Image ${filename} uploaded successfully`
            });
        }

        // Handle products save - support both { products: [] } and []
        const products = Array.isArray(body) ? body : (body.products && Array.isArray(body.products) ? body.products : null);

        if (!products) {
            return res.status(400).json({ error: 'Invalid products data. Expected array or object with products key.' });
        }

        const FILE_PATH = 'products.json';

        // Get current file SHA
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            }
        );

        if (!getFileResponse.ok) {
            return res.status(500).json({ error: 'Failed to get products.json SHA' });
        }

        const fileData = await getFileResponse.json();
        const fileSha = fileData.sha;

        // Update file - ALWAYS SAVE AS ROOT ARRAY
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update products.json via admin panel - ${new Date().toISOString()}`,
                    content: Buffer.from(JSON.stringify(products, null, 4)).toString('base64'),
                    sha: fileSha,
                    branch: 'main'
                })
            }
        );

        if (!updateResponse.ok) {
            const err = await updateResponse.json();
            return res.status(500).json({ error: 'Failed to update products.json', details: err.message });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
