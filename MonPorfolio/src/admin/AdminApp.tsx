import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  User,
  Trophy,
  Palette,
  FolderKanban,
  Cpu,
  BarChart3,
  LogOut,
} from 'lucide-react';
import Lockscreen, { SESSION_KEY } from './Lockscreen';
import { logoutAdmin, verifyAdminSession } from '../services/authService';
import ProfileTab from './tabs/ProfileTab';
import CompetitionsTab from './tabs/CompetitionsTab';
import CreationsTab from './tabs/CreationsTab';
import ProjectsTab from './tabs/ProjectsTab';
import TechnologiesTab from './tabs/TechnologiesTab';
import StatsTab from './tabs/StatsTab';

const TABS = [
  { id: 'stats', label: 'Statistiques', icon: BarChart3, Component: StatsTab },
  { id: 'profile', label: 'Profil', icon: User, Component: ProfileTab },
  { id: 'competitions', label: 'Compétitions', icon: Trophy, Component: CompetitionsTab },
  { id: 'creations', label: 'Créations visuelles', icon: Palette, Component: CreationsTab },
  { id: 'projects', label: 'Projets', icon: FolderKanban, Component: ProjectsTab },
  { id: 'tech', label: 'Technologies', icon: Cpu, Component: TechnologiesTab },
];

export default function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [activeTab, setActiveTab] = useState('stats');

  // Session Supabase expirée ou fermée ailleurs : on revient à l'écran de connexion.
  useEffect(() => {
    if (!unlocked) return;
    verifyAdminSession().then((ok) => {
      if (!ok) {
        sessionStorage.removeItem(SESSION_KEY);
        setUnlocked(false);
      }
    });
  }, [unlocked]);

  if (!unlocked) {
    return <Lockscreen onUnlock={() => setUnlocked(true)} />;
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component ?? StatsTab;

  return (
    <div className="min-h-screen bg-zinc-100 flex">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 flex-shrink-0 bg-zinc-950 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-blue-400" size={20} />
            <span className="font-black tracking-tight">ADMIN</span>
          </div>
          <p className="text-zinc-500 text-xs mt-1">Portfolio  Traoré Rice-Aliman</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800 space-y-1">
          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            ← Voir le site
          </a>
          <button
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              logoutAdmin();
              setUnlocked(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Verrouiller
          </button>
        </div>
      </aside>

      {/* --- MOBILE TAB BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 flex overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 text-[10px] font-bold uppercase tracking-wide ${
                isActive ? 'text-blue-400' : 'text-zinc-500'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 pb-24 md:pb-8">
        <ActiveComponent />
      </main>
    </div>
  );
}
