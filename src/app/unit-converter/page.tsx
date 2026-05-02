import UnitConverter from '@/components/unit-converter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function UnitConverterPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <UnitConverter />
    </div>
  );
}
