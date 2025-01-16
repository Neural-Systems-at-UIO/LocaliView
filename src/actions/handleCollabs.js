
const BUCKET_URL = 'https://data-proxy.ebrains.eu/api/v1/buckets/'
const DEEPZOOM_URL = import.meta.env.VITE_APP_DEEPZOOM_URL

// dzi work functions
function convertDziToSection(dziData, snr = 1) {
    return {
        filename: dziData.filename,
        width: dziData.width,
        height: dziData.height,
        snr: snr,
        format: dziData.format,
        tilesize: dziData.tilesize,
        overlap: dziData.overlap,
    };
}
// populating the file
function dzisection(dzi, filename) {
    return {
        filename,
        width: parseInt(dzi.match(/Width="(\d+)"/m)[1]),
        height: parseInt(dzi.match(/Height="(\d+)"/m)[1]),
        tilesize: parseInt(dzi.match(/TileSize="(\d+)"/m)[1]),
        overlap: parseInt(dzi.match(/Overlap="(\d+)"/m)[1]),
        format: dzi.match(/Format="([^"]+)"/m)[1]
    };
}

export async function deleteItem(path, token) {
    try {
        // Naming here is the full path
        const response = await fetch(`https://data-proxy.ebrains.eu/api/v1/buckets/${path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    }
    catch (error) {
        console.error('Error deleting item:', error);
        throw error; // Re-throw to allow caller to handle
    }
}


export async function listAvailableWorkspaces(token) {
    try {
        const response = await fetch('https://data-proxy.ebrains.eu/api/v1/buckets', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const workspaces = await response.json();
        return workspaces.map(workspace => workspace.name);

    } catch (error) {
        console.error('Error fetching workspaces:', error);
        throw error; // Re-throw to allow handling by caller on the UI secito 
    }
}


// Works fine
export const fetchCollab = async (token, collabName) => {
    try {
        const response = await fetch(`https://wiki.ebrains.eu/rest/v1/collabs/${collabName}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        console.log(response)
        if (!response.ok) {
            throw new Error('Failed to fetch collab')
        }

        return await response.json()
    } catch (error) {
        console.error('Error:', error)
        throw error
    }
}

export const fetchBucketDir = async (token, bucketName, prefix, delimiter, limit = 1000) => {

    if (token === null) {
        throw new Error('No token provided')
    }

    try {
        let url = `${BUCKET_URL}${bucketName}?`
        const params = new URLSearchParams()

        if (prefix) params.append('prefix', prefix)
        if (delimiter) params.append('delimiter', delimiter)
        if (limit) params.append('limit', limit)

        url += params.toString()

        console.log('Fetching bucket directory:', url)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        if (!response.ok) {
            throw new Error('Failed to fetch bucket directory')
        }
        const data = await response.json()


        // Assign logic here so just touch here
        const entries = await Promise.all(data.objects.map(async obj => {
            if (obj.subdir) {
                // Placing the name
                const dirName = obj.subdir.split('/').slice(-2, -1)[0] || obj.subdir

                // Fetching the subEntries for the Brains

                return {
                    name: dirName,
                    type: 'directory',
                    path: prefix ? `${prefix}${dirName}/` : `${dirName}/`
                }
            }
            return null
        }))
        console.log('All brains in project:', entries)
        return entries.filter(entry => entry !== null)
    } catch (error) {
        console.error('Error fetching bucket directory:', error)
        throw error
    }
}

export function fetchWorkspaceConfigurations(workspace, token) {

    return null;
}

export const fetchBrainStats = async (token, bucketName, brainPrefix) => {
    let res = []
    try {
        let url = `${BUCKET_URL}${bucketName}?`

        const workDirs = [
            'raw_images',
            'zipped_images',
            'jsons'
        ]

        for (const workDir of workDirs) {
            const params = new URLSearchParams()
            if (brainPrefix) params.append('prefix', `${brainPrefix}${workDir}/`)
            params.append('limit', 1000)
            const workDirUrl = `${url}${params.toString()}`

            const response = await fetch(workDirUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            })
            if (!response.ok) {
                throw new Error(`Failed to fetch bucket directory for ${workDir}`)
            }
            const data = await response.json()
            const stats = {
                "name": brainPrefix + workDir,
                "files": data.objects.length,
                "size": data.objects.reduce((acc, obj) => acc + obj.bytes, 0),
            }
            // Workdir relevant keys

            if (workDir === 'raw_images') {
                stats.tiffs = data.objects.filter(obj => obj.name.endsWith('.tif'))
            } else if (workDir === 'zipped_images') {
                stats.zips = data.objects.filter(obj => obj.name.endsWith('.dzip'))
            } else if (workDir === 'jsons') {
                stats.jsons = data.objects.filter(obj => obj.name.endsWith('.waln'))
            }

            res.push(stats)
        }

    } catch (error) {
        console.error('Error fetching bucket directory:', error)
        throw error
    }
    return res
}

