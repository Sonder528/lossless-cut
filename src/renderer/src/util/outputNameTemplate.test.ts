import { describe, test, expect, vi, beforeEach } from 'vitest';

import type { FileNameProblemType } from '../types';

vi.mock('../util', () => ({
  isWindows: true,
  isMac: false,
}));

vi.mock('../isDev', () => ({
  default: false,
}));

vi.mock('i18next', () => ({
  default: {
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'File name is empty') return 'File name is empty';
      if (key === 'File name contains invalid character(s): {{invalidChars}}') {
        return `File name contains invalid character(s): ${options?.invalidChars}`;
      }
      if (key === 'Duplicate file name with segment(s): {{segmentNumbers}}') {
        return `Duplicate file name with segment(s): ${options?.segmentNumbers}`;
      }
      if (key === 'File name is the same as the input path') return 'File name is the same as the input path';
      if (key === 'File name ends with a whitespace character or a dot, which is not allowed.') return 'File name ends with a whitespace character or a dot, which is not allowed.';
      if (key === 'File will have a too long path') return 'File will have a too long path';
      return key;
    },
  },
}));

const mockBasename = vi.fn((path: string) => {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || '';
});

const mockNormalize = vi.fn((path: string) => path);
const mockJoin = vi.fn((...paths: string[]) => paths.join('\\'));

vi.mock('node:path', () => ({
  parse: vi.fn(),
  sep: '\\',
  join: mockJoin,
  normalize: mockNormalize,
  basename: mockBasename,
}));

describe('outputNameTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDetailedTemplateProblems', () => {
    const { getDetailedTemplateProblems } = await import('./outputNameTemplate');

    test('should detect empty file names', () => {
      const result = getDetailedTemplateProblems({
        fileNames: ['valid.mp4', '', 'another.mp4'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      expect(result.problems.length).toBe(1);
      expect(result.problems[0].type).toBe('empty' as FileNameProblemType);
      expect(result.problems[0].segmentIndex).toBe(1);
    });

    test('should detect duplicate file names', () => {
      const result = getDetailedTemplateProblems({
        fileNames: ['segment1.mp4', 'segment2.mp4', 'segment1.mp4'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      expect(result.problems.length).toBe(2);
      expect(result.problems[0].type).toBe('duplicate' as FileNameProblemType);
      expect(result.problems[1].type).toBe('duplicate' as FileNameProblemType);
      expect(result.problems[0].segmentIndex).toBe(0);
      expect(result.problems[1].segmentIndex).toBe(2);
    });

    test('should detect invalid characters in file names', () => {
      mockBasename.mockReturnValue('input.mp4');
      mockNormalize.mockImplementation((path: string) => path);

      const result = getDetailedTemplateProblems({
        fileNames: ['valid.mp4', 'file:name.mp4', 'another.mp4'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      expect(result.problems.length).toBeGreaterThan(0);
      expect(result.problems.some(p => p.type === 'invalid_chars')).toBe(true);
    });

    test('should return no problems for valid file names', () => {
      mockBasename.mockReturnValue('input.mp4');

      const result = getDetailedTemplateProblems({
        fileNames: ['segment1.mp4', 'segment2.mp4', 'segment3.mp4'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(false);
      expect(result.problems.length).toBe(0);
    });

    test('should detect file name ending with space', () => {
      mockBasename.mockReturnValue('input.mp4');

      const result = getDetailedTemplateProblems({
        fileNames: ['valid.mp4', 'file name .mp4'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      expect(result.problems.some(p => p.type === 'ends_with_space_or_dot')).toBe(true);
    });

    test('should detect file name ending with dot', () => {
      mockBasename.mockReturnValue('input.mp4');

      const result = getDetailedTemplateProblems({
        fileNames: ['valid.mp4', 'file name.'],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      expect(result.problems.some(p => p.type === 'ends_with_space_or_dot')).toBe(true);
    });

    test('should sort problems by segment index', () => {
      const result = getDetailedTemplateProblems({
        fileNames: ['', 'valid.mp4', 'duplicate.mp4', 'duplicate.mp4', ''],
        filePath: 'C:\\test\\input.mp4',
        outputDir: 'C:\\test\\output',
        safeOutputFileName: true,
      });

      expect(result.hasProblems).toBe(true);
      const segmentIndices = result.problems.map(p => p.segmentIndex);
      const sortedIndices = [...segmentIndices].sort((a, b) => a - b);
      expect(segmentIndices).toEqual(sortedIndices);
    });
  });
});
