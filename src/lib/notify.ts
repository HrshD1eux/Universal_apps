'use client';

import { toast } from '@/hooks/use-toast';

/**
 * Standardized application-wide task completion notification helper.
 * Provides consistent, clear visual feedback across all tools.
 */
export const notifySuccess = (title: string, description?: string) => {
  toast({
    title: `✓ ${title}`,
    description,
  });
};

export const notifyCompleted = (actionName = 'Task Completed', details?: string) => {
  toast({
    title: `✓ ${actionName}`,
    description: details || 'The operation finished successfully.',
  });
};

export const notifyCopied = (label = 'Result') => {
  toast({
    title: '✓ Copied to Clipboard',
    description: `${label} has been copied and is ready to paste.`,
  });
};

export const notifyDownloaded = (filename: string) => {
  toast({
    title: '✓ Download Started',
    description: `Saved "${filename}" to your downloads folder.`,
  });
};

export const notifyError = (title: string, description?: string) => {
  toast({
    title: `✕ ${title}`,
    description,
    variant: 'destructive',
  });
};
