import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type UseFormProps } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Shared RHF + Zod helper — schemas come from `@gmrlog/validators`.
 */
export function useAppForm<TSchema extends ZodType<FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<TSchema['_output']>, 'resolver'> & {
    defaultValues?: DefaultValues<TSchema['_output']>;
  },
) {
  return useForm<TSchema['_output']>({
    ...options,
    resolver: zodResolver(schema),
    mode: options?.mode ?? 'onBlur',
  });
}
