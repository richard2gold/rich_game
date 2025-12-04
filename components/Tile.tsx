
import React from 'react';
import { TileData, TileType, Player } from '../types';

interface TileProps {
  data: TileData;
  playersOnTile: Player[];
  onClick: () => void;
  isCurrent: boolean;
  style?: React.CSSProperties;
}

const formatMoneyTiny = (amount: number) => {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}亿`;
  return `${(amount / 10000).toFixed(0)}万`;
};

export const Tile: React.FC<TileProps> = ({ data, playersOnTile, onClick, isCurrent, style }) => {
  let bgClass = 'bg-slate-800';
  let icon = '';
  
  // District-based Theming Logic
  const getThemeStyles = () => {
      switch(data.district) {
          case '浦东': return 'bg-gradient-to-br from-blue-900 to-slate-900 border-blue-400/50 shadow-blue-900/40';
          case '黄浦': return 'bg-gradient-to-br from-red-900 to-slate-900 border-red-400/50 shadow-red-900/40';
          case '静安': return 'bg-gradient-to-br from-orange-900 to-slate-900 border-orange-400/50 shadow-orange-900/40';
          case '徐汇': return 'bg-gradient-to-br from-purple-900 to-slate-900 border-purple-400/50 shadow-purple-900/40';
          case '郊区': return 'bg-gradient-to-br from-gray-800 to-slate-900 border-gray-500/50 shadow-gray-900/40';
          default: return 'bg-slate-800 border-slate-600';
      }
  };

  let themeClass = getThemeStyles();
  let specialClass = '';

  switch (data.type) {
    case TileType.START: specialClass = 'bg-gradient-to-br from-green-600 to-green-900 border-green-400 ring-4 ring-green-900/30'; icon = '🏁'; break;
    case TileType.CHANCE: specialClass = 'bg-gradient-to-br from-indigo-600 to-indigo-900 border-indigo-400'; icon = '❓'; break;
    case TileType.JAIL: specialClass = 'bg-gray-800 border-gray-500 border-dashed'; icon = '👮'; break;
    case TileType.BANK: specialClass = 'bg-yellow-900 border-yellow-500'; icon = '🏦'; break;
    case TileType.TAX: specialClass = 'bg-red-950 border-red-600'; icon = '📉'; break;
    case TileType.SHOP: specialClass = 'bg-purple-900 border-purple-500'; icon = '🛒'; break;
    case TileType.PARK: specialClass = 'bg-emerald-800 border-emerald-500'; icon = '🌳'; break;
  }

  // Use special class if not property, otherwise use theme
  const finalClass = data.type === TileType.PROPERTY ? themeClass : specialClass;

  // Building Levels (3D Stack)
  const renderLevels = () => {
    if (data.level === 0) return null;
    return (
      <div className="absolute -top-3 right-1 flex flex-col-reverse -space-y-1.5 z-20">
        {Array.from({ length: data.level }).map((_, i) => (
          <div key={i} className="w-5 h-2.5 bg-yellow-400 border border-yellow-600 shadow-md transform skew-x-12 rounded-sm" />
        ))}
      </div>
    );
  };

  const humanIsHere = playersOnTile.some(p => !p.isAI);

  return (
    <div 
      onClick={onClick}
      style={style}
      className={`
        absolute w-24 h-24 -ml-12 -mt-12
        flex flex-col items-center justify-center
        border-[3px] rounded-xl cursor-pointer transition-all duration-300
        ${finalClass}
        shadow-[0_10px_20px_rgba(0,0,0,0.6)]
        ${isCurrent ? 'z-30 brightness-110 scale-110' : 'z-10 hover:z-20 hover:scale-105'}
        ${data.ownerId !== undefined && data.ownerId !== null ? '' : 'opacity-95'}
      `}
    >
      {/* Current Turn Glow */}
      {isCurrent && <div className="absolute inset-0 rounded-xl ring-4 ring-yellow-400/50 animate-pulse pointer-events-none"></div>}

      {/* Ownership Overlay */}
      {data.ownerId !== undefined && data.ownerId !== null && (
         <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-500/40 rounded-xl pointer-events-none border-2 border-red-500/60"></div>
      )}

      {/* Human Presence Arrow */}
      {humanIsHere && (
          <div className="absolute -top-12 animate-bounce text-3xl z-40 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] filter hue-rotate-15">📍</div>
      )}

      {/* District Label (Top) */}
      {data.type === TileType.PROPERTY && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] text-white/70 px-1.5 rounded-full whitespace-nowrap border border-white/10 z-20">
            {data.district}
        </div>
      )}

      {/* Name */}
      <div className="text-[10px] md:text-xs font-bold text-white text-center leading-tight z-10 px-1 w-full drop-shadow-md break-words">
        {data.name}
      </div>
      
      {/* Price/Rent */}
      {data.type === TileType.PROPERTY && data.price && (
         <div className="text-[9px] text-yellow-200 font-mono mt-1 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5">
             ¥{formatMoneyTiny(data.rent && data.level > 0 ? (data.rent * Math.pow(2.2, data.level-1)) : data.price)}
         </div>
      )}
      
      {/* Icons */}
      {data.type !== TileType.PROPERTY && (
          <div className="text-2xl mt-1 drop-shadow-lg transform hover:scale-110 transition-transform">{icon}</div>
      )}

      {renderLevels()}

      {/* 3D DOLL FIGURES */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end justify-center -space-x-2 z-40 h-0 pointer-events-none">
        {playersOnTile.map((p, idx) => {
            return (
              <div 
                key={p.id}
                className={`
                    relative flex flex-col items-center transition-all duration-500
                    ${isCurrent && p.id === playersOnTile[0].id ? 'z-50' : 'z-30'}
                `}
                style={{ 
                    transform: `translateY(${idx * -2}px) translateX(${idx * 4}px)`,
                    zIndex: 100 - idx
                }}
              >
                  {/* Head */}
                  <div className={`
                      w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-lg bg-slate-200 z-20
                      ${p.isAI ? '' : 'ring-4 ring-yellow-400 scale-110'}
                  `}>
                      {p.avatar}
                  </div>
                  {/* Body */}
                  <div className={`
                      w-6 h-8 -mt-1 rounded-t-lg rounded-b-md shadow-lg z-10
                      ${p.color} border border-black/20
                  `}>
                      {/* Arm details */}
                      <div className="absolute left-0 top-2 w-1.5 h-4 bg-black/10 rounded-full"></div>
                      <div className="absolute right-0 top-2 w-1.5 h-4 bg-black/10 rounded-full"></div>
                  </div>
                  {/* Base/Stand */}
                  <div className="w-10 h-3 bg-black/40 rounded-[50%] blur-[1px] -mt-1 z-0"></div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
