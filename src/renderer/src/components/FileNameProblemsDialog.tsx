import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaFile, FaArrowRight } from 'react-icons/fa';

import * as Dialog from './Dialog';
import { DialogButton } from './Button';
import { dangerColor, warningColor, primaryColor } from '../colors';
import type { FileNameProblem, FileNameProblemType, DetailedFileNameProblems } from '../types';


function getProblemIcon(type: FileNameProblemType) {
  switch (type) {
    case 'empty':
    case 'invalid_chars':
    case 'duplicate':
      return FaExclamationTriangle;
    case 'same_as_input':
    case 'ends_with_space_or_dot':
    case 'path_too_long':
    default:
      return FaExclamationTriangle;
  }
}

function getProblemColor(type: FileNameProblemType) {
  switch (type) {
    case 'empty':
    case 'invalid_chars':
    case 'duplicate':
      return dangerColor;
    case 'same_as_input':
    case 'ends_with_space_or_dot':
    case 'path_too_long':
    default:
      return warningColor;
  }
}

function getProblemTypeLabel(type: FileNameProblemType, t: (key: string) => string) {
  switch (type) {
    case 'empty':
      return t('Empty file name');
    case 'invalid_chars':
      return t('Invalid characters');
    case 'duplicate':
      return t('Duplicate file name');
    case 'same_as_input':
      return t('Same as input file');
    case 'ends_with_space_or_dot':
      return t('Invalid ending');
    case 'path_too_long':
      return t('Path too long');
    default:
      return t('Unknown problem');
  }
}

function ProblemItem({
  problem,
  onJumpToSegment,
}: {
  problem: FileNameProblem;
  onJumpToSegment?: (segmentIndex: number) => void;
}) {
  const { t } = useTranslation();

  const Icon = getProblemIcon(problem.type);
  const color = getProblemColor(problem.type);
  const typeLabel = getProblemTypeLabel(problem.type, t);

  const handleJump = useCallback(() => {
    onJumpToSegment?.(problem.segmentIndex);
  }, [onJumpToSegment, problem.segmentIndex]);

  return (
    <div
      style={{
        padding: '.8em',
        marginBottom: '.5em',
        borderRadius: '.3em',
        border: `1px solid var(--gray-6)`,
        background: 'var(--gray-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5em' }}>
        <Icon style={{ color, flexShrink: 0, marginTop: '.15em', fontSize: '1.1em' }} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5em', marginBottom: '.2em' }}>
            <span
              style={{
                fontWeight: 600,
                color,
                fontSize: '.85em',
                padding: '.1em .4em',
                borderRadius: '.2em',
                background: `${color}20`,
              }}
            >
              {typeLabel}
            </span>
            <span style={{ fontSize: '.85em', color: 'var(--gray-11)' }}>
              {t('Segment')} {problem.segmentIndex + 1}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.3em', marginBottom: '.3em' }}>
            <FaFile style={{ fontSize: '.9em', color: 'var(--gray-10)' }} />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '.9em',
                wordBreak: 'break-all',
                color: problem.fileName.length === 0 ? 'var(--gray-10)' : 'var(--gray-12)',
                fontStyle: problem.fileName.length === 0 ? 'italic' : 'normal',
              }}
            >
              {problem.fileName.length === 0 ? `(${t('empty')})` : problem.fileName}
            </span>
          </div>

          <div style={{ fontSize: '.9em', color: 'var(--gray-11)', marginBottom: '.5em' }}>
            {problem.message}
          </div>

          {problem.invalidChars != null && problem.invalidChars.length > 0 && (
            <div style={{ fontSize: '.85em', color: dangerColor, marginBottom: '.3em' }}>
              {t('Invalid characters found:')} <code style={{ background: 'var(--gray-3)', padding: '.1em .3em', borderRadius: '.2em' }}>
                {problem.invalidChars.map((c) => (c === ' ' ? '␣' : c)).join(' ')}
              </code>
            </div>
          )}

          {problem.duplicateWith != null && problem.duplicateWith.length > 0 && (
            <div style={{ fontSize: '.85em', color: dangerColor, marginBottom: '.3em' }}>
              {t('Duplicates with segment(s):')} {problem.duplicateWith.map((i) => i + 1).join(', ')}
            </div>
          )}
        </div>

        {onJumpToSegment != null && (
          <button
            type="button"
            onClick={handleJump}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '.3em',
              padding: '.4em .6em',
              borderRadius: '.3em',
              border: `1px solid ${primaryColor}`,
              background: 'transparent',
              color: primaryColor,
              cursor: 'pointer',
              fontSize: '.85em',
            }}
            title={t('Jump to segment')}
          >
            <FaArrowRight />
            {t('Locate')}
          </button>
        )}
      </div>
    </div>
  );
}

