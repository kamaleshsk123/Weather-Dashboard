import { WeatherDashboard } from '@/components/WeatherDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <WeatherDashboard />
    </ErrorBoundary>
  );
}