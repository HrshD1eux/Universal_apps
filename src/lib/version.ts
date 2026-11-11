import pkg from '../../package.json';
import { isTauri } from './tauri-utils';

export const APP_VERSION: string = (pkg.version || '0.0.0').replace(/^[vV]/, '').trim();
export const GITHUB_REPO = 'HrshD1eux/Universal_apps';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_API_LATEST_RELEASE = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Resolves the true installed application version.
 * Inside Tauri desktop builds, reads directly from the native app manifest (`tauri.conf.json`).
 * Falls back to the build-time `package.json` version on web.
 */
export async function getAppVersion(): Promise<string> {
  if (isTauri()) {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      const runtimeVersion = await getVersion();
      if (runtimeVersion) {
        return runtimeVersion.replace(/^[vV]/, '').trim();
      }
    } catch {
      // Fall back to package.json version
    }
  }
  return APP_VERSION;
}
