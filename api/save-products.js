// Vercel Serverless Function - Save products and images to GitHub
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = 'ulieruionut-lgtm';
    const GITHUB_REPO = 'smash-chips-brasov';

    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'GitHub token not configured' });
    }

    // Helper: list images from GitHub
    async function listImages() {
        const resp = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/images`,
            { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
        );
        if (!resp.ok) throw new Error('Failed to list images');
        const files = await resp.json();
        return files
            .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name))
            .map(f => ({ name: f.name, sha: f.sha, url: f.download_url }));
    }

    // GET: list images
    if (req.method === 'GET') {
        try {
            const images = await listImages();
            return res.status(200).json({ images });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        // Handle list-images via POST (for admin panel compatibility)
        if (body.action === 'list-images') {
            try {
                const images = await listImages();
                return res.status(200).json({ images });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Handle image delete
        if (body.action === 'delete-image') {
            const { filename } = body;
            if (!filename) return res.status(400).json({ error: 'Missing filename' });

            const FILE_PATH = `images/${filename}`;
            const checkFile = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
                { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
            );
            if (!checkFile.ok) return res.status(404).json({ error: 'File not found' });
            const fileData = await checkFile.json();

            const delResp = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Delete image ${filename} via admin panel`,
                        sha: fileData.sha,
                        branch: 'main'
                    })
                }
            );
            if (!delResp.ok) {
                const err = await delResp.json();
                return res.status(500).json({ error: 'Failed to delete image', details: err.message });
            }
            return res.status(200).json({ success: true, message: `Image ${filename} deleted` });
        }

        // Handle image upload
        if (body.action === 'upload-image') {
            const { filename, imageData } = body;
            if (!filename || !imageData) {
                return res.status(400).json({ error: 'Missing filename or imageData' });
            }

            const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
            const FILE_PATH = `images/${filename}`;

            let imageSha = null;
            const checkFile = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
                { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
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
        const products = Array.isArray(body)
            ? body
            : (body.products && Array.isArray(body.products) ? body.products : null);

        if (!products) {
            return res.status(400).json({ error: 'Invalid products data. Expected array or object with products key.' });
        }

        const FILE_PATH = 'products.json';
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
        );

        if (!getFileResponse.ok) {
            return res.status(500).json({ error: 'Failed to get products.json SHA' });
        }

        const fileData = await getFileResponse.json();
        const fileSha = fileData.sha;

        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
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
