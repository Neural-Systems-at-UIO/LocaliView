// Repository layer wrapping lower-level collab/bucket actions.
// Provides normalized, typed accessors and a single import surface.

import {
  fetchBucketDir,
  fetchBrainStatsNormalized,
  fetchBrainSegmentations,
  BucketDirEntry,
  BrainStatsNormalized,
} from "./handleCollabs.ts";

export interface ProjectEntry extends BucketDirEntry {}
export interface BrainEntry extends BucketDirEntry {}

export const listProjects = (
  token: string,
  bucket: string
): Promise<ProjectEntry[]> => fetchBucketDir(token, bucket, undefined, "/");

export const listBrains = (
  token: string,
  bucket: string,
  projectName: string
): Promise<BrainEntry[]> =>
  fetchBucketDir(token, bucket, `${projectName}/`, "/").then((entries) =>
    entries.map((e) => ({ ...e }))
  );

export const getBrainStats = (
  token: string,
  bucket: string,
  brainPath: string
): Promise<BrainStatsNormalized> =>
  fetchBrainStatsNormalized(token, bucket, brainPath);

export const getBrainRegistrations = async (
  token: string,
  bucket: string,
  brainPath: string
) => {
  const stats = await getBrainStats(token, bucket, brainPath);
  return stats.registrations?.jsons || [];
};

export const getBrainSegmentationsRepo = (
  token: string,
  bucket: string,
  brainPath: string
) => fetchBrainSegmentations(token, bucket, brainPath);
