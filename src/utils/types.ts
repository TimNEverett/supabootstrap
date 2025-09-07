export interface SupaBootstrapConfig {
  version: string;
  sourceDir: string;
  filePrefix?: string;
  installedFeatures: Record<string, InstalledFeature>;
}

export interface InstalledFeature {
  version: string;
  installedAt: string;
  files: string[];
}

export interface Feature {
  name: string;
  description: string;
  version: string;
  dependencies: string[];
  category: string;
}

export interface FeatureRegistry {
  version: string;
  features: Record<string, Feature>;
}

export interface ConflictingFile {
  path: string;
  exists: boolean;
  action?: 'overwrite' | 'skip';
}

export interface InstallationResult {
  success: boolean;
  installedFiles: string[];
  skippedFiles: string[];
  errors: string[];
}