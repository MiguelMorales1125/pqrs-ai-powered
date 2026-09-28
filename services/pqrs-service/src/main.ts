import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('PQRS Domain Microservice')
    .setDescription('Domain microservice for PQRS ingestion and AI triage')
    .setVersion('1.0')
    .addTag('Tickets')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 8002;
  await app.listen(port);
  console.log(`PQRS Service running on http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
}

bootstrap();
