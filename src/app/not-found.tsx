import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Cloud } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Cloud className="w-16 h-16 text-blue-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            404 - Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Looks like this page got lost in the clouds! The weather data you&apos;re looking for doesn&apos;t exist.
          </p>
          
          <Link href="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Weather Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}