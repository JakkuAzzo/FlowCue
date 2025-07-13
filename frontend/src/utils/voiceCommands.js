export function parseCommand(text) {
  const lower = text.toLowerCase();
  if (lower.includes('next song')) return 'NEXT_SONG';
  if (lower.includes('next')) return 'NEXT_SLIDE';
  if (lower.includes('previous') || lower.includes('back')) return 'PREV_SLIDE';
  return null;
}
