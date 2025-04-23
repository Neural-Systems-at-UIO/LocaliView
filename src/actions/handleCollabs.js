const BUCKET_URL = 'https://data-proxy.ebrains.eu/api/v1/buckets/';

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const fetchWithAuth = (url, token, options = {}) =>
    fetchJson(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            'Authorization': 'Bearer ' + token,
            'accept': 'application/json',
        },
    });

export async function deleteItem(path, token) {
    return fetchWithAuth(`${BUCKET_URL}${path}`, token, { method: 'DELETE' });
}

export async function listAvailableWorkspaces(token) {
    const workspaces = await fetchWithAuth(BUCKET_URL.slice(0, -1), token);
    return workspaces.map(w => w.name);
}

export const fetchCollab = (token, collabName) =>
    fetchWithAuth(`https://wiki.ebrains.eu/rest/v1/collabs/${collabName}`, token);

export const fetchBucketDir = async (token, bucketName, prefix, delimiter, limit = 1000) => {
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    if (delimiter) params.append('delimiter', delimiter);
    if (limit) params.append('limit', limit);
    const url = `${BUCKET_URL}${bucketName}?${params}`;
    const data = await fetchWithAuth(url, token);
    return (data.objects || [])
        .filter(obj => obj.subdir)
        .map(obj => {
            const dirName = obj.subdir.split('/').slice(-2, -1)[0] || obj.subdir;
            return {
                name: dirName,
                type: 'directory',
                path: prefix ? `${prefix}${dirName}/` : `${dirName}/`
            };
        });
};

export function fetchWorkspaceConfigurations() {
    return null;
}

const fetchBucketStats = async (token, bucketName, prefix, workDir) => {
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', `${prefix}${workDir}/`);
    params.append('limit', 1000);
    const url = `${BUCKET_URL}${bucketName}?${params}`;
    const data = await fetchWithAuth(url, token);
    const stats = {
        name: prefix + workDir,
        files: data.objects.length,
        size: data.objects.reduce((acc, obj) => acc + obj.bytes, 0),
    };
    if (workDir === 'raw_images') {
        stats.tiffs = data.objects.filter(obj => /\.(tif|tiff|png|jpe?g)$/i.test(obj.name));
    } else if (workDir === 'zipped_images') {
        stats.zips = data.objects.filter(obj => obj.name.endsWith('.dzip'));
    } else if (workDir === 'jsons') {
        stats.jsons = data.objects.filter(obj => obj.name.endsWith('.waln'));
    }
    return stats;
};

export const fetchBrainStats = async (token, bucketName, brainPrefix, optional = null) => {
    const workDirs = optional ? [optional] : ['raw_images', 'zipped_images', 'jsons', 'segmentations'];
    return Promise.all(workDirs.map(wd => fetchBucketStats(token, bucketName, brainPrefix, wd)));
};

export const fetchBrainSegmentations = async (token, bucketName, brainPrefix) => {
    const params = new URLSearchParams();
    if (brainPrefix) params.append('prefix', `${brainPrefix}segmentations/`);
    params.append('limit', 1000);
    const url = `${BUCKET_URL}${bucketName}?${params}`;
    const data = await fetchWithAuth(url, token);
    if (!data.objects?.length) return [];
    return [{
        name: brainPrefix + 'segmentations',
        files: data.objects.length,
        size: data.objects.reduce((acc, obj) => acc + obj.bytes, 0),
        images: data.objects,
    }];
};

export const fetchPyNutilResults = async (token, bucketName, brainPrefix) => {
    const params = new URLSearchParams();
    if (brainPrefix) params.append('prefix', `${brainPrefix}pynutil_results/`);
    params.append('limit', 1000);
    params.append('delimiter', '/');
    const url = `${BUCKET_URL}${bucketName}?${params}`;
    const data = await fetchWithAuth(url, token);
    if (!data.objects?.length) return [];
    return [{
        name: brainPrefix + 'pynutil_results',
        files: data.objects.length,
        size: data.objects.reduce((acc, obj) => acc + obj.bytes, 0),
        images: data.objects,
    }];
};

const getUploadUrl = async (token, bucketName, objectName) => {
    const url = `${BUCKET_URL}${bucketName}/${objectName}`;
    const { url: uploadUrl } = await fetchWithAuth(url, token, { method: 'PUT', headers: { 'Accept': 'application/json' } });
    return uploadUrl;
};

const uploadFile = async (uploadUrl, file, contentType) => {
    const headers = contentType ? { 'Content-Type': contentType } : {};
    const response = await fetch(uploadUrl, { method: 'PUT', body: file, headers });
    if (!response.ok) throw new Error('Failed to upload file');
    return { url: uploadUrl, status: response.status === 204 };
};

export const uploadToPath = async (token, bucketName, projectName, uploadPath, file) => {
    const objectName = `${projectName}/${uploadPath}${file.name}`.replace(/\/+/g, '/');
    const uploadUrl = await getUploadUrl(token, bucketName, objectName);
    return uploadFile(uploadUrl, file);
};

export const createProject = async (uploadObj) => {
    const objectName = `${uploadObj.projectName}/projectsettings.json`.replace(/\/+/g, '/');
    const uploadUrl = await getUploadUrl(uploadObj.token, uploadObj.bucketName, objectName);
    const content = {
        created_at: new Date().toISOString(),
        project_name: uploadObj.projectName,
    };
    return uploadFile(uploadUrl, JSON.stringify(content), 'application/json');
};

export const uploadToSegments = async (token, bucketName, projectName, brainName, file) => {
    const objectName = `${projectName}/${brainName}/segmentations/${file.name}`.replace(/\/+/g, '/');
    const uploadUrl = await getUploadUrl(token, bucketName, objectName);
    return uploadFile(uploadUrl, file);
};

export const uploadToJson = async (uploadObj, fileName, content) => {
    const objectName = `${uploadObj.projectName}/${uploadObj.brainName}/jsons/${fileName}`.replace(/\/+/g, '/');
    const uploadUrl = await getUploadUrl(uploadObj.token, uploadObj.bucketName, objectName);
    return uploadFile(uploadUrl, JSON.stringify(content), 'application/json');
};

export async function checkBucketExists(token, searchTerm) {
    try {
        const url = `${BUCKET_URL.slice(0, -1)}?search=${searchTerm}`;
        const data = await fetchWithAuth(url, token);
        return data && data.length > 0;
    } catch {
        return false;
    }
}

export const downloadWalnJson = async (token, bucketName, objectPath) => {
    const url = `${BUCKET_URL}${bucketName}/${objectPath}?redirect=false`;
    const { url: downloadUrl } = await fetchWithAuth(url, token);
    const contentResponse = await fetch(downloadUrl);
    if (!contentResponse.ok) throw new Error('Failed to download WALN content');
    return contentResponse.json();
};