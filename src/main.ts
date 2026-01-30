import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix but exclude health check endpoint for Railway/Docker health checks
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const allowedOrigins = [
    frontendUrl,
    adminUrl,
    backendUrl, // Backend itself (for Swagger UI)
    'http://localhost:5173', // Vite default dev port (frontend)
    'http://localhost:5174', // Vite admin panel dev port
    'http://localhost:4173', // Vite preview port
    'http://localhost:4174', // Vite admin preview port
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Resume Analyzer API')
    .setDescription('API for analyzing resumes and matching with job descriptions')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('resumes', 'Resume management endpoints')
    .addTag('jobs', 'Job description endpoints')
    .addTag('analysis', 'Resume analysis and job matching endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
