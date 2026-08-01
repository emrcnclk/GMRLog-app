import { mePatchSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import { editProfileFormSchema } from '../hooks/edit-profile-form';

describe('edit profile validation', () => {
  it('accepts display name and bio within shared rules', () => {
    const form = editProfileFormSchema.parse({
      displayName: 'Ada',
      bio: 'Builds digital homes.',
    });
    const patch = mePatchSchema.parse({
      displayName: form.displayName,
      bio: form.bio,
    });
    expect(patch.displayName).toBe('Ada');
    expect(patch.bio).toBe('Builds digital homes.');
  });

  it('rejects empty display name', () => {
    expect(() => editProfileFormSchema.parse({ displayName: '  ', bio: '' })).toThrow();
  });

  it('clears bio with null on PATCH payload', () => {
    const patch = mePatchSchema.parse({
      displayName: 'Ada',
      bio: null,
    });
    expect(patch.bio).toBeNull();
  });

  it('rejects bio over 500 chars', () => {
    expect(() =>
      editProfileFormSchema.parse({
        displayName: 'Ada',
        bio: 'x'.repeat(501),
      }),
    ).toThrow();
  });
});
