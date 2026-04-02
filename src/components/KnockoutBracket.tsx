import { useState } from 'react';
import type { Match, Tournament } from '../store/useTournamentStore';
import LiveScore from './LiveScore';
import TeamDisplayName from './TeamDisplayName';
import { useTournamentStore } from '../store/useTournamentStore';

export function KnockoutBracket({ tournament, isAdmin, onScheduleUpdate }: { tournament: Tournament, isAdmin: boolean, onScheduleUpdate?: (matchId: string, scheduledTime: string) => Promise<void> }) {
  const bracketMatches = tournament.matches.filter(m => m.phaseType !== 'groups');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [manualSelectData, setManualSelectData] = useState<{matchId: string, slot: 'team1Id' | 'team2Id'} | null>(null);
  const updateMatchScoreRealtime = useTournamentStore((state) => state.updateMatchScoreRealtime);
  const setManualKnockoutTeam = useTournamentStore((state) => state.setManualKnockoutTeam);

  const handleScoreUpdate = async (matchId: string, team1Score: number[], team2Score: number[], isFinished: boolean, matchStatus: 'scheduled' | 'live' | 'finished') => {
    if(!isAdmin) return;
    await updateMatchScoreRealtime(matchId, team1Score, team2Score, isFinished, matchStatus, tournament.id, tournament.apiKey);
    const updatedMatch = tournament.matches.find(m => m.id === matchId);
    if(updatedMatch) setSelectedMatch({ ...updatedMatch, team1Score, team2Score, isFinished });
    if (isFinished) setSelectedMatch(null);
  };

  if (bracketMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl">
        <h3 className="text-xl font-bold text-gray-300 mb-2">Tabellone non ancora generato</h3>
      </div>
    );
  }

  const phases = ['round_16', 'quarter_finals', 'semi_finals', 'finals', 'third_place'].filter(p => bracketMatches.some(m => m.phaseType === p));

  const getTeamDisplay = (teamId: string | null, matchId: string, slot: 'team1Id' | 'team2Id', isFirstPhase: boolean, returnRawObj: boolean = false): any => {
    if (!teamId) {
        if (returnRawObj) return { name: 'TBD', players: [] };
        if (isAdmin && isFirstPhase) {
            return <button onClick={(e) => { e.stopPropagation(); setManualSelectData({matchId, slot}); }} className="text-[10px] bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-[#0b0c10] px-2 py-1 rounded transition-colors">Seleziona Squadra</button>;
        }
        return <span className="text-gray-500 italic text-xs">TBD</span>;
    }
    for (const group of tournament.groups) {
      const team = group.teams.find(t => t.id === teamId);
      if (team) {
          if (returnRawObj) return team;
          return <TeamDisplayName name={team.name} players={team.players} isKnockout={true} />;
      }
    }
    if (returnRawObj) return { name: 'Team Sconosciuto', players: [] };
    return <span className="text-gray-500 italic text-xs">TBD</span>;
  };

  const nonQualifiedTeams = tournament.groups.flatMap(g => g.teams).filter(t => !bracketMatches.some(m => m.team1Id === t.id || m.team2Id === t.id));

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="flex gap-8 min-w-max">
        {phases.map((phase, pIndex) => (
          <div key={phase} className="flex flex-col gap-6 w-80">
            <h3 className="text-center font-bold text-neon-orange uppercase tracking-wider mb-4 border-b border-[rgba(255,107,0,0.3)] pb-2">
              {phase === 'third_place' ? 'Finale 3°/4° Posto' : phase.replace('_', ' ')}
            </h3>

            <div className="flex flex-col justify-around h-full gap-8">
              {bracketMatches.filter(m => m.phaseType === phase && !m.isHomeAndAway).map((match) => {

                // Se è doppia sfida (best_of_3 mode), troviamo il ritorno
                const returnMatch = bracketMatches.find(m => m.nextMatchId === match.id && m.legIndex === 1);

                return (
                  <div key={match.id} className="relative glass-panel p-0 flex flex-col border-[rgba(255,107,0,0.2)] hover:border-neon-orange transition-all">

                    {/* Gara Andata / Gara Secca */}
                    <div
                        className={`p-4 cursor-pointer ${returnMatch ? 'border-b border-[rgba(255,255,255,0.1)]' : ''} ${match.status === 'live' ? 'bg-red-500/10' : ''}`}
                        onClick={() => isAdmin && match.team1Id && match.team2Id && setSelectedMatch(match)}
                    >
                        <div className="flex justify-between items-center mb-2">
                           {returnMatch && <div className="text-[10px] text-neon-blue font-bold uppercase">Andata</div>}
                           <div className="flex items-center gap-2">
                               {match.scheduledAt && match.status !== 'live' && !match.isFinished && <span className="text-[10px] text-gray-400">⏰ {new Date(match.scheduledAt).toLocaleString('it-IT', {day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>}
                               {match.status === 'live' && <span className="text-[10px] text-red-500 font-bold animate-pulse">LIVE</span>}
                               {match.isFinished && <span className="text-[10px] text-green-500 font-bold">FINITA</span>}
                           </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <div className={`truncate font-medium ${match.isFinished ? 'text-gray-400' : 'text-white'}`}>{getTeamDisplay(match.team1Id, match.id, 'team1Id', pIndex === 0)}</div>
                          <div className="text-neon-orange font-bold text-xs">{match.team1Score.join(' - ')}</div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className={`truncate font-medium ${match.isFinished ? 'text-gray-400' : 'text-white'}`}>{getTeamDisplay(match.team2Id, match.id, 'team2Id', pIndex === 0)}</div>
                          <div className="text-neon-orange font-bold text-xs">{match.team2Score.join(' - ')}</div>
                        </div>
                    </div>

                    {/* Gara Ritorno */}
                    {returnMatch && (
                        <div
                            className={`p-4 bg-[rgba(0,0,0,0.2)] cursor-pointer ${returnMatch.status === 'live' ? 'bg-red-500/10' : ''}`}
                            onClick={() => isAdmin && returnMatch.team1Id && returnMatch.team2Id && setSelectedMatch(returnMatch)}
                        >
                            <div className="flex justify-between items-center mb-2">
                               <div className="text-[10px] text-neon-orange font-bold uppercase">Ritorno</div>
                               <div className="flex items-center gap-2">
                                   {returnMatch.scheduledAt && returnMatch.status !== 'live' && !returnMatch.isFinished && <span className="text-[10px] text-gray-400">⏰ {new Date(returnMatch.scheduledAt).toLocaleString('it-IT', {day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>}
                                   {returnMatch.status === 'live' && <span className="text-[10px] text-red-500 font-bold animate-pulse">LIVE</span>}
                                   {returnMatch.isFinished && <span className="text-[10px] text-green-500 font-bold">FINITA</span>}
                               </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <div className={`truncate font-medium ${returnMatch.isFinished ? 'text-gray-400' : 'text-white'}`}>{getTeamDisplay(returnMatch.team1Id, returnMatch.id, 'team1Id', false)}</div>
                              <div className="text-neon-orange font-bold text-xs">{returnMatch.team1Score.join(' - ')}</div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div className={`truncate font-medium ${returnMatch.isFinished ? 'text-gray-400' : 'text-white'}`}>{getTeamDisplay(returnMatch.team2Id, returnMatch.id, 'team2Id', false)}</div>
                              <div className="text-neon-orange font-bold text-xs">{returnMatch.team2Score.join(' - ')}</div>
                            </div>
                        </div>
                    )}

                    {pIndex < phases.length - 1 && phase !== 'third_place' && (
                       <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-[rgba(255,107,0,0.3)]"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedMatch && isAdmin && selectedMatch.team1Id && selectedMatch.team2Id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,12,16,0.8)] backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel p-6 max-w-lg w-full relative border-[rgba(255,107,0,0.4)] shadow-[0_0_30px_rgba(255,107,0,0.2)]">
            <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-neon-orange mb-6 text-center">Aggiorna Risultato {selectedMatch.legIndex === 1 ? '(Ritorno)' : ''}</h3>

            <LiveScore
              match={selectedMatch}
              team1Name={(getTeamDisplay(selectedMatch.team1Id, selectedMatch.id, 'team1Id', false, true) as any).name}
              team1Players={(getTeamDisplay(selectedMatch.team1Id, selectedMatch.id, 'team1Id', false, true) as any).players}
              team2Name={(getTeamDisplay(selectedMatch.team2Id, selectedMatch.id, 'team2Id', false, true) as any).name}
              team2Players={(getTeamDisplay(selectedMatch.team2Id, selectedMatch.id, 'team2Id', false, true) as any).players}
              isAdmin={isAdmin}
              onUpdate={handleScoreUpdate}
              onScheduleUpdate={onScheduleUpdate}
            />
          </div>
        </div>
      )}

      {manualSelectData && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,12,16,0.8)] backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel p-6 max-w-sm w-full relative border-[rgba(0,243,255,0.4)] shadow-[0_0_30px_rgba(0,243,255,0.2)]">
            <button onClick={() => setManualSelectData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-lg font-bold text-neon-blue mb-4">Seleziona Squadra (Ripescaggio)</h3>
            <p className="text-sm text-gray-400 mb-4">L'algoritmo ha rilevato una parità assoluta. Seleziona manualmente quale squadra deve avanzare nel tabellone.</p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {nonQualifiedTeams.length === 0 && <p className="text-sm text-gray-500 italic">Nessuna squadra disponibile.</p>}
                {nonQualifiedTeams.map(team => (
                    <button
                        key={team.id}
                        onClick={async () => {
                            await setManualKnockoutTeam(manualSelectData.matchId, team.id, manualSelectData.slot);
                            setManualSelectData(null);
                        }}
                        className="text-left p-3 bg-[rgba(0,0,0,0.3)] hover:bg-[#1f2833] rounded border border-[rgba(255,255,255,0.05)] hover:border-neon-blue transition-colors text-sm font-medium"
                    >
                        {team.name}
                    </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
