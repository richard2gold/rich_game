import React from 'react';
import { Player } from '../types';
import { Sparkles, Brain, DollarSign, User, Building2, Wallet } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isActive }) => {
  const formatMoney = (val: number) => {
      if (val > 100000000) return `${(val/100000000).toFixed(1)}亿`;
      return `${(val/10000).toFixed(0)}万`;
  };

  return (
    <div className={`
      relative p-3 rounded-xl border transition-all duration-300 overflow-hidden group
      ${isActive 
        ? 'bg-slate-800 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-[1.02] z-10' 
        : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}
      ${player.isBankrupt ? 'grayscale opacity-40' : ''}
      ${!player.isAI ? 'ring-2 ring-blue-500/50 bg-slate-800/80' : ''}
    `}>
      {/* Human Badge */}
      {!player.isAI && (
          <div className="absolute -top-0 -right-0 bg-blue-600 text-[10px] px-2 py-0.5 rounded-bl-lg font-black tracking-widest text-white shadow-lg z-20">
              ME
          </div>
      )}

      <div className="flex items-center gap-3 relative z-10">
        <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl 
            ${player.color} border-2 border-white/10 shadow-lg shrink-0
            ${isActive ? 'animate-bounce' : ''}
        `}>
          {player.avatar}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1">
            <h3 className={`font-bold truncate text-sm flex items-center gap-1 ${!player.isAI ? 'text-blue-300' : 'text-gray-200'}`}>
                {player.name}
            </h3>
            {player.isBankrupt && <span className="text-[10px] text-white font-bold bg-red-600 px-1.5 rounded">OUT</span>}
          </div>
          
          {/* Money & Net Worth */}
          <div className="grid grid-cols-2 gap-1">
              <div className={`flex items-center gap-1 font-mono font-bold text-sm ${player.money < 0 ? 'text-red-400' : 'text-yellow-400'}`} title="现金">
                <DollarSign size={12} />
                {formatMoney(player.money)}
              </div>
              <div className="flex items-center gap-1 font-mono text-xs text-gray-400" title="总身价">
                <Wallet size={12} />
                {formatMoney(player.netWorth)}
              </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-medium">
             <span className="flex items-center gap-0.5" title="地产数量">
                 <Building2 size={10} className="text-indigo-400"/> 
                 <span className="text-slate-300">{player.properties.length}</span>
             </span>
             <span className="flex items-center gap-0.5" title="智商">
                 <Brain size={10}/> {player.iq}
             </span>
             <span className="flex items-center gap-0.5" title="运气">
                 <Sparkles size={10}/> {player.luck}
             </span>
          </div>
        </div>
      </div>
      
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_#eab308]"></div>
      )}
    </div>
  );
};