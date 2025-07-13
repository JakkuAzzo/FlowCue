export default function useGestures(onGesture) {
  const handler = (e) => {
    if (e.key === 'ArrowRight') onGesture('NEXT_SLIDE');
    if (e.key === 'ArrowLeft') onGesture('PREV_SLIDE');
  };
  const start = () => window.addEventListener('keydown', handler);
  const stop = () => window.removeEventListener('keydown', handler);
  return { start, stop };
}
