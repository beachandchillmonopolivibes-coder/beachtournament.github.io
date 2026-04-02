import type { Group } from '../store/useTournamentStore';
import TeamDisplayName from './TeamDisplayName';

interface GroupStandingsProps {
  group: Group;
}

const GroupStandings = ({ group }: GroupStandingsProps) => {
  return (
    <div className="glass-panel p-6 border-l-[4px] border-l-neon-blue flex flex-col gap-4">
      <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[rgba(0,0,0,0.5)] border-b border-[rgba(255,255,255,0.1)] uppercase text-xs">
            <tr>
              <th className="py-3 px-4 rounded-tl-lg font-bold text-white">Squadra</th>
              <th className="py-3 px-2 text-center text-neon-blue" title="Punti Classifica">Pt</th>
              <th className="py-3 px-2 text-center" title="Set Vinti / Persi">Set</th>
              <th className="py-3 px-2 text-center" title="Punti Fatti / Subiti">P.ti</th>
              <th className="py-3 px-4 rounded-tr-lg text-center" title="Differenza Punti">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {group.teams.map((team, index) => (
              <tr key={team.id} className="hover:bg-[#1f2833] transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 2 ? 'bg-neon-orange text-[#0b0c10]' : 'bg-gray-800'}`}>
                    {index + 1}
                  </span>
                  <TeamDisplayName name={team.name} players={team.players} />
                </td>
                <td className="py-3 px-2 text-center font-bold text-neon-blue text-lg">
                  {team.points}
                </td>
                <td className="py-3 px-2 text-center font-mono">
                  <span className="text-green-400">{team.setsWon}</span> - <span className="text-red-400">{team.setsLost}</span>
                </td>
                <td className="py-3 px-2 text-center font-mono text-gray-500">
                  {team.totalPointsScored}:{team.totalPointsConceded}
                </td>
                <td className={`py-3 px-4 text-center font-bold ${team.totalPointsScored - team.totalPointsConceded > 0 ? 'text-green-400' : team.totalPointsScored - team.totalPointsConceded < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {team.totalPointsScored - team.totalPointsConceded > 0 ? '+' : ''}{team.totalPointsScored - team.totalPointsConceded}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupStandings;
