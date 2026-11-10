'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Download, 
  ExternalLink, 
  X, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkForUpdates, UpdateCheckResult, detectPlatform } from '@/lib/update-checker';
import { useToast } from '@/hooks/use-toast';

export default function UpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux' | 'other'>('windows');
  const { toast } = useToast();

  const runCheck = async (isManual = false) => {
    try {
      const result = await checkForUpdates(isManual);
      setUpdateInfo(result);

      if (result.updateAvailable) {
        const dismissed = localStorage.getItem('dismissed_update_version');
        const dismissedAt = localStorage.getItem('dismissed_update_time');
        const now = Date.now();

        // If manual, always show. If automatic, only show if not dismissed within 24h for this version
        const wasRecentlyDismissed = 
          dismissed === result.latestVersion && 
          dismissedAt && 
          now - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000;

        if (isManual || !wasRecentlyDismissed) {
          setIsOpen(true);
        }
      } else if (isManual) {
        toast({
          title: "You're up to date!",
          description: `Universal Apps v${result.currentVersion} is the latest available release.`,
        });
      }
    } catch {
      if (isManual) {
        toast({
          title: 'Update check failed',
          description: 'Could not connect to update servers. Check your internet connection.',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    setPlatform(detectPlatform());

    // Auto-check on mount after 2 seconds (non-blocking)
    const timer = setTimeout(() => {
      runCheck(false);
    }, 2000);

    // Event listener for manual checks triggered from settings/navbar
    const handleManual = () => runCheck(true);
    window.addEventListener('check-for-updates-manual', handleManual);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('check-for-updates-manual', handleManual);
    };
  }, []);

  const handleDismiss = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem('dismissed_update_version', updateInfo.latestVersion);
      localStorage.setItem('dismissed_update_time', Date.now().toString());
    }
    setIsOpen(false);
  };

  const handleDownload = () => {
    if (updateInfo) {
      const targetUrl = updateInfo.recommendedAssetUrl || updateInfo.releaseUrl || 'https://github.com/HrshD1eux/Universal_apps/releases';
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  if (!isOpen || !updateInfo || !updateInfo.updateAvailable) {
    return null;
  }

  const platformLabel = 
    platform === 'windows' ? 'Windows (.exe / .msi)' :
    platform === 'mac' ? 'macOS (.dmg)' :
    platform === 'linux' ? 'Linux (.deb / .AppImage)' : 'Installer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg p-6 sm:p-8 bg-card border-2 border-primary/20 rounded-[2rem] shadow-2xl space-y-6 text-foreground overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Update Available</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Version v{updateInfo.latestVersion} is Ready
          </h2>

          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            A new version of Universal Apps is available. Please download the latest update for performance improvements, bug fixes, and new tools.
          </p>
        </div>

        {/* Version Comparison Box */}
        <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground block font-bold text-[10px] uppercase tracking-wider">Installed</span>
            <span className="font-mono font-bold text-foreground text-sm">v{updateInfo.currentVersion}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
          <div className="text-right">
            <span className="text-primary block font-black text-[10px] uppercase tracking-wider">Latest Release</span>
            <span className="font-mono font-black text-primary text-sm">v{updateInfo.latestVersion}</span>
          </div>
        </div>

        {/* Release Notes (if present) */}
        {updateInfo.releaseNotes && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Release Highlights</span>
            <div className="max-h-28 overflow-y-auto p-3 rounded-xl bg-muted/20 border text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed scrollbar-thin">
              {updateInfo.releaseNotes.slice(0, 400)}
              {updateInfo.releaseNotes.length > 400 && '...'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleDownload}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Download for {platformLabel}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.open(updateInfo.releaseUrl, '_blank', 'noopener,noreferrer');
                setIsOpen(false);
              }}
              className="flex-1 h-11 rounded-xl text-xs font-bold gap-1.5 border hover:bg-muted"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Release Notes</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="flex-1 h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>Remind Me Later</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
