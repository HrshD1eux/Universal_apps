import BatchImageConverter from '@/components/batch-image-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline Batch Image Converter & Compressor | Universal Apps',
  description: 'Fast, client-side batch image conversion to WebP, PNG, and JPEG with quality and resize controls.',
};

export default function ImageConverterPage() {
  return <BatchImageConverter />;
}
