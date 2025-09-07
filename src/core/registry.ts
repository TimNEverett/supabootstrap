import fs from 'fs';
import path from 'path';
import { FeatureRegistry, Feature } from '../utils/types';

export class FeatureRegistryManager {
  private registry: FeatureRegistry | null = null;
  private registryPath: string;

  constructor() {
    // Look for features directory relative to the package location
    const packageRoot = this.findPackageRoot();
    this.registryPath = path.join(packageRoot, 'features', 'features.json');
  }

  /**
   * Find the package root directory (where package.json is located)
   */
  private findPackageRoot(): string {
    let currentDir = __dirname;
    
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to current working directory
    return process.cwd();
  }

  /**
   * Load the feature registry from features.json
   */
  loadRegistry(): FeatureRegistry {
    if (this.registry) {
      return this.registry;
    }

    if (!fs.existsSync(this.registryPath)) {
      throw new Error(`Feature registry not found at: ${this.registryPath}`);
    }

    try {
      const registryContent = fs.readFileSync(this.registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      
      if (!this.registry) {
        throw new Error('Failed to parse feature registry');
      }

      // Validate registry structure
      this.validateRegistry(this.registry);
      
      return this.registry;
    } catch (error) {
      throw new Error(`Failed to load feature registry: ${(error as Error).message}`);
    }
  }

  /**
   * Validate the structure of the feature registry
   */
  private validateRegistry(registry: FeatureRegistry): void {
    if (!registry.version) {
      throw new Error('Feature registry missing version');
    }
    
    if (!registry.features || typeof registry.features !== 'object') {
      throw new Error('Feature registry missing or invalid features object');
    }

    // Validate each feature
    for (const [featureId, feature] of Object.entries(registry.features)) {
      this.validateFeature(featureId, feature);
    }

    // Check for circular dependencies
    this.checkCircularDependencies(registry.features);
  }

  /**
   * Validate a single feature definition
   */
  private validateFeature(featureId: string, feature: Feature): void {
    const required = ['name', 'description', 'version', 'dependencies', 'category'];
    for (const field of required) {
      if (!(field in feature)) {
        throw new Error(`Feature '${featureId}' missing required field: ${field}`);
      }
    }

    if (!Array.isArray(feature.dependencies)) {
      throw new Error(`Feature '${featureId}' dependencies must be an array`);
    }
  }

  /**
   * Check for circular dependencies in the feature registry
   */
  private checkCircularDependencies(features: Record<string, Feature>): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (featureId: string): boolean => {
      if (recursionStack.has(featureId)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(featureId)) {
        return false; // Already processed
      }

      visited.add(featureId);
      recursionStack.add(featureId);

      const feature = features[featureId];
      if (feature) {
        for (const dependency of feature.dependencies) {
          if (!features[dependency]) {
            throw new Error(`Feature '${featureId}' depends on unknown feature '${dependency}'`);
          }
          
          if (hasCycle(dependency)) {
            throw new Error(`Circular dependency detected involving feature '${featureId}'`);
          }
        }
      }

      recursionStack.delete(featureId);
      return false;
    };

    for (const featureId of Object.keys(features)) {
      if (!visited.has(featureId)) {
        hasCycle(featureId);
      }
    }
  }

  /**
   * Get a specific feature by ID
   */
  getFeature(featureId: string): Feature | null {
    const registry = this.loadRegistry();
    return registry.features[featureId] || null;
  }

  /**
   * Get all features
   */
  getAllFeatures(): Record<string, Feature> {
    const registry = this.loadRegistry();
    return registry.features;
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: string): Record<string, Feature> {
    const registry = this.loadRegistry();
    const filteredFeatures: Record<string, Feature> = {};
    
    for (const [featureId, feature] of Object.entries(registry.features)) {
      if (feature.category === category) {
        filteredFeatures[featureId] = feature;
      }
    }
    
    return filteredFeatures;
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const registry = this.loadRegistry();
    const categories = new Set<string>();
    
    for (const feature of Object.values(registry.features)) {
      categories.add(feature.category);
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Resolve dependencies for a feature (returns ordered list)
   */
  resolveDependencies(featureId: string): string[] {
    const registry = this.loadRegistry();
    const feature = registry.features[featureId];
    
    if (!feature) {
      throw new Error(`Feature '${featureId}' not found`);
    }

    const resolved: string[] = [];
    const visited = new Set<string>();

    const resolve = (currentFeatureId: string): void => {
      if (visited.has(currentFeatureId)) {
        return;
      }
      
      visited.add(currentFeatureId);
      const currentFeature = registry.features[currentFeatureId];
      
      if (currentFeature) {
        // Resolve dependencies first
        for (const dependency of currentFeature.dependencies) {
          resolve(dependency);
        }
        
        // Add current feature to resolved list
        if (!resolved.includes(currentFeatureId)) {
          resolved.push(currentFeatureId);
        }
      }
    };

    resolve(featureId);
    return resolved;
  }

  /**
   * Get the path to a feature's directory
   */
  getFeaturePath(featureId: string): string {
    const packageRoot = this.findPackageRoot();
    return path.join(packageRoot, 'features', featureId);
  }

  /**
   * Check if a feature directory exists
   */
  featureExists(featureId: string): boolean {
    const featurePath = this.getFeaturePath(featureId);
    return fs.existsSync(featurePath) && fs.statSync(featurePath).isDirectory();
  }
}

export const featureRegistry = new FeatureRegistryManager();