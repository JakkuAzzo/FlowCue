export default function useVoice(onCommand) {
  let recognition;
  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
      if (text.includes('next song')) onCommand('NEXT_SONG');
      else if (text.includes('next')) onCommand('NEXT_SLIDE');
      else if (text.includes('previous') || text.includes('back')) onCommand('PREV_SLIDE');
    };
    recognition.start();
  };
  const stop = () => recognition && recognition.stop();
  return { start, stop };
}
