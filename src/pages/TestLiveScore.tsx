import LiveScore from '../components/LiveScore';
import type { Match } from '../store/useTournamentStore';

export default function TestLiveScore() {
    const dummyMatch: Match = {
        id: '1',
        team1Id: 't1',
        team2Id: 't2',
        team1Score: [20],
        team2Score: [19],
        status: 'live',
        isFinished: false,
        phaseType: 'groups'
    };

    return (
        <div className="p-8 w-[400px]">
            <LiveScore
                match={dummyMatch}
                team1Name="Squadra 1"
                team1Players={["Mario Rossi", "Luigi Bianchi"]}
                team2Name="Squadra 2"
                team2Players={["Giuseppe Verdi", "Aldo Neri"]}
                groupName="Girone A"
                isAdmin={true}
                onUpdate={async () => {}}
            />
        </div>
    );
}
