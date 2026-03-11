import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Percent, GraduationCap, QrCode } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl">
          Universal Apps
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          One stop for all your Apps needs. Fast, beautiful, and easy to use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
        <Link href="/gst-calculator" passHref>
          <Card className="hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4 mx-auto">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">GST Calculator</CardTitle>
              <CardDescription className="text-center text-muted-foreground pt-2">
                Calculate Goods and Services Tax with ease for any amount.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full font-bold">Calculate GST</Button>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/marks-calculator" passHref>
          <Card className="hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-grow">
               <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4 mx-auto">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">Marks Calculator</CardTitle>
              <CardDescription className="text-center text-muted-foreground pt-2">
                Compute total marks and overall percentage from subject scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="default" className="w-full font-bold">Calculate Marks</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/percentage-calculator" passHref>
          <Card className="hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-grow">
               <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4 mx-auto">
                <Percent className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">Percentage Calculator</CardTitle>
              <CardDescription className="text-center text-muted-foreground pt-2">
                Find percentages for any values for various use cases.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="default" className="w-full font-bold">Calculate Percentage</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/qr-generator" passHref>
          <Card className="hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-grow">
               <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4 mx-auto">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">QR Code Generator</CardTitle>
              <CardDescription className="text-center text-muted-foreground pt-2">
                Generate QR codes from text, URLs, or text files.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="default" className="w-full font-bold">Generate QR Code</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
