const BUCKET_URL = "https://data-proxy.ebrains.eu/api/v1/buckets/";

type FetchOptions = RequestInit;

const fetchJson = async <T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

const fetchWithAuth = <T = any>(
  url: string,
  token: string,
  options: FetchOptions = {}
): Promise<T> =>
  fetchJson<T>(url, {
    ...options,
    headers: {
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : options.headers || {}),
      Authorization: "Bearer " + token,
      accept: "application/json",
    },
  });

export async function deleteItem(path: string, token: string): Promise<any> {
  return fetchWithAuth(`${BUCKET_URL}${path}`, token, { method: "DELETE" });
}

export async function listAvailableWorkspaces(
  token: string
): Promise<string[]> {
  const workspaces = await fetchWithAuth<any[]>(BUCKET_URL.slice(0, -1), token);
  return workspaces.map((w) => w.name);
}

export const fetchCollab = (token: string, collabName: string): Promise<any> =>
  fetchWithAuth(`https://wiki.ebrains.eu/rest/v1/collabs/${collabName}`, token);

export interface BucketDirEntry {
  name: string;
  type: string;
  path: string;
}

export const fetchBucketDir = async (
  token: string,
  bucketName: string,
  prefix?: string,
  delimiter?: string,
  limit: number = 1000
): Promise<BucketDirEntry[]> => {
  const params = new URLSearchParams();
  if (prefix) params.append("prefix", prefix);
  if (delimiter) params.append("delimiter", delimiter);
  if (limit) params.append("limit", limit.toString());
  const url = `${BUCKET_URL}${bucketName}?${params}`;
  const data = await fetchWithAuth<any>(url, token);
  return (data.objects || [])
    .filter((obj: any) => obj.subdir)
    .map((obj: any) => {
      const dirName = obj.subdir.split("/").slice(-2, -1)[0] || obj.subdir;
      return {
        name: dirName,
        type: "directory",
        path: prefix ? `${prefix}${dirName}/` : `${dirName}/`,
      };
    });
};

export function fetchWorkspaceConfigurations(): null {
  return null;
}

interface BucketStats {
  name: string;
  files: number;
  size: number;
  tiffs?: any[];
  zips?: any[];
  jsons?: any[];
  nutil_results?: any[];
}

const fetchBucketStats = async (
  token: string,
  bucketName: string,
  prefix: string,
  workDir: string
): Promise<BucketStats> => {
  const params = new URLSearchParams();
  if (prefix) params.append("prefix", `${prefix}${workDir}/`);
  params.append("limit", "1000");
  const url = `${BUCKET_URL}${bucketName}?${params}`;
  const data = await fetchWithAuth<any>(url, token);
  const stats: BucketStats = {
    name: prefix + workDir,
    files: data.objects.length,
    size: data.objects.reduce((acc: number, obj: any) => acc + obj.bytes, 0),
  };
  if (workDir === "raw_images") {
    stats.tiffs = data.objects.filter((obj: any) =>
      /\.(tif|tiff|png|jpe?g)$/i.test(obj.name)
    );
  } else if (workDir === "zipped_images") {
    stats.zips = data.objects.filter((obj: any) => obj.name.endsWith(".dzip"));
  } else if (workDir === "jsons") {
    stats.jsons = data.objects.filter((obj: any) => obj.name.endsWith(".waln"));
  } else if (workDir === "pynutil_results") {
    const nutilResults = await fetchPyNutilResults(token, bucketName, prefix);
    stats.nutil_results = nutilResults[0]?.images || [];
  }
  return stats;
};

export const fetchBrainStats = async (
  token: string,
  bucketName: string,
  brainPrefix: string,
  optional: string | null = null
): Promise<BucketStats[]> => {
  const workDirs = optional
    ? [optional]
    : [
        "raw_images",
        "zipped_images",
        "jsons",
        "segmentations",
        "pynutil_results",
      ];
  return Promise.all(
    workDirs.map((wd) => fetchBucketStats(token, bucketName, brainPrefix, wd))
  );
};

export interface BrainSegmentation {
  name: string;
  files: number;
  size: number;
  images: any[];
}

export const fetchBrainSegmentations = async (
  token: string,
  bucketName: string,
  brainPrefix: string
): Promise<BrainSegmentation[]> => {
  const params = new URLSearchParams();
  if (brainPrefix) params.append("prefix", `${brainPrefix}segmentations/`);
  params.append("limit", "1000");
  const url = `${BUCKET_URL}${bucketName}?${params}`;
  const data = await fetchWithAuth<any>(url, token);
  if (!data.objects?.length) return [];
  return [
    {
      name: brainPrefix + "segmentations",
      files: data.objects.length,
      size: data.objects.reduce((acc: number, obj: any) => acc + obj.bytes, 0),
      images: data.objects,
    },
  ];
};

