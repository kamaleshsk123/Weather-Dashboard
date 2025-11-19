/**
 * Custom error classes for historical weather functionality
 */

export class HistoricalWeatherError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'HistoricalWeatherError';
  }
}

export class DateValidationError extends HistoricalWeatherError {
  constructor(message: string) {
    super(message, 'DATE_VALIDATION_ERROR');
    this.name = 'DateValidationError';
  }
}

export class APILimitError extends HistoricalWeatherError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'API_LIMIT_ERROR', 429);
    this.name = 'APILimitError';
    this.retryAfter = retryAfter;
  }

  public retryAfter?: number;
}

export class DataUnavailableError extends HistoricalWeatherError {
  constructor(message: string, public availableRange?: { start: Date; end: Date }) {
    super(message, 'DATA_UNAVAILABLE_ERROR', 404);
    this.name = 'DataUnavailableError';
  }
}

export class NetworkError extends HistoricalWeatherError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Error handler utility for historical weather operations
 */
export class HistoricalWeatherErrorHandler {
  /**
   * Handle API errors and convert them to appropriate custom errors
   */
  static handleAPIError(error: unknown, context?: string): HistoricalWeatherError {
    if (error instanceof HistoricalWeatherError) {
      return error;
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError(
        'Network connection failed. Please check your internet connection.',
        error
      );
    }

    // Handle HTTP status errors
    if (typeof error === 'object' && error !== null && ('status' in error || 'statusCode' in error)) {
      const status = (error as { status?: number; statusCode?: number }).status || (error as { status?: number; statusCode?: number }).statusCode;
      
      switch (status) {
        case 401:
          return new HistoricalWeatherError(
            'Invalid API key. Please check your OpenWeatherMap API key configuration.',
            'INVALID_API_KEY',
            401
          );
        
        case 403:
          return new HistoricalWeatherError(
            'Access forbidden. Your API key may not have access to historical weather data.',
            'ACCESS_FORBIDDEN',
            403
          );
        
        case 404:
          return new DataUnavailableError(
            'Historical weather data is not available for the requested date and location.'
          );
        
        case 429:
          const headers = (typeof error === 'object' && error !== null && 'headers' in error) ? (error as { headers?: { [key: string]: string } }).headers : undefined;
          const retryAfter = headers?.['retry-after'] 
            ? parseInt(headers['retry-after']) 
            : undefined;
          return new APILimitError(
            'API rate limit exceeded. Please try again later.',
            retryAfter
          );
        
        case 500:
        case 502:
        case 503:
          return new HistoricalWeatherError(
            'Weather service is temporarily unavailable. Please try again later.',
            'SERVICE_UNAVAILABLE',
            status
          );
        
        default:
          return new HistoricalWeatherError(
            `Weather service error (${status}). Please try again.`,
            'API_ERROR',
            status
          );
      }
    }

    // Handle generic errors
    const message = ((typeof error === 'object' && error !== null && 'message' in error) ? (error as { message?: string }).message : undefined) || 'An unexpected error occurred while fetching weather data.';
    const contextMessage = context ? `${context}: ${message}` : message;
    
    return new HistoricalWeatherError(contextMessage, 'UNKNOWN_ERROR');
  }

  /**
   * Get user-friendly error message for display
   */
  static getUserFriendlyMessage(error: HistoricalWeatherError): string {
    switch (error.code) {
      case 'DATE_VALIDATION_ERROR':
        return 'Please select a valid date. Historical data is only available for past dates within the last year.';
      
      case 'API_LIMIT_ERROR':
        const retryMessage = error instanceof APILimitError && error.retryAfter
          ? ` Please try again in ${error.retryAfter} seconds.`
          : ' Please try again in a few minutes.';
        return 'Too many requests.' + retryMessage;
      
      case 'DATA_UNAVAILABLE_ERROR':
        return 'Weather data is not available for the selected date. Try a more recent date or check if the location is valid.';
      
      case 'NETWORK_ERROR':
        return 'Unable to connect to weather service. Please check your internet connection and try again.';
      
      case 'INVALID_API_KEY':
        return 'Weather service configuration error. Please contact support.';
      
      case 'ACCESS_FORBIDDEN':
        return 'Historical weather data access is not available with your current plan.';
      
      case 'SERVICE_UNAVAILABLE':
        return 'Weather service is temporarily unavailable. Please try again later.';
      
      default:
        return 'Unable to fetch weather data. Please try again.';
    }
  }

  /**
   * Get suggested actions for error recovery
   */
  static getSuggestedActions(error: HistoricalWeatherError): string[] {
    const actions: string[] = [];

    switch (error.code) {
      case 'DATE_VALIDATION_ERROR':
        actions.push('Select a date within the past year');
        actions.push('Ensure the date is not in the future');
        break;
      
      case 'API_LIMIT_ERROR':
        actions.push('Wait a few minutes before trying again');
        actions.push('Reduce the frequency of requests');
        break;
      
      case 'DATA_UNAVAILABLE_ERROR':
        actions.push('Try a more recent date');
        actions.push('Verify the location is correct');
        actions.push('Check if data exists for nearby dates');
        break;
      
      case 'NETWORK_ERROR':
        actions.push('Check your internet connection');
        actions.push('Try refreshing the page');
        actions.push('Disable any VPN or proxy');
        break;
      
      case 'INVALID_API_KEY':
      case 'ACCESS_FORBIDDEN':
        actions.push('Contact support for assistance');
        break;
      
      case 'SERVICE_UNAVAILABLE':
        actions.push('Try again in a few minutes');
        actions.push('Check service status');
        break;
      
      default:
        actions.push('Try again');
        actions.push('Refresh the page');
        actions.push('Contact support if the problem persists');
    }

    return actions;
  }

  /**
   * Log error with appropriate level and context
   */
  static logError(error: HistoricalWeatherError, context?: unknown): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      context,
      timestamp: new Date().toISOString()
    };

    // Log based on error severity
    if (error.statusCode && error.statusCode >= 500) {
      console.error('Historical Weather Service Error:', logData);
    } else if (error.code === 'NETWORK_ERROR' || error.statusCode === 429) {
      console.warn('Historical Weather Warning:', logData);
    } else {
      console.info('Historical Weather Info:', logData);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: HistoricalWeatherError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'API_LIMIT_ERROR'
    ];

    const retryableStatusCodes = [429, 500, 502, 503, 504];

    return retryableCodes.includes(error.code) || 
           (error.statusCode !== undefined && retryableStatusCodes.includes(error.statusCode));
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(error: HistoricalWeatherError, attempt: number): number {
    if (error instanceof APILimitError && error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return delay + jitter;
  }
}
/**

 * Retry utility for historical weather API calls with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  context: string = 'operation'
): Promise<T> {
  let lastError: HistoricalWeatherError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = HistoricalWeatherErrorHandler.handleAPIError(error, context);
      
      // Don't retry if it's not a retryable error
      if (!HistoricalWeatherErrorHandler.isRetryable(lastError)) {
        HistoricalWeatherErrorHandler.logError(lastError, { attempt, context });
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        HistoricalWeatherErrorHandler.logError(lastError, { attempt, context, final: true });
        throw lastError;
      }

      // Calculate delay and wait before retrying
      const delay = HistoricalWeatherErrorHandler.getRetryDelay(lastError, attempt);
      
      console.warn(
        `Retrying ${context} (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms delay`,
        { error: lastError.message, code: lastError.code }
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}