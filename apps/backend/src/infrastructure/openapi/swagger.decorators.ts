import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, type ApiBodyOptions } from '@nestjs/swagger';
import type { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * OpenAPI helpers for S1-aligned Nest Swagger docs (D2.20).
 * Request bodies are projected from the same Zod schemas used at runtime.
 */

export function ApiDomainTags(...tags: string[]): ClassDecorator {
  return ApiTags(...tags);
}

export function ApiPlayerAuth(): ClassDecorator & MethodDecorator {
  return applyDecorators(ApiBearerAuth('bearer'));
}

/** Attaches an OpenAPI body schema projected from a Zod schema (S1 §19). */
export function ApiZodBody(
  schema: ZodType,
  options: Omit<ApiBodyOptions, 'schema'> = {},
): MethodDecorator {
  const jsonSchema = zodToJsonSchema(schema, {
    $refStrategy: 'none',
    target: 'openApi3',
  }) as Record<string, unknown>;
  const { $schema: _ignored, ...bodySchema } = jsonSchema;
  void _ignored;
  return ApiBody({
    ...options,
    schema: bodySchema,
  });
}
