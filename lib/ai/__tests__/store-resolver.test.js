/**
 * Tests for Store Name Resolution
 *
 * Run with: npm test lib/ai/__tests__/store-resolver.test.js
 */

import { extractStoreNames, needsStoreResolution } from '../intent-detection-haiku';

describe('Store Name Extraction', () => {
  test('extracts store name from "for" pattern', () => {
    const query = "Show me campaigns for Acme Store";
    const names = extractStoreNames(query);
    expect(names).toContain('Acme Store');
  });

  test('extracts store name from "at" pattern', () => {
    const query = "What's the revenue at My Boutique last month?";
    const names = extractStoreNames(query);
    expect(names).toContain('My Boutique');
  });

  test('extracts store name from "store" keyword', () => {
    const query = "How many orders in store XYZ?";
    const names = extractStoreNames(query);
    expect(names).toContain('XYZ');
  });

  test('ignores common words', () => {
    const query = "Show campaigns for the store";
    const names = extractStoreNames(query);
    expect(names).not.toContain('the');
  });

  test('removes duplicates', () => {
    const query = "Compare Acme Store and Acme Store";
    const names = extractStoreNames(query);
    expect(names).toEqual(['Acme Store']);
  });

  test('handles quoted store names', () => {
    const query = 'Show data for "Store ABC"';
    const names = extractStoreNames(query);
    expect(names).toContain('Store ABC');
  });
});

describe('Store Resolution Detection', () => {
  test('detects when store resolution is needed', () => {
    const query = "Show campaigns for Acme Store";
    const result = needsStoreResolution(query);
    expect(result.needed).toBe(true);
    expect(result.storeNames).toContain('Acme Store');
  });

  test('detects "my store" pattern', () => {
    const query = "What are my store campaigns?";
    const result = needsStoreResolution(query);
    expect(result.needed).toBe(false);
    expect(result.useUserStores).toBe(true);
  });

  test('handles queries without store reference', () => {
    const query = "What are my top campaigns?";
    const result = needsStoreResolution(query);
    expect(result.needed).toBe(false);
    expect(result.useUserStores).toBe(true);
  });
});

describe('Store Name Patterns', () => {
  const testCases = [
    {
      query: "Show campaigns for Acme Store last month",
      expected: ['Acme Store']
    },
    {
      query: "What's the revenue at Store XYZ?",
      expected: ['Store XYZ']
    },
    {
      query: "Compare Store A and Store B",
      expected: ['Store A'] // Pattern only catches first
    },
    {
      query: "How many orders in My Boutique?",
      expected: ['My Boutique']
    },
    {
      query: "Account ABC performance",
      expected: ['ABC']
    },
  ];

  testCases.forEach(({ query, expected }) => {
    test(`"${query}" extracts "${expected}"`, () => {
      const names = extractStoreNames(query);
      expected.forEach(name => {
        expect(names).toContain(name);
      });
    });
  });
});

// Mock tests for store resolution (requires MongoDB)
describe('Store Resolution Integration', () => {
  // These would need actual MongoDB connection
  test.skip('resolves exact store name match', async () => {
    // const { resolveStoreNames } = await import('../store-resolver');
    // const result = await resolveStoreNames(['Acme Store'], mockUser);
    // expect(result.stores.length).toBe(1);
  });

  test.skip('handles store not found', async () => {
    // const { resolveStoreNames } = await import('../store-resolver');
    // const result = await resolveStoreNames(['NonExistent'], mockUser);
    // expect(result.notFound).toContain('NonExistent');
  });

  test.skip('validates user permissions', async () => {
    // const { resolveStoreNames } = await import('../store-resolver');
    // const result = await resolveStoreNames(['Competitor Store'], mockUser);
    // expect(result.accessDenied).toContain('Competitor Store');
  });
});