export interface FileNameProblemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailedProblems: DetailedFileNameProblems | undefined;
  onJumpToSegment?: (segmentIndex: number) => void;
  onContinue?: () => void;
  onCancel?: () => void;
  allowContinue?: boolean;
}

export default function FileNameProblemsDialog({
  open,
  onOpenChange,
  detailedProblems,
  onJumpToSegment,
  onContinue,
  onCancel,
  allowContinue = false,
}: FileNameProblemsDialogProps) {
  const { t } = useTranslation();

  const problems = useMemo(() => detailedProblems?.problems ?? [], [detailedProblems]);

  const problemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const problem of problems) {
      counts[problem.type] = (counts[problem.type] ?? 0) + 1;
    }
    return counts;
  }, [problems]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    onCancel?.();
  }, [onOpenChange, onCancel]);

  const handleContinue = useCallback(() => {
    onOpenChange(false);
    onContinue?.();
  }, [onOpenChange, onContinue]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (problemCounts['empty']) parts.push(t('{{count}} empty', { count: problemCounts['empty'] }));
    if (problemCounts['invalid_chars']) parts.push(t('{{count}} with invalid chars', { count: problemCounts['invalid_chars'] }));
    if (problemCounts['duplicate']) parts.push(t('{{count}} duplicates', { count: problemCounts['duplicate'] }));
    if (problemCounts['ends_with_space_or_dot']) parts.push(t('{{count}} with invalid ending', { count: problemCounts['ends_with_space_or_dot'] }));
    if (problemCounts['path_too_long']) parts.push(t('{{count}} with long path', { count: problemCounts['path_too_long'] }));
    if (problemCounts['same_as_input']) parts.push(t('{{count}} same as input', { count: problemCounts['same_as_input'] }));
    return parts.join(', ');
  }, [problemCounts, t]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content aria-describedby={t('File name problems detected')} style={{ width: '50em', maxHeight: '80vh' }}>
          <Dialog.Title>
            <FaExclamationTriangle style={{ color: dangerColor, marginRight: '.5em', verticalAlign: 'middle' }} />
            {t('File name problems detected')}
          </Dialog.Title>

          {problems.length > 0 && (
            <div style={{ marginBottom: '.8em', padding: '.6em .8em', background: `${dangerColor}15`, borderRadius: '.3em', fontSize: '.9em' }}>
              <div style={{ fontWeight: 600, marginBottom: '.2em' }}>
                {t('{{count}} problem(s) found with the output file names', { count: problems.length })}
              </div>
              {summary && (
                <div style={{ color: 'var(--gray-11)' }}>
                  {summary}
                </div>
              )}
              <div style={{ marginTop: '.3em', color: 'var(--gray-11)', fontSize: '.9em' }}>
                {t('Please fix these issues before exporting. Click "Locate" to jump to the corresponding segment.')}
              </div>
            </div>
          )}

          <div style={{ overflowY: 'auto', maxHeight: '40vh' }}>
            {problems.map((problem, index) => (
              <ProblemItem
                key={`${problem.segmentIndex}-${problem.type}-${index}`}
                problem={problem}
                onJumpToSegment={onJumpToSegment}
              />
            ))}
          </div>

          <Dialog.ButtonRow>
            <Dialog.Close asChild>
              <DialogButton onClick={handleCancel}>
                {t('Cancel')}
              </DialogButton>
            </Dialog.Close>
            {allowContinue && onContinue != null && (
              <DialogButton primary onClick={handleContinue} style={{ background: warningColor }}>
                {t('Continue anyway')}
              </DialogButton>
            )}
          </Dialog.ButtonRow>

          <Dialog.CloseButton />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
