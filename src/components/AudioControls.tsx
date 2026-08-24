import { Volume2, VolumeX } from 'lucide-react';

import { useSettingsStore } from '../stores/useSettingsStore';

export function AudioControls(): JSX.Element {
  const isMuted = useSettingsStore((state) => state.isMuted);
  const toggleMute = useSettingsStore((state) => state.toggleMute);

  return (
    <button
      aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
      className="fixed bottom-4 right-4 z-[60] inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-gold/28 bg-[linear-gradient(180deg,rgba(31,18,13,0.94),rgba(12,7,6,0.9))] text-primary-gold shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,221,153,0.06)] backdrop-blur-xl transition hover:border-primary-amber hover:text-primary-amber"
      type="button"
      onClick={toggleMute}
    >
      {isMuted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
