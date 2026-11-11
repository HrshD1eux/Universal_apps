import TextDiffTool from '@/components/text-diff-tool';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline Text & Code Diff Tool | Universal Apps',
  description: 'Fast, secure offline text and code comparison with unified and split diff views.',
};

export default function TextDiffPage() {
  return <TextDiffTool />;
}
