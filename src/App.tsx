import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/pages/MainMenu';
import { CharacterSelect } from '@/pages/CharacterSelect';
import { RuleRoom } from '@/pages/RuleRoom';
import { ItemWorkshop } from '@/pages/ItemWorkshop';
import { BattleArena } from '@/pages/BattleArena';
import { SeasonRanking } from '@/pages/SeasonRanking';

export default function App() {
  const { screen } = useGameStore();

  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return <MainMenu />;
      case 'select':
        return <CharacterSelect />;
      case 'rules':
        return <RuleRoom />;
      case 'workshop':
        return <ItemWorkshop />;
      case 'battle':
      case 'result':
        return <BattleArena />;
      case 'ranking':
        return <SeasonRanking />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="w-full h-full bg-[#05050f] overflow-hidden">
      <div className="scanline-overlay" />
      {renderScreen()}
    </div>
  );
}
