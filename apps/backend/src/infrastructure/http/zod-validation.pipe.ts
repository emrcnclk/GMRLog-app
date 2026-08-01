import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { ZodType, type TypeOf, type ZodError } from 'zod';

/** Thrown by the global pipe; unwrapped to a `validation` envelope by the exception filter. */
export class ZodValidationException extends BadRequestException {
  constructor(readonly zodError: ZodError) {
    super('Validation failed');
  }
}

interface ZodDtoStatic {
  schema?: unknown;
}

/**
 * Structural schema guard. `instanceof ZodType` is not enough: shared schemas
 * from `@gmrlog/validators` may come from zod's CJS build while this module
 * loads the ESM build (dual-package hazard), giving two distinct class
 * identities for the same library version.
 */
function isZodSchema(value: unknown): value is ZodType {
  if (value instanceof ZodType) {
    return true;
  }
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { safeParse?: unknown }).safeParse === 'function'
  );
}

/**
 * Declares a transport DTO backed by a shared Zod schema (`@gmrlog/validators`).
 * The global `ZodValidationPipe` picks the schema up from the class; instances
 * are typed as the parsed schema output.
 *
 * Usage: `class CreateThingDto extends createZodDto(createThingSchema) {}`
 */
export function createZodDto<TSchema extends ZodType>(
  schema: TSchema,
): { new (): TypeOf<TSchema>; readonly schema: TSchema } {
  class ZodDto {
    static readonly schema = schema;
  }
  return ZodDto;
}

/**
 * Global validation pipeline. Applies only to params typed with a Zod-backed
 * DTO; everything else passes through untouched.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const metatype = metadata.metatype as ZodDtoStatic | undefined;
    const schema = metatype?.schema;
    if (!isZodSchema(schema)) {
      return value;
    }
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new ZodValidationException(result.error);
    }
    return result.data;
  }
}
