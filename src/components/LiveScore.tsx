import { useState, useEffect } from 'react';
import type { Match } from '../store/useTournamentStore';
import { Plus, Minus, Check, Clock, Save, CalendarDays, Play } from 'lucide-react';
import TeamDisplayName from './TeamDisplayName';

interface LiveScoreProps {
  match: Match;
  team1Name: string;
  team1Players?: string[];
  team2Name: string;
  team2Players?: string[];
  groupName?: string;
  isAdmin: boolean;
  onUpdate: (matchId: string, team1Score: number[], team2Score: number[], isFinished: boolean, matchStatus: 'scheduled' | 'live' | 'finished') => Promise<void>;
  onScheduleUpdate?: (matchId: string, scheduledAt: string) => Promise<void>;
}

const LiveScore = ({ match, team1Name, team1Players, team2Name, team2Players, groupName, isAdmin, onUpdate, onScheduleUpdate }: LiveScoreProps) => {
  const [t1Score, setT1Score] = useState<number[]>([...match.team1Score]);
  const [t2Score, setT2Score] = useState<number[]>([...match.team2Score]);
  const [isFinished, setIsFinished] = useState(match.isFinished);
  const [matchStatus, setMatchStatus] = useState<'scheduled' | 'live' | 'finished'>(match.status || (match.isFinished ? 'finished' : 'scheduled'));
  const [isUpdating, setIsUpdating] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(match.scheduledAt || '');

  // Local state for input values to prevent locking while typing
  const [localT1Score, setLocalT1Score] = useState<string[]>(match.team1Score.map(String));
  const [localT2Score, setLocalT2Score] = useState<string[]>(match.team2Score.map(String));

  // Sync local score when external state changes (e.g., from buttons)
  useEffect(() => {
    setLocalT1Score(t1Score.map(String));
  }, [t1Score]);

  useEffect(() => {
    setLocalT2Score(t2Score.map(String));
  }, [t2Score]);

  const handleScoreChange = async (team: 1 | 2, setIndex: number, delta: number) => {
    if (isFinished || !isAdmin || isUpdating || matchStatus !== 'live') return;

    setIsUpdating(true);
    const newT1Score = [...t1Score];
    const newT2Score = [...t2Score];

    if (team === 1) {
      newT1Score[setIndex] = Math.max(0, newT1Score[setIndex] + delta);
      setT1Score(newT1Score);
    } else {
      newT2Score[setIndex] = Math.max(0, newT2Score[setIndex] + delta);
      setT2Score(newT2Score);
    }

    await onUpdate(match.id, newT1Score, newT2Score, false, 'live');
    setIsUpdating(false);
  };

  const addSet = async () => {
    if (isFinished || !isAdmin || isUpdating) return;
    const newT1Score = [...t1Score, 0];
    const newT2Score = [...t2Score, 0];
    setT1Score(newT1Score);
    setT2Score(newT2Score);
    await onUpdate(match.id, newT1Score, newT2Score, false, 'live');
  };

  const closeMatch = async () => {
    if (!isAdmin || isUpdating) return;
    if (window.confirm("Sei sicuro di voler chiudere la partita? Questo aggiornerà definitivamente le classifiche o l'avanzamento tabellone.")) {
        setIsUpdating(true);
        setIsFinished(true);
        setMatchStatus('finished');
        await onUpdate(match.id, t1Score, t2Score, true, 'finished');
        setIsUpdating(false);
    }
  };

  const startMatch = async () => {
    if (!isAdmin || isUpdating) return;
    setIsUpdating(true);
    setMatchStatus('live');
    await onUpdate(match.id, t1Score, t2Score, false, 'live');
    setIsUpdating(false);
  }

  const handleScheduleSave = async () => {
    if (!onScheduleUpdate || isUpdating) return;
    setIsUpdating(true);
    await onScheduleUpdate(match.id, scheduleTime);
    setShowSchedule(false);
    setIsUpdating(false);
  };

  return (
    <div className={`glass-panel p-4 flex flex-col gap-4 relative transition-all ${isFinished ? 'opacity-70 grayscale-[30%] border-[rgba(255,255,255,0.1)]' : matchStatus === 'live' ? 'border-l-[4px] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-l-[4px] border-neon-blue'}`}>
      <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.1)] pb-2">
        <span className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2">
            {groupName || match.phaseType.replace('_', ' ')}
            {matchStatus === 'live' && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span> LIVE</span>}
        </span>

        <div className="flex items-center gap-2">
           {match.scheduledAt && !showSchedule && matchStatus !== 'live' && !isFinished && (
               <span className="text-xs font-mono bg-neon-orange/20 text-neon-orange px-2 py-1 rounded flex items-center gap-1">
                   <CalendarDays className="w-3 h-3" /> {new Date(match.scheduledAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}
               </span>
           )}
           {isAdmin && !isFinished && onScheduleUpdate && (
             <button onClick={() => setShowSchedule(!showSchedule)} className="text-gray-400 hover:text-neon-orange transition-colors" title="Imposta Orario">
               <Clock className="w-4 h-4" />
             </button>
           )}
           {isFinished && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold flex items-center gap-1"><Check className="w-3 h-3" /> FINITA</span>}
        </div>
      </div>

      {showSchedule && isAdmin && (
          <div className="flex items-center gap-2 bg-[#0b0c10] p-2 rounded border border-neon-orange/30">
              <input
                 type="datetime-local"
                 value={scheduleTime}
                 onChange={(e) => setScheduleTime(e.target.value)}
                 className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-600"
              />
              <button onClick={handleScheduleSave} disabled={isUpdating} className="text-neon-orange hover:text-white p-1">
                  <Save className="w-4 h-4" />
              </button>
          </div>
      )}

      <div className="flex flex-col gap-3">
        {[{name: team1Name, players: team1Players}, {name: team2Name, players: team2Players}].map((team, teamIdx) => {
            const isTeam1 = teamIdx === 0;
            const currentScores = isTeam1 ? t1Score : t2Score;

            return (
              <div key={teamIdx} className="flex justify-between items-center bg-[rgba(0,0,0,0.3)] p-2 rounded-lg">
                <div className={`w-[45%] ${isFinished ? 'opacity-50' : ''}`}>
                    <TeamDisplayName name={team.name} players={team.players} className="truncate" />
                </div>
                <div className="flex items-center gap-2">
                   {currentScores.map((score, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-1 bg-[#1f2833] rounded px-1 border border-gray-700">
                        {isAdmin && !isFinished && matchStatus === 'live' && (
                          <button onClick={() => handleScoreChange(isTeam1 ? 1 : 2, setIdx, -1)} disabled={isUpdating} className="p-1 text-gray-400 hover:text-red-400"><Minus className="w-3 h-3" /></button>
                        )}

                        {isAdmin && !isFinished && matchStatus === 'live' ? (
                            <input
                                type="number"
                                value={isTeam1 ? localT1Score[setIdx] : localT2Score[setIdx]}
                                min="0"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (isTeam1) {
                                        const newScores = [...localT1Score];
                                        newScores[setIdx] = val;
                                        setLocalT1Score(newScores);
                                    } else {
                                        const newScores = [...localT2Score];
                                        newScores[setIdx] = val;
                                        setLocalT2Score(newScores);
                                    }
                                }}
                                onBlur={async () => {
                                    const val = parseInt(isTeam1 ? localT1Score[setIdx] : localT2Score[setIdx]);
                                    if (!isNaN(val) && val >= 0 && val !== score) {
                                        const delta = val - score;
                                        await handleScoreChange(isTeam1 ? 1 : 2, setIdx, delta);
                                    } else if (isNaN(val)) {
                                       // Reset to actual score if input is invalid/empty
                                        if (isTeam1) {
                                            const newScores = [...localT1Score];
                                            newScores[setIdx] = String(score);
                                            setLocalT1Score(newScores);
                                        } else {
                                            const newScores = [...localT2Score];
                                            newScores[setIdx] = String(score);
                                            setLocalT2Score(newScores);
                                        }
                                    }
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                                disabled={isUpdating}
                                className={`font-mono text-lg font-bold w-8 text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-neon-blue rounded text-neon-orange appearance-none hide-arrows`}
                                style={{ MozAppearance: 'textfield' }}
                            />
                        ) : (
                            <span className={`font-mono text-lg font-bold w-6 text-center ${isFinished ? 'text-gray-500' : 'text-neon-orange'}`}>{score}</span>
                        )}

                        {isAdmin && !isFinished && matchStatus === 'live' && (
                          <button onClick={() => handleScoreChange(isTeam1 ? 1 : 2, setIdx, 1)} disabled={isUpdating} className="p-1 text-gray-400 hover:text-green-400"><Plus className="w-3 h-3" /></button>
                        )}
                      </div>
                   ))}
                </div>
              </div>
            );
        })}
      </div>

      {isAdmin && !isFinished && (
        <div className="flex justify-between mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
           {matchStatus === 'live' ? (
               <>
                   <button onClick={addSet} disabled={isUpdating} className="text-xs text-neon-blue hover:text-white flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Nuovo Set
                   </button>
                   <button onClick={closeMatch} disabled={isUpdating} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" /> Chiudi Partita
                   </button>
               </>
           ) : (
               <button onClick={startMatch} disabled={isUpdating} className="w-full btn-secondary text-neon-orange border-neon-orange py-1 px-3 text-xs flex items-center justify-center gap-1 hover:bg-neon-orange hover:text-[#0b0c10]">
                  <Play className="w-3 h-3" /> Avvia Partita LIVE
               </button>
           )}
        </div>
      )}
    </div>
  );
};

export default LiveScore;
