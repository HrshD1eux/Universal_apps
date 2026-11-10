import { APP_VERSION, GITHUB_API_LATEST_RELEASE, GITHUB_RELEASES_URL } from './version';

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
  assets?: ReleaseAsset[];
  recommendedAssetUrl?: string;
  error?: string;
}

export function isNewerVersion(latest: string, current: string): boolean {
  const clean = (v: string) => v.replace(/^[vV]/, '').trim();
  const l = clean(latest).split('.').map(n => parseInt(n, 10) || 0);
  const c = clean(current).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const lp = l[i] || 0;
    const cp = c[i] || 0;
    if (lp > cp) return true;
    if (lp < cp) return false;
  }
  return false;
}

export function detectPlatform(): 'windows' | 'mac' | 'linux' | 'other' {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux')) return 'linux';
  return 'other';
}

export async function checkForUpdates(force = false): Promise<UpdateCheckResult> {
  if (typeof window === 'undefined') {
    return { updateAvailable: false, currentVersion: APP_VERSION };
  }

  const now = Date.now();
  const cachedTs = localStorage.getItem('last_update_check_ts');
  const cachedData = localStorage.getItem('last_update_check_data');

  // Cache for 30 minutes unless forced
  if (!force && cachedTs && cachedData && now - parseInt(cachedTs, 10) < 30 * 60 * 1000) {
    try {
      const parsed = JSON.parse(cachedData);
      return parsed;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(GITHUB_API_LATEST_RELEASE, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { updateAvailable: false, currentVersion: APP_VERSION };
      }
      return {
        updateAvailable: false,
        currentVersion: APP_VERSION,
        error: `GitHub API returned ${res.status}`,
      };
    }

    const data = await res.json();
    const rawTag = (data.tag_name || '').trim();
    const cleanTag = rawTag.replace(/^[vV]/, '');

    const newer = isNewerVersion(cleanTag, APP_VERSION);

    const assets: ReleaseAsset[] = Array.isArray(data.assets)
      ? data.assets.map((a: any) => ({
          name: a.name,
          browser_download_url: a.browser_download_url,
          size: a.size,
        }))
      : [];

    const platform = detectPlatform();
    let recommendedAssetUrl = data.html_url || GITHUB_RELEASES_URL;

    if (platform === 'windows') {
      const exe = assets.find(a => a.name.endsWith('.exe')) || assets.find(a => a.name.endsWith('.msi'));
      if (exe) recommendedAssetUrl = exe.browser_download_url;
    } else if (platform === 'mac') {
      const dmg = assets.find(a => a.name.endsWith('.dmg'));
      if (dmg) recommendedAssetUrl = dmg.browser_download_url;
    } else if (platform === 'linux') {
      const deb = assets.find(a => a.name.endsWith('.deb')) || assets.find(a => a.name.endsWith('.AppImage'));
      if (deb) recommendedAssetUrl = deb.browser_download_url;
    }

    const result: UpdateCheckResult = {
      updateAvailable: newer,
      currentVersion: APP_VERSION,
      latestVersion: cleanTag,
      releaseName: data.name || `Version ${rawTag}`,
      releaseUrl: data.html_url || GITHUB_RELEASES_URL,
      releaseNotes: data.body || '',
      publishedAt: data.published_at,
      assets,
      recommendedAssetUrl,
    };

    localStorage.setItem('last_update_check_ts', now.toString());
    localStorage.setItem('last_update_check_data', JSON.stringify(result));

    return result;
  } catch (err: any) {
    return {
      updateAvailable: false,
      currentVersion: APP_VERSION,
      error: err.message || 'Network request failed',
    };
  }
}
