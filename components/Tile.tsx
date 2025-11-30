
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
  let borderClass = data.color || 'border-slate-600';
  let icon = '';

  switch (data.type) {
    case TileType.START: bgClass = 'bg-green-900'; icon = '🏁'; break;
    case TileType.CHANCE: bgClass = 'bg-indigo-900'; icon = '❓'; break;
    case TileType.JAIL: bgClass = 'bg-gray-800'; icon = '👮'; break;
    case TileType.BANK: bgClass = 'bg-yellow-900'; icon = '🏦'; break;
    case TileType.TAX: bgClass = 'bg-red-950'; icon = '📉'; break;
    case TileType.SHOP: bgClass = 'bg-purple-900'; icon = '🛒'; break;
    case TileType.PARK: bgClass = 'bg-emerald-800'; icon = '🌳'; break;
    case TileType.PROPERTY: bgClass = 'bg-slate-800'; break;
  }

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
        border-[3px] rounded-lg cursor-pointer transition-all duration-300
        ${bgClass} ${borderClass}
        shadow-[0_4px_10px_rgba(0,0,0,0.5)]
        ${isCurrent ? 'z-30 brightness-110' : 'z-10 hover:z-20 hover:scale-105'}
        ${data.ownerId !== undefined && data.ownerId !== null ? '' : 'opacity-95'}
      `}
    >
      {/* Current Turn Glow */}
      {isCurrent && <div className="absolute inset-0 rounded-lg ring-2 ring-yellow-400 animate-pulse pointer-events-none"></div>}

      {/* Ownership Overlay */}
      {data.ownerId !== undefined && data.ownerId !== null && (
         <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-500/30 rounded-lg pointer-events-none border-2 border-red-500/50"></div>
      )}

      {/* Human Presence Arrow */}
      {humanIsHere && (
          <div className="absolute -top-10 animate-bounce text-2xl z-40 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">📍</div>
      )}

      {/* Name */}
      <div className="text-[10px] md:text-xs font-bold text-white text-center leading-tight z-10 px-1 w-full drop-shadow-md break-words">
        {data.name}
      </div>
      
      {/* Price/Rent */}
      {data.type === TileType.PROPERTY && data.price && (
         <div className="text-[9px] text-yellow-300 font-mono mt-1 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
             ¥{formatMoneyTiny(data.rent && data.level > 0 ? (data.rent * Math.pow(2.2, data.level-1)) : data.price)}
         </div>
      )}
      
      {/* Icons */}
      {data.type !== TileType.PROPERTY && (
          <div className="text-2xl mt-1 drop-shadow-lg">{icon}</div>
      )}

      {renderLevels()}

      {/* 3D DOLL FIGURES */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end justify-center -space-x-2 z-40 h-0">
        {playersOnTile.map((p, idx) => {
            const isMoving = false; // Could pass this in if needed
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
