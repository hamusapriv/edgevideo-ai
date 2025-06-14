import { describe, it, expect } from 'vitest';
import { getItemTypeNameFromId } from '../voteService.js';

describe('getItemTypeNameFromId', () => {
  it('returns DB Product for type id 1', () => {
    expect(getItemTypeNameFromId(1)).toBe('DB Product');
  });

  it('returns DB Ticket for type id 2', () => {
    expect(getItemTypeNameFromId(2)).toBe('DB Ticket');
  });

  it('returns Deal for type id 3', () => {
    expect(getItemTypeNameFromId(3)).toBe('Deal');
  });

  it('returns Viator Ticket for type id 4', () => {
    expect(getItemTypeNameFromId(4)).toBe('Viator Ticket');
  });

  it('returns null for unknown type ids', () => {
    expect(getItemTypeNameFromId(999)).toBeNull();
  });
});
