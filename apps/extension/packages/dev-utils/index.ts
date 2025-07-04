export interface Manifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  default_locale?: string;
  permissions?: string[];
  host_permissions?: string[];
  background?: {
    service_worker: string;
    type?: 'module';
  };
  content_scripts?: Array<{
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
  }>;
  action?: {
    default_popup?: string;
    default_title?: string;
    default_icon?: Record<string, string>;
  };
  icons?: Record<string, string>;
  web_accessible_resources?: Array<{
    resources: string[];
    matches: string[];
  }>;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[YTClipper Extension] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[YTClipper Extension] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[YTClipper Extension] ${message}`, ...args);
  }
}; 