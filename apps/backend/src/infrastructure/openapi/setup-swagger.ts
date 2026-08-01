import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

/**
 * Builds the Nest Swagger document for `/docs` (gated by API_DOCS_ENABLED).
 * Documents all mounted controllers; Zod request bodies use @ApiZodBody where applied.
 */
export function setupSwagger(app: INestApplication): OpenAPIObject {
  const documentConfig = new DocumentBuilder()
    .setTitle('GMRLOG API')
    .setDescription(
      'GMRLOG platform API — Version 1 (`/api/v1`). S1 success/error envelopes apply to all JSON responses.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Player access token (S1 §9)',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'Idempotency-Key',
        description: 'S1 §11 — required semantics when supplied on listed POST creates',
      },
      'idempotency-key',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-gmrlog-request-id',
        description: 'Optional client correlation id (S1 §10 / §11)',
      },
      'request-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  enrichStandardResponses(document);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  return document;
}

/** Ensure every operation declares the canonical S1 envelope outcomes. */
export function enrichStandardResponses(document: OpenAPIObject): void {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = pathItem[method];
      if (operation === undefined) continue;
      const responses = operation.responses;
      responses['401'] ??= { description: 'S1 authn error envelope' };
      responses['400'] ??= { description: 'S1 validation error envelope' };
      responses['429'] ??= {
        description: 'S1 rate error envelope · Retry-After header',
      };
      responses['500'] ??= {
        description: 'S1 internal error envelope (no stack leak)',
      };
    }
  }
}