export const fetchBrainSegmentations = async (token, bucketName, brainPrefix) => {
    let res = []

    try {
        let url = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}?`

        const workDirs = [
            'segmentations',
        ]

        for (const workDir of workDirs) {
            const params = new URLSearchParams()
            if (brainPrefix) params.append('prefix', `${brainPrefix}${workDir}/`)
            params.append('limit', 1000)
            const workDirUrl = `${url}${params.toString()}`

            const response = await fetch(workDirUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            })
            if (!response.ok) {
                throw new Error(`Failed to fetch bucket directory for ${workDir}`)
            }

            const data = await response.json()

            if (!data.objects || data.objects.length === 0) {
                return []
            }

            const stats = {
                "name": brainPrefix + workDir,
                "files": data.objects.length,
                "size": data.objects.reduce((acc, obj) => acc + obj.bytes, 0),
                "images": data.objects,
            }

            res.push(stats)
        }

        return res

    } catch (error) {
        console.error('Error fetching bucket directory:', error)
        throw error
    }
}


// For initial upload of brains
export const uploadToPath = async (token, bucketName, projectName, brainName, file) => {
    const objectName = `${projectName}/${brainName}/raw_images/${file.name}`.replace(/\/+/g, '/');
    const getUrlEndpoint = `${BUCKET_URL}${bucketName}/${objectName}`;

    // Step 1:
    const urlResponse = await fetch(getUrlEndpoint, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        }
    });

    if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL for ${file.name}`);
    }

    const { url: uploadUrl } = await urlResponse.json();

    // Step 2: 
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file ${file.name}`);
    }

    return { url: uploadUrl, status: uploadResponse.status === 204 };
}

export const createProject = async (uploadObj) => {
    const objectName = `${uploadObj.projectName}/projectsettings.json`.replace(/\/+/g, '/');
    const getUrlEndpoint = `${BUCKET_URL}${uploadObj.bucketName}/${objectName}`;

    const content = {
        'created_at': new Date().toISOString(),
        'project_name': uploadObj.projectName,
    }

    // Step 1: Get upload URL
    const urlResponse = await fetch(getUrlEndpoint, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + uploadObj.token,
            'Accept': 'application/json'
        }
    });

    if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL`);
    }

    const { url: uploadUrl } = await urlResponse.json();

    // Step 2: Upload JSON content
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file`);
    }

    return { url: uploadResponse.json, status: uploadResponse.status === 204 };
}


export const uploadToJson = async (uploadObj, fileName, content) => {
    const objectName = `${uploadObj.projectName}/${uploadObj.brainName}/jsons/${fileName}`.replace(/\/+/g, '/');
    const getUrlEndpoint = `${BUCKET_URL}${uploadObj.bucketName}/${objectName}`;

    console.log('Uploading JSON:', uploadObj)

    // Step 1: Get upload URL
    const urlResponse = await fetch(getUrlEndpoint, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + uploadObj.token,
            'Accept': 'application/json'
        }
    });

    if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL for ${fileName}`);
    }

    const { url: uploadUrl } = await urlResponse.json();

    // Step 2: Upload JSON content
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file ${fileName}`);
    }

    return { url: uploadResponse.json, status: uploadResponse.status === 204 };
}

// Ported from the old code, but with async/await
export async function checkBucketExists(token, searchTerm) {
    const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(
            `https://data-proxy.ebrains.eu/api/v1/buckets?search=${searchTerm}`,
            { headers }
        );

        if (!response.ok) {
            throw new Error('Failed to check bucket');
        }

        const data = await response.json();
        return data && data.length > 0;
    } catch (error) {
        console.error('Bucket check error:', error.message);
        return false;
    }
}