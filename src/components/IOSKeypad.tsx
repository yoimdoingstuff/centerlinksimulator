import React from 'react';
import { Phone, Delete, Shuffle } from 'lucide-react';
import { playDTMFTone } from '../audio/dtmf';
import { triggerHaptic } from '../utils/haptics';
import { Mission } from '../types/game';

interface IOSKeypadProps {
  dialedNumber: string;
  onNumberChange: (num: string) => void;
  onCall: () => void;
  onKeyPress?: (key: string) => void;
  activeMission?: Mission;
  onShuffleMission?: () => void;
}

export const IOSKeypad: React.FC<IOSKeypadProps> = ({
  dialedNumber,
  onNumberChange,
  onCall,
  onKeyPress,
  activeMission,
  onShuffleMission,
}) => {
  const handleButtonPress = (key: string) => {
    triggerHaptic('light');
    playDTMFTone(key);
    if (onKeyPress) onKeyPress(key);
    onNumberChange(dialedNumber + key);
  };

  const handleBackspace = () => {
    triggerHaptic('selection');
    if (dialedNumber.length > 0) {
      onNumberChange(dialedNumber.slice(0, -1));
    }
  };

  const handleCallClick = () => {
    triggerHaptic('heavy');
    onCall();
  };

  const keys = [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
    { key: '*', letters: '' },
    { key: '0', letters: '+' },
    { key: '#', letters: '' },
  ];

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center select-none py-2">
      {/* Top Number Display */}
      <div className="h-20 flex flex-col items-center justify-center mb-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl sm:text-4xl font-light tracking-wider font-sans text-white drop-shadow-sm min-h-[44px] flex items-center">
            {dialedNumber || <span className="opacity-0">132 850</span>}
          </span>
          {dialedNumber.length > 0 && (
            <button
              type="button"
              onClick={handleBackspace}
              className="p-1.5 text-white/70 hover:text-white transition cursor-pointer"
              title="Delete"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </div>
        <span className="text-xs text-white/80 font-medium tracking-wide drop-shadow-xs">
          Centrelink (132 850)
        </span>
        {activeMission && (
          <div className="mt-2.5 w-full max-w-[280px] bg-black/25 backdrop-blur-md rounded-2xl px-3 py-1.5 border border-white/20 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex-1 text-left min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-white/60 block leading-tight">
                Calling About:
              </span>
              <span className="text-[11px] font-medium text-white/95 truncate block">
                {activeMission.title}
              </span>
            </div>
            {onShuffleMission && (
              <button
                type="button"
                onClick={onShuffleMission}
                className="px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[10px] text-white flex items-center gap-1 transition cursor-pointer shrink-0 font-medium active:scale-95"
                title="Switch dispute reason"
              >
                <Shuffle className="w-3 h-3" />
                <span>Shuffle</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* iOS 7 Circular Passcode-Style Keypad Grid */}
      <div className="grid grid-cols-3 gap-x-6 sm:gap-x-7 gap-y-4 mb-7">
        {keys.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleButtonPress(item.key)}
            className="w-19 h-19 sm:w-20 sm:h-20 rounded-full border border-white/50 bg-white/15 hover:bg-white/25 active:bg-white/45 backdrop-blur-md flex flex-col items-center justify-center text-white transition active:scale-95 cursor-pointer shadow-sm group"
          >
            <span className="text-3xl sm:text-4xl font-light leading-none -mt-0.5 text-white">
              {item.key}
            </span>
            {item.letters && (
              <span className="text-[9px] font-medium tracking-[0.25em] uppercase text-white/90 mt-1 leading-none">
                {item.letters}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* iOS 7 Big Circular Green Call Button */}
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={handleCallClick}
          className="w-19 h-19 sm:w-20 sm:h-20 rounded-full bg-[#4cd964] hover:bg-[#43c859] active:scale-90 text-white flex items-center justify-center shadow-2xl shadow-green-900/40 transition cursor-pointer"
          title="Place Call to Centrelink (132 850)"
        >
          <Phone className="w-8 h-8 fill-current" />
        </button>
      </div>
    </div>
  );
};
