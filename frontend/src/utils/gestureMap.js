export function mapGesture(gesture) {
  switch (gesture) {
    case 'SwipeLeft':
      return 'PREV_SLIDE';
    case 'SwipeRight':
      return 'NEXT_SLIDE';
    case 'Fist':
      return 'NEXT_SONG';
    case 'Circle':
      return 'DETECT_SONG';
    default:
      return null;
  }
}
