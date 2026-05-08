import IncognitoQrExtractor from '@/components/incognito-qr-extractor';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Incognito QR Extractor | Universal Apps',
  description: 'Extract password-protected ZIP/RARs in 1000% memory-only mode. Zero disk traces.',
};

export default function IncognitoQrExtractorPage() {
  return (
    <div className="container mx-auto py-12 px-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full">
        <IncognitoQrExtractor />
      </div>
    </div>
  );
}