export const fetchPyNutilResults = async (
  token: string,
  bucketName: string,
  brainPrefix: string
): Promise<BrainSegmentation[]> => {
  const params = new URLSearchParams();
  if (brainPrefix) params.append("prefix", `${brainPrefix}pynutil_results/`);
  params.append("limit", "1000");
  params.append("delimiter", "/");
  const url = `${BUCKET_URL}${bucketName}?${params}`;
  const data = await fetchWithAuth<any>(url, token);
  if (!data.objects?.length) return [];
  return [
    {
      name: brainPrefix + "pynutil_results",
      files: data.objects.length,
      size: data.objects.reduce((acc: number, obj: any) => acc + obj.bytes, 0),
      images: data.objects,
    },
  ];
};

const getUploadUrl = async (
  token: string,
  bucketName: string,
  objectName: string
): Promise<string> => {
  const url = `${BUCKET_URL}${bucketName}/${objectName}`;
  const result = await fetchWithAuth<{ url: string }>(url, token, {
    method: "PUT",
    headers: { Accept: "application/json" },
  });
  return result.url;
};

const uploadFile = async (
  uploadUrl: string,
  file: Blob | string,
  contentType?: string
): Promise<{ url: string; status: boolean }> => {
  const headers: Record<string, string> = contentType
    ? { "Content-Type": contentType }
    : {};
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers,
  });
  if (!response.ok) throw new Error("Failed to upload file");
  return { url: uploadUrl, status: response.status === 204 };
};

export const uploadToPath = async (
  token: string,
  bucketName: string,
  projectName: string,
  uploadPath: string,
  file: File
): Promise<{ url: string; status: boolean }> => {
  const objectName = `${projectName}/${uploadPath}${file.name}`.replace(
    /\/+/g,
    "/"
  );
  const uploadUrl = await getUploadUrl(token, bucketName, objectName);
  return uploadFile(uploadUrl, file);
};

interface CreateProjectUploadObj {
  token: string;
  bucketName: string;
  projectName: string;
}

export const createProject = async (
  uploadObj: CreateProjectUploadObj
): Promise<{ url: string; status: boolean }> => {
  const objectName = `${uploadObj.projectName}/projectsettings.json`.replace(
    /\/+/g,
    "/"
  );
  const uploadUrl = await getUploadUrl(
    uploadObj.token,
    uploadObj.bucketName,
    objectName
  );
  const content = {
    created_at: new Date().toISOString(),
    project_name: uploadObj.projectName,
  };
  return uploadFile(uploadUrl, JSON.stringify(content), "application/json");
};

export const uploadToSegments = async (
  token: string,
  bucketName: string,
  projectName: string,
  brainName: string,
  file: File
): Promise<{ url: string; status: boolean }> => {
  const objectName =
    `${projectName}/${brainName}/segmentations/${file.name}`.replace(
      /\/+/g,
      "/"
    );
  const uploadUrl = await getUploadUrl(token, bucketName, objectName);
  return uploadFile(uploadUrl, file);
};

export const uploadToJson = async (
  uploadObj: CreateProjectUploadObj & { brainName: string },
  fileName: string,
  content: any
): Promise<{ url: string; status: boolean }> => {
  const objectName =
    `${uploadObj.projectName}/${uploadObj.brainName}/jsons/${fileName}`.replace(
      /\/+/g,
      "/"
    );
  const uploadUrl = await getUploadUrl(
    uploadObj.token,
    uploadObj.bucketName,
    objectName
  );
  return uploadFile(uploadUrl, JSON.stringify(content), "application/json");
};

export async function checkBucketExists(
  token: string,
  searchTerm: string
): Promise<boolean> {
  try {
    const url = `${BUCKET_URL.slice(0, -1)}?search=${searchTerm}`;
    const data = await fetchWithAuth<any[]>(url, token);
    return data && data.length > 0;
  } catch {
    return false;
  }
}

export const downloadWalnJson = async (
  token: string,
  bucketName: string,
  objectPath: string
): Promise<any> => {
  const url = `${BUCKET_URL}${bucketName}/${objectPath}?redirect=false`;
  const { url: downloadUrl } = await fetchWithAuth<{ url: string }>(url, token);
  const contentResponse = await fetch(downloadUrl);
  if (!contentResponse.ok) throw new Error("Failed to download WALN content");
  return contentResponse.json();
};
