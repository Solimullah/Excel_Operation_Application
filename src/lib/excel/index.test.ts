import { describe, expect, it } from 'vitest';

import { readExcelFile } from './index';

/**
 * These cover the value-fidelity contract in the reader, which is the single
 * most damaging thing to get wrong: it is invisible on screen and only shows up
 * in the exported file.
 *
 * `raw: false` keeps cell values as formatted strings, so identifiers survive
 * the round trip. `defval: ""` keeps every row keyed identically.
 */

const asFile = (csv: string, name = 'test.csv') => new File([csv], name, { type: 'text/csv' });

describe('readExcelFile', () => {
  it('preserves a leading + on phone numbers instead of coercing to a number', async () => {
    const { data } = await readExcelFile(asFile('name,phone\nAlice,+15551234567\n'));

    expect(data[0].phone).toBe('+15551234567');
  });

  it('preserves leading zeros on postcodes', async () => {
    const { data } = await readExcelFile(asFile('city,postcode\nBoston,02101\n'));

    expect(data[0].postcode).toBe('02101');
  });

  it('keeps blank cells as empty strings so rows stay rectangular', async () => {
    const { data } = await readExcelFile(asFile('a,b,c\n1,,3\n'));

    expect(Object.keys(data[0])).toEqual(['a', 'b', 'c']);
    expect(data[0].b).toBe('');
  });

  it('derives columns from the first row', async () => {
    const { columns } = await readExcelFile(asFile('id,name,city\n1,Alice,Berlin\n'));

    expect(columns).toEqual(['id', 'name', 'city']);
  });

  it('returns empty data and columns for an empty sheet', async () => {
    const { data, columns } = await readExcelFile(asFile(''));

    expect(data).toEqual([]);
    expect(columns).toEqual([]);
  });
});
