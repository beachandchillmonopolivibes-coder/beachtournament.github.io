import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, Check, Copy, Trophy, Play, PartyPopper } from 'lucide-react';
import GroupStandings from '../components/GroupStandings';
import LiveScore from '../components/LiveScore';
import { KnockoutBracket } from '../components/KnockoutBracket';

const TournamentView = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'bracket'>('standings');
  const [copied, setCopied] = useState(false);

  const { currentTournament, updateMatchScoreRealtime, updateMatchSchedule, subscribeToTournament, generateKnockoutBracket, archiveTournament } = useTournamentStore();
  const { userRole } = useAuthStore();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToTournament(id);
    return () => unsubscribe();
  }, [id, subscribeToTournament]);

  if (!currentTournament) return <div className="text-white text-center mt-10">Caricamento in corso o torneo non trovato...</div>;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTournament.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScoreUpdate = async (matchId: string, team1Score: number[], team2Score: number[], isFinished: boolean, matchStatus: 'scheduled' | 'live' | 'finished') => {
    if(!isAdmin) return;
    await updateMatchScoreRealtime(matchId, team1Score, team2Score, isFinished, matchStatus, currentTournament.id, currentTournament.apiKey);
  };

  const handleScheduleUpdate = async (matchId: string, scheduledTime: string) => {
    if(!isAdmin) return;
    await updateMatchSchedule(matchId, scheduledTime, currentTournament.id, currentTournament.apiKey);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20 p-4">
      <Link to="/" className="inline-flex items-center text-neon-blue hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Dashboard
      </Link>

      {currentTournament.isArchived && (
        <div className="glass-panel p-8 mb-8 border-[rgba(255,107,0,0.5)] shadow-[0_0_30px_rgba(255,107,0,0.3)] flex flex-col items-center justify-center gap-4 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-orange/10 to-neon-blue/10 pointer-events-none"></div>
          <PartyPopper className="w-16 h-16 text-neon-orange animate-bounce" />
          <h2 className="text-3xl font-bold text-white tracking-tight">Torneo Concluso!</h2>
          <p className="text-gray-300 text-lg">Il torneo {currentTournament.name} è stato archiviato e i dati sono ora in sola lettura.</p>
          <p className="text-sm font-bold text-neon-blue mt-2 border border-neon-blue/30 px-4 py-1 rounded-full bg-neon-blue/10">Modalità Sola Lettura</p>
        </div>
      )}

      <div className="glass-panel p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-[4px] border-l-neon-orange">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{currentTournament.name}</h1>
          <div className="text-gray-400 text-sm flex gap-4">
            <span>Gironi: {currentTournament.groupStageMode === 'single_set' ? 'Set Unico' : 'Best of 3'}</span>
            <span>•</span>
            <span>Fasi Finali: {currentTournament.knockoutMode === 'single_set' ? 'Set Unico' : 'Best of 3'}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-[#0b0c10]/80 p-3 rounded-xl border border-neon-blue/30 flex flex-col gap-2 min-w-[200px]">
            <div className="text-xs text-neon-blue font-semibold uppercase tracking-wider flex items-center gap-1">
              API Serverless Key
            </div>
            <div className="flex items-center justify-between bg-[#1f2833] rounded px-3 py-2 border border-gray-700">
              <code className="text-neon-blue text-sm truncate mr-2">{currentTournament.apiKey?.substring(0, 8)}...</code>
              <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors" title="Copia Chiave">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-[#1f2833]/50 p-1 rounded-lg border border-gray-800 backdrop-blur-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-md font-medium text-sm transition-all ${
            activeTab === 'standings' ? 'bg-neon-blue text-[#0b0c10] shadow-[0_0_15px_rgba(102,252,241,0.3)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Gironi e Classifiche
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-md font-medium text-sm transition-all ${
            activeTab === 'matches' ? 'bg-neon-orange text-[#0b0c10] shadow-[0_0_15px_rgba(255,101,47,0.3)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Risultati Live
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'bracket' ? 'bg-[#c5b4e3] text-[#0b0c10] shadow-[0_0_15px_rgba(197,180,227,0.5)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" /> Fasi Finali
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'standings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentTournament.groups.map(group => (
              <GroupStandings key={group.id} group={group} />
            ))}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Partite Gironi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentTournament.matches.filter(m => m.phaseType === 'groups').map(match => {
                const group = currentTournament.groups.find(g => g.id === match.groupId);
                const team1 = group?.teams.find(t => t.id === match.team1Id);
                const team2 = group?.teams.find(t => t.id === match.team2Id);

                if (!team1 || !team2) return null;

                return (
                  <LiveScore
                    key={match.id}
                    match={match}
                    team1Name={team1.name}
                    team1Players={team1.players}
                    team2Name={team2.name}
                    team2Players={team2.players}
                    groupName={group?.name}
                    isAdmin={isAdmin}
                    onUpdate={handleScoreUpdate}
                    onScheduleUpdate={handleScheduleUpdate}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'bracket' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Tabellone Fasi Finali</h2>
              <div className="flex gap-2">
                {isAdmin && !currentTournament.isArchived && currentTournament.matches.filter(m => m.phaseType !== 'groups').length === 0 && (
                  <button
                    onClick={() => generateKnockoutBracket(currentTournament.id)}
                    className="btn-primary flex items-center gap-2 bg-[#c5b4e3] text-[#0b0c10] hover:bg-transparent hover:text-[#c5b4e3] hover:border-[#c5b4e3] px-4 py-2 text-sm"
                  >
                    <Play className="w-4 h-4" /> Genera Tabellone Fasi Finali
                  </button>
                )}
                {isAdmin && !currentTournament.isArchived && currentTournament.matches.filter(m => m.phaseType === 'finals').some(m => m.isFinished) && (
                  <button
                    onClick={() => archiveTournament(currentTournament.id)}
                    className="btn-primary flex items-center gap-2 bg-neon-orange text-[#0b0c10] shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:bg-transparent hover:text-neon-orange hover:border-neon-orange px-4 py-2 text-sm"
                  >
                    <Trophy className="w-4 h-4" /> Chiudi Torneo e Incorona Vincitore
                  </button>
                )}
              </div>
            </div>

            <KnockoutBracket tournament={currentTournament} isAdmin={isAdmin && !currentTournament.isArchived} onScheduleUpdate={handleScheduleUpdate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentView;
