'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Oops! Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-gray-600 mb-6"
            >
              {message}
            </motion.p>
            
            {onRetry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button onClick={onRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-4 text-sm text-gray-500 space-y-2"
            >
              <p>To fix this issue:</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenWeatherMap</a></li>
                <li>Create/edit <code className="bg-gray-100 px-1 rounded">.env.local</code> file in the project root</li>
                <li>Add: <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here</code></li>
                <li>Restart the development server</li>
              </ol>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};