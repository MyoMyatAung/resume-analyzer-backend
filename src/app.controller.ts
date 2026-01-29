import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Root controller providing health check endpoint for
 * load balancers, container orchestrators, and monitoring systems.
 */
@Controller()
@ApiTags('Health')
export class AppController {
  /**
   * Health check endpoint - returns service status.
   * Used by Railway, Docker, and other orchestrators to verify the service is running.
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
