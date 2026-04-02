import React from 'react';

interface TeamDisplayNameProps {
  name: string;
  players?: string[];
  className?: string;
  isKnockout?: boolean;
}

const TeamDisplayName: React.FC<TeamDisplayNameProps> = ({ name, players, className = '', isKnockout = false }) => {
  const validPlayers = players?.filter(p => p.trim() !== '') || [];

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-bold ${isKnockout ? 'text-xs truncate w-full' : 'text-sm'}`}>
        {name}
      </span>
      {validPlayers.length > 0 && (
        <span className={`italic text-white/60 ${isKnockout ? 'text-[9px] truncate w-full' : 'text-[11px]'}`}>
          {validPlayers.join(' & ')}
        </span>
      )}
    </div>
  );
};

export default TeamDisplayName;
