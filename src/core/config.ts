import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { SupaBootstrapConfig } from '../utils/types';

const CONFIG_FILE_NAME = '.supabootstrap.json';

export class ConfigManager {
  private ajv: Ajv;
  private configSchema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    
    // Load the JSON schema
    const schemaPath = path.join(__dirname, '../../config-schema.json');
    this.configSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    this.ajv.addSchema(this.configSchema, 'config');
  }

  /**
   * Find the config file by walking up from current directory
   */
  findConfigFile(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;
    
    while (currentDir !== path.parse(currentDir).root) {
      const configPath = path.join(currentDir, CONFIG_FILE_NAME);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  /**
   * Load and validate configuration from file
   */
  loadConfig(configPath?: string): SupaBootstrapConfig {
    const finalConfigPath = configPath || this.findConfigFile();
    
    if (!finalConfigPath) {
      throw new Error(`Configuration file ${CONFIG_FILE_NAME} not found. Run 'supabootstrap init' first.`);
    }

    if (!fs.existsSync(finalConfigPath)) {
      throw new Error(`Configuration file not found at: ${finalConfigPath}`);
    }

    let configData: any;
    try {
      const configContent = fs.readFileSync(finalConfigPath, 'utf8');
      configData = JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to parse configuration file: ${(error as Error).message}`);
    }

    // Validate against schema
    const validate = this.ajv.getSchema('config');
    if (!validate) {
      throw new Error('Failed to load configuration schema');
    }

    const isValid = validate(configData);
    if (!isValid) {
      const errors = validate.errors?.map(err => 
        `${err.instancePath || 'root'}: ${err.message}`
      ).join('\n');
      throw new Error(`Configuration validation failed:\n${errors}`);
    }

    return configData as SupaBootstrapConfig;
  }

  /**
   * Create default configuration
   */
  createDefaultConfig(version: string = '1.0.0'): SupaBootstrapConfig {
    return {
      version,
      sourceDir: './supabase',
      installedFeatures: {}
    };
  }

  /**
   * Save configuration to file
   */
  saveConfig(config: SupaBootstrapConfig, configPath?: string): void {
    const finalConfigPath = configPath || path.join(process.cwd(), CONFIG_FILE_NAME);
    
    // Validate config before saving
    const validate = this.ajv.getSchema('config');
    if (!validate) {
      throw new Error('Failed to load configuration schema');
    }

    const isValid = validate(config);
    if (!isValid) {
      const errors = validate.errors?.map(err => 
        `${err.instancePath || 'root'}: ${err.message}`
      ).join('\n');
      throw new Error(`Configuration validation failed:\n${errors}`);
    }

    try {
      fs.writeFileSync(finalConfigPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Get absolute path to Supabase directory
   */
  getSupabasePath(config: SupaBootstrapConfig, projectRoot?: string): string {
    const root = projectRoot || path.dirname(this.findConfigFile() || process.cwd());
    return path.resolve(root, config.sourceDir);
  }

  /**
   * Apply file prefix if configured
   */
  applyFilePrefix(filename: string, config: SupaBootstrapConfig): string {
    if (!config.filePrefix) {
      return filename;
    }
    
    // Handle different file types
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const dir = path.dirname(filename);
    
    const prefixedBase = config.filePrefix + base;
    return path.join(dir, prefixedBase + ext);
  }
}

export const configManager = new ConfigManager();