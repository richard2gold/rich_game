
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, GameState, TileType, GameLogEntry, TileData, Character, GlobalEventTarget } from './types';
import { MAP_NODES, CHARACTERS, INITIAL_MONEY, PASS_GO_REWARD } from './constants';
import { Tile } from './components/Tile';
import { PlayerCard } from './components/PlayerCard';
import { ActionModal } from './components/ActionModal';
import { generateBanter, generateFateEvent, generateGlobalEconomyEvent, generateBlackSwanEvent } from './services/geminiService';
import { Dices, Users, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, ArrowLeftCircle, MessageCircle, Skull, Brain, Sparkles, Map as MapIcon, Crosshair, Globe2, AlertTriangle } from 'lucide-react';

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 2400;
const ZOOM_LEVEL = 1;

const createInitialState = (selectedCharacterId: number): GameState => {
  const userChar = CHARACTERS.find(c => c.id === selectedCharacterId)!;
  const otherChars = CHARACTERS.filter(c => c.id !== selectedCharacterId);
  const shuffledOthers = [...otherChars].sort(() => 0.5 - Math.random());
  const selectedOpponents = shuffledOthers.slice(0, 6);
  const allSelectedChars = [userChar, ...selectedOpponents];

  const players = allSelectedChars.map((char, index) => ({
    ...char,
    money: INITIAL_MONEY,
    position: 0,
    isBankrupt: false,
    isJailed: 0,
    properties: [],
    isAI: index !== 0,
    netWorth: INITIAL_MONEY
  }));

  return {
    players,
    tiles: JSON.parse(JSON.stringify(MAP_NODES)),
    currentPlayerIndex: 0,
    turnCount: 1,
    gameStatus: 'PLAYING',
    lastDiceRoll: null,
    remainingSteps: 0,
    isMoving: false,
    pendingAction: 'NONE',
    logs: [{ id: 'init', text: '欢迎来到上海大富翁！', type: 'INFO' }],
    winner: null
  };
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
      players: [], tiles: [], currentPlayerIndex: 0, turnCount: 0, gameStatus: 'SETUP',
      lastDiceRoll: null, remainingSteps: 0, isMoving: false, pendingAction: 'NONE', logs: [], winner: null
  });
  
  const [speechBubble, setSpeechBubble] = useState<{playerId: number, text: string} | null>(null);
  const [modalState, setModalState] = useState<{isOpen: boolean; title: string; desc: string; image?: string; options: any[];}>({ isOpen: false, title: '', desc: '', options: [] });
  const [banner, setBanner] = useState<{title: string, desc: string, type: 'INFO'|'WARN'|'BAD'} | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  const getPixelCoords = (x: number, y: number) => ({ x, y }); // Already in pixels now

  const focusCamera = useCallback((x: number, y: number) => {
      if (!mapRef.current) return;
      const { clientWidth, clientHeight } = mapRef.current;
      let newX = -(x - clientWidth / 2);
      let newY = -(y - clientHeight / 2);
      const minX = -(MAP_WIDTH * ZOOM_LEVEL - clientWidth);
      const minY = -(MAP_HEIGHT * ZOOM_LEVEL - clientHeight);
      newX = Math.min(0, Math.max(minX, newX));
      newY = Math.min(0, Math.max(minY, newY));
      setCamera({ x: newX, y: newY });
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState.logs]);

  useEffect(() => {
      if (gameState.players.length > 0 && gameState.gameStatus === 'PLAYING') {
          const currentPlayer = gameState.players[gameState.currentPlayerIndex];
          const tile = gameState.tiles.find(t => t.id === currentPlayer.position);
          if (tile && !isDragging) {
              focusCamera(tile.x, tile.y);
          }
      }
  }, [gameState.currentPlayerIndex, gameState.isMoving, isDragging]);

  const addLog = (text: string, type: GameLogEntry['type'] = 'INFO') => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, { id: Date.now().toString(), text, type }] }));
  };

  const showBanner = (title: string, desc: string, type: 'INFO'|'WARN'|'BAD' = 'INFO') => {
      setBanner({ title, desc, type });
      setTimeout(() => setBanner(null), 4000); // Show for 4 seconds
  };

  const speak = async (player: Player, context: string, useCatchphrase = false) => {
    let text = player.catchphrase;
    if (!useCatchphrase) text = await generateBanter(player.name, context, player.catchphrase);
    setSpeechBubble({ playerId: player.id, text });
    setTimeout(() => setSpeechBubble(null), 3500);
  };

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === id ? { ...p, ...updates } : p) }));
  };

  const nextTurn = () => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      let attempts = 0;
      while (prev.players[nextIndex].isBankrupt && attempts < prev.players.length) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        attempts++;
      }
      const activePlayers = prev.players.filter(p => !p.isBankrupt);
      if (activePlayers.length <= 1) return { ...prev, gameStatus: 'GAME_OVER', winner: activePlayers[0] };
      return { ...prev, currentPlayerIndex: nextIndex, turnCount: nextIndex === 0 ? prev.turnCount + 1 : prev.turnCount, lastDiceRoll: null, pendingAction: 'NONE' };
    });
  };

  // --- EVENTS ---
  useEffect(() => {
     if (gameState.gameStatus === 'PLAYING' && gameState.currentPlayerIndex === 0 && gameState.turnCount > 1 && gameState.pendingAction === 'NONE') {
         if (gameState.turnCount % 20 === 0) triggerGlobalEvent(gameState.turnCount);
         else if (Math.random() < 0.05) triggerBlackSwanEvent();
     }
  }, [gameState.turnCount, gameState.currentPlayerIndex, gameState.gameStatus]);

  const triggerGlobalEvent = async (round: number) => {
      setGameState(prev => ({ ...prev, pendingAction: 'EVENT_PROCESSING' }));
      showBanner("全球事件", "正在计算世界局势...", "WARN");
      // Wait a bit for visibility
      await new Promise(r => setTimeout(r, 2000));
      
      const event = await generateGlobalEconomyEvent(round);
      
      setGameState(prev => {
          const playersSortedByMoney = [...prev.players].sort((a,b) => a.money - b.money);
          const medianMoney = playersSortedByMoney[Math.floor(playersSortedByMoney.length/2)].money;
          
          const newPlayers = prev.players.map(p => {
              if (p.isBankrupt) return p;
              let isTargeted = false;
              if (event.target === 'ALL') isTargeted = true;
              else if (event.target === 'POOR' && p.money <= medianMoney) isTargeted = true;
              else if (event.target === 'RICH' && p.money > medianMoney) isTargeted = true;
              else if (event.target === 'LANDLORDS' && p.properties.length > 3) isTargeted = true;
              else if (event.target === 'ODD_ID' && p.id % 2 !== 0) isTargeted = true;

              if (isTargeted) {
                  let change = Math.floor(p.money * (event.effectPercentage / 100));
                  if (Math.abs(change) < 2000000 && event.effectPercentage !== 0) change = event.effectPercentage > 0 ? 2000000 : -2000000;
                  return { ...p, money: p.money + change, netWorth: p.netWorth + change };
              }
              return p;
          });
          return { ...prev, players: newPlayers };
      });

      setModalState({ 
          isOpen: true, 
          title: event.title, 
          desc: `${event.description}\n\n目标: ${event.target === 'ALL' ? '所有人' : '部分玩家'}\n影响: ${event.effectPercentage > 0 ? '+' : ''}${event.effectPercentage}% 现金`, 
          image: "🌍", 
          options: [{ label: "确认", action: endAction, primary: true }] 
      });
      addLog(`[大事件] ${event.title}`, 'EVENT');
  };

  const triggerBlackSwanEvent = async () => {
      setGameState(prev => ({ ...prev, pendingAction: 'EVENT_PROCESSING' }));
      showBanner("黑天鹅", "至暗时刻降临...", "BAD");
      await new Promise(r => setTimeout(r, 2000));

      const event = await generateBlackSwanEvent();
      setGameState(prev => {
          let newPlayers = [...prev.players];
          let newTiles = [...prev.tiles];
          switch (event.action) {
              case 'WIPE_CASH': newPlayers = newPlayers.map(p => ({ ...p, money: 100000 })); break;
              case 'WIPE_PROPERTY': newTiles = newTiles.map(t => ({ ...t, level: 0 })); break;
              case 'SWAP_MONEY': 
                  const moneys = newPlayers.map(p => p.money);
                  const shuffled = moneys.sort(() => Math.random() - 0.5);
                  newPlayers = newPlayers.map((p, i) => ({ ...p, money: shuffled[i] })); 
                  break;
              case 'SUPER_TAX': newPlayers = newPlayers.map(p => ({ ...p, money: Math.floor(p.money * 0.5) })); break;
          }
          return { ...prev, players: newPlayers, tiles: newTiles };
      });
      setModalState({ isOpen: true, title: event.title, desc: event.description, image: "💀", options: [{ label: "挺住", action: endAction, primary: true }] });
  };

  // --- MOVEMENT ---
  const handleRollDice = async () => {
    if (gameState.isMoving || gameState.pendingAction !== 'NONE' || gameState.gameStatus === 'WAITING_FOR_DIRECTION') return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isAI && gameState.currentPlayerIndex !== 0) return; 

    if (currentPlayer.isJailed > 0) {
      addLog(`${currentPlayer.name} 蹲局子中...`, 'DANGER');
      updatePlayer(currentPlayer.id, { isJailed: currentPlayer.isJailed - 1 });
      setTimeout(nextTurn, 1000);
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastDiceRoll: roll, isMoving: true }));
    // Wait longer to see the dice roll
    setTimeout(() => performMovement(currentPlayer.id, roll), 800);
  };

  const performMovement = async (playerId: number, stepsRemaining: number) => {
    let currentSteps = stepsRemaining;
    const player = gameState.players.find(p => p.id === playerId)!;
    let currentTileId = player.position;

    while (currentSteps > 0) {
        // Slow down movement for visibility
        await new Promise(r => setTimeout(r, 600)); 
        const currentTile = gameState.tiles.find(t => t.id === currentTileId)!;
        focusCamera(currentTile.x, currentTile.y);

        if (currentTile.next.length > 1) {
             setGameState(prev => ({ ...prev, isMoving: false, gameStatus: 'WAITING_FOR_DIRECTION', remainingSteps: currentSteps }));
             if (player.isAI) {
                 setTimeout(() => handleDirectionSelect(currentTile.next[Math.floor(Math.random() * currentTile.next.length)]), 1500);
             }
             return; 
        }

        const nextId = currentTile.next[0];
        if (nextId === 0) {
             addLog(`经过起点! +¥${PASS_GO_REWARD/10000}万`, 'SUCCESS');
             setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === playerId ? { ...p, money: p.money + PASS_GO_REWARD } : p) }));
             showBanner("起点奖励", "资金 +1000万", "INFO");
        }
        currentTileId = nextId;
        currentSteps--;
        setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === playerId ? { ...p, position: currentTileId } : p) }));
    }
    setGameState(prev => ({ ...prev, isMoving: false }));
    handleTileLanding(currentTileId);
  };

  const handleDirectionSelect = (nextTileId: number) => {
      const steps = gameState.remainingSteps;
      const playerId = gameState.players[gameState.currentPlayerIndex].id;
      setGameState(prev => ({ 
          ...prev, 
          gameStatus: 'PLAYING', 
          remainingSteps: 0, 
          isMoving: true,
          players: prev.players.map(p => p.id === playerId ? { ...p, position: nextTileId } : p) 
      }));
      performMovement(playerId, steps - 1);
  };

  const handleTileLanding = async (posIndex: number) => {
    const tile = gameState.tiles.find(t => t.id === posIndex)!;
    const player = gameState.players[gameState.currentPlayerIndex];
    focusCamera(tile.x, tile.y);
    
    // Pause before action triggers to let user see where they landed
    await new Promise(r => setTimeout(r, 500));

    if (tile.type === TileType.PROPERTY) {
      if (tile.ownerId === undefined || tile.ownerId === null) {
        setGameState(prev => ({ ...prev, pendingAction: 'BUY_DECISION' }));
        promptBuyProperty(tile, player);
      } else if (tile.ownerId === player.id) {
        setGameState(prev => ({ ...prev, pendingAction: 'BUY_DECISION' }));
        promptUpgradeProperty(tile, player);
      } else {
        const owner = gameState.players.find(p => p.id === tile.ownerId)!;
        if (!owner.isJailed && !owner.isBankrupt) payRent(player, owner, tile);
        else nextTurn();
      }
    }
    else if (tile.type === TileType.CHANCE) triggerChanceEvent(player);
    else if (tile.type === TileType.JAIL) { addLog(`${player.name} 进局子`, 'INFO'); nextTurn(); }
    else if (tile.type === TileType.TAX) {
      const tax = 5000000;
      updatePlayer(player.id, { money: player.money - tax });
      addLog(`${player.name} 交税 ¥${tax/10000}万`, 'DANGER');
      showBanner("税务局", `缴纳税款 500万`, "BAD");
      setTimeout(() => { checkBankruptcy(player.id); nextTurn(); }, 1500);
    }
    else if (tile.type === TileType.BANK) {
        const bonus = 5000000;
        updatePlayer(player.id, { money: player.money + bonus });
        addLog("银行分红 ¥500万", 'SUCCESS');
        showBanner("银行", `领取利息 500万`, "INFO");
        nextTurn();
    }
    else nextTurn();
  };

  // --- ACTIONS ---
  const promptBuyProperty = (tile: TileData, player: Player) => {
    const cost = tile.price || 0;
    if (player.isAI) { setTimeout(() => { if (player.money > cost * 1.2) buyProperty(tile.id); else endAction(); }, 2000); } 
    else {
        setModalState({ isOpen: true, title: "购买地产", desc: `${tile.name}\n区域: ${tile.district}\n价格: ¥${cost/10000}万`, image: "🏠", options: [{ label: "买入", action: () => buyProperty(tile.id), primary: true, disabled: player.money < cost }, { label: "放弃", action: endAction }] });
    }
  };

  const promptUpgradeProperty = (tile: TileData, player: Player) => {
    const cost = (tile.price || 0) * 0.5;
    if (tile.level >= 5) { addLog("已满级", 'INFO'); setTimeout(nextTurn, 500); return; }
    if (player.isAI) { setTimeout(() => { if (player.money > cost * 1.5) upgradeProperty(tile.id); else endAction(); }, 2000); } 
    else {
        setModalState({ isOpen: true, title: "地产升级", desc: `升级 ${tile.name}?\n花费: ¥${cost/10000}万`, image: "🏗️", options: [{ label: "升级", action: () => upgradeProperty(tile.id), primary: true, disabled: player.money < cost }, { label: "跳过", action: endAction }] });
    }
  };

  const buyProperty = (tileId: number) => {
    const tile = gameState.tiles.find(t => t.id === tileId)!;
    const player = gameState.players[gameState.currentPlayerIndex];
    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === player.id ? { ...p, money: p.money - (tile.price||0), properties: [...p.properties, tileId], netWorth: p.netWorth } : p),
        tiles: prev.tiles.map(t => t.id === tileId ? { ...t, ownerId: player.id, level: 1 } : t),
    }));
    addLog(`${player.name} 购入 ${tile.name}`, 'SUCCESS');
    speak(player, `拿下${tile.name}！`, true);
    endAction();
  };

  const upgradeProperty = (tileId: number) => {
    const tile = gameState.tiles.find(t => t.id === tileId)!;
    const player = gameState.players[gameState.currentPlayerIndex];
    const cost = (tile.price || 0) * 0.5;
    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === player.id ? { ...p, money: p.money - cost, netWorth: p.netWorth + cost } : p),
        tiles: prev.tiles.map(t => t.id === tileId ? { ...t, level: t.level + 1 } : t),
    }));
    addLog(`${player.name} 升级了 ${tile.name}`, 'SUCCESS');
    endAction();
  };

  const payRent = (payer: Player, owner: Player, tile: TileData) => {
    let rent = (tile.rent || 0) * Math.pow(2.2, (tile.level - 1));
    if (payer.charm > 90 && Math.random() > 0.7) { rent /= 2; addLog("魅力减半租金！", 'EVENT'); }
    
    updatePlayer(payer.id, { money: payer.money - rent, netWorth: payer.netWorth - rent });
    updatePlayer(owner.id, { money: owner.money + rent, netWorth: owner.netWorth + rent });
    
    addLog(`${payer.name} 支付租金 ¥${Math.floor(rent/10000)}万`, 'DANGER');
    showBanner("支付过路费", `付给 ${owner.name} ¥${Math.floor(rent/10000)}万`, "BAD");
    speak(payer, `好贵啊...给${owner.name}`, false);
    setTimeout(() => { if (!checkBankruptcy(payer.id)) nextTurn(); }, 2500); // Longer pause
  };

  const triggerChanceEvent = async (player: Player) => {
    setGameState(prev => ({ ...prev, pendingAction: 'EVENT_PROCESSING' }));
    showBanner("命运", "正在抽取...", "INFO");
    await new Promise(r => setTimeout(r, 1000));

    const event = await generateFateEvent();
    setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === player.id ? { ...p, money: p.money + event.effectAmount, netWorth: p.netWorth + event.effectAmount } : p) }));
    
    if (player.isAI) {
        addLog(`${player.name} 命运: ${event.title}`, event.type === 'GOOD' ? 'SUCCESS' : 'DANGER');
        // Even for AI, show modal briefly or show banner long
        setModalState({ isOpen: true, title: event.title, desc: event.description, image: event.type === 'GOOD' ? "🎉" : "⚡", options: [{ label: "关闭", action: endAction }] });
        setTimeout(endAction, 3000); // AI auto-closes after 3s
    } else {
        setModalState({ isOpen: true, title: event.title, desc: event.description, image: event.type === 'GOOD' ? "🎉" : "⚡", options: [{ label: "确定", action: endAction, primary: true }] });
    }
  };

  const checkBankruptcy = (playerId: number) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (player && player.money < 0) {
        addLog(`${player.name} 破产了！`, 'DANGER');
        showBanner("破产!", `${player.name} 破产下线`, "BAD");
        updatePlayer(playerId, { isBankrupt: true, money: 0 });
        setGameState(prev => ({ ...prev, tiles: prev.tiles.map(t => t.ownerId === playerId ? { ...t, ownerId: undefined, level: 0 } : t) }));
        return true;
    }
    return false;
  };

  const endAction = () => {
    setModalState({ isOpen: false, title: '', desc: '', options: [] });
    setGameState(prev => ({ ...prev, pendingAction: 'NONE' }));
    nextTurn();
  };

  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isAI && !gameState.isMoving && gameState.pendingAction === 'NONE') {
        const timer = setTimeout(handleRollDice, 2500); // Increased AI think time
        return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.gameStatus, gameState.isMoving, gameState.pendingAction]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mapRef.current) return;
    e.preventDefault();
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    const { clientWidth, clientHeight } = mapRef.current;
    const minX = -(MAP_WIDTH - clientWidth);
    const minY = -(MAP_HEIGHT - clientHeight);
    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));
    setCamera({ x: newX, y: newY });
  };
  const handleMouseUp = () => setIsDragging(false);

  if (gameState.gameStatus === 'SETUP') {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center flex flex-col items-center justify-center relative">
         <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
         <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
             <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-purple-600 mb-8 drop-shadow-lg text-center leading-tight">上海大富翁<br/><span className="text-4xl text-white">2025 全明星乱斗</span></h1>
             <button onClick={() => setGameState(prev => ({...prev, gameStatus: 'SELECT_CHARACTER'}))} className="group relative px-16 py-6 bg-yellow-500 text-black font-black text-2xl rounded-full hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.5)] overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"/>
                 进入游戏 <ArrowRightCircle className="group-hover:translate-x-1 transition-transform"/>
             </button>
         </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'SELECT_CHARACTER') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col p-8">
              <h2 className="text-4xl text-yellow-500 font-black text-center mb-8">选择你的代言人</h2>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 pb-8">
                  {CHARACTERS.map(char => (
                      <button key={char.id} onClick={() => setGameState(createInitialState(char.id))}
                        className="relative flex flex-col items-center p-6 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-yellow-500 hover:bg-slate-700 hover:-translate-y-2 transition-all group shadow-lg">
                          <div className={`text-6xl mb-4 p-4 rounded-full ${char.color} bg-opacity-20 border-2 border-transparent group-hover:border-white/20 transition-all`}>{char.avatar}</div>
                          <h3 className="text-xl font-bold text-white mb-1">{char.name}</h3>
                          <p className="text-xs text-slate-400 text-center mb-2 h-8 leading-tight">{char.desc}</p>
                      </button>
                  ))}
              </div>
          </div>
      )
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-30 flex-shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
            <h2 className="text-sm font-bold flex items-center gap-2 text-yellow-500 uppercase tracking-widest"><Users size={16}/> 财富榜</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3 bg-slate-900">
            {gameState.players.sort((a,b) => b.netWorth - a.netWorth).map(p => (
                <PlayerCard key={p.id} player={p} isActive={p.id === currentPlayer.id} />
            ))}
        </div>
        <div className="h-48 bg-black p-3 text-xs overflow-y-auto font-mono scrollbar-hide border-t border-slate-800">
            {gameState.logs.map(log => (
                <div key={log.id} className={`mb-1.5 ${
                    log.type==='DANGER'?'text-red-400': log.type==='SUCCESS'?'text-green-400': log.type==='EVENT'?'text-yellow-300': log.type==='BLACK_SWAN'?'text-purple-400 font-bold': 'text-gray-500'
                }`}>
                    {log.type === 'BLACK_SWAN' && <Skull size={10} className="inline mr-1"/>}
                    {log.text}
                </div>
            ))}
            <div ref={logEndRef}/>
        </div>
      </div>

      <div 
        ref={mapRef}
        className="flex-1 relative bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onTouchStart={(e) => { setIsDragging(true); setDragStart({x: e.touches[0].clientX - camera.x, y: e.touches[0].clientY - camera.y})}}
        onTouchMove={(e) => { 
            if(!isDragging || !mapRef.current) return;
            const clientX = e.touches[0].clientX; const clientY = e.touches[0].clientY;
            let newX = clientX - dragStart.x; let newY = clientY - dragStart.y;
            const { clientWidth, clientHeight } = mapRef.current;
            newX = Math.min(0, Math.max(-(MAP_WIDTH - clientWidth), newX));
            newY = Math.min(0, Math.max(-(MAP_HEIGHT - clientHeight), newY));
            setCamera({x: newX, y: newY});
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        <div className="absolute origin-top-left transition-transform duration-75 ease-linear will-change-transform"
            style={{ width: MAP_WIDTH, height: MAP_HEIGHT, transform: `translate3d(${camera.x}px, ${camera.y}px, 0)` }}>
            
            {/* Map Grid Background */}
            <div className="absolute inset-0 pointer-events-none" 
                style={{ 
                    backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`, 
                    backgroundSize: '100px 100px',
                    opacity: 0.2
                }}
            />
            {/* Zone Labels (Static) */}
            <div className="absolute top-[200px] left-[200px] text-9xl text-white/5 font-black pointer-events-none">浦西</div>
            <div className="absolute top-[200px] right-[200px] text-9xl text-white/5 font-black pointer-events-none">浦东</div>

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {gameState.tiles.map(tile => 
                    tile.next.map(nextId => {
                        const nextTile = gameState.tiles.find(t => t.id === nextId);
                        if (!nextTile) return null;
                        const { x: x1, y: y1 } = getPixelCoords(tile.x, tile.y);
                        const { x: x2, y: y2 } = getPixelCoords(nextTile.x, nextTile.y);
                        return (
                            <g key={`${tile.id}-${nextId}`}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="16" strokeLinecap="round" opacity="0.5" />
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 5" opacity="0.3"/>
                            </g>
                        );
                    })
                )}
            </svg>

            {gameState.tiles.map(tile => (
                <Tile 
                    key={tile.id} data={tile} 
                    playersOnTile={gameState.players.filter(p => p.position === tile.id && !p.isBankrupt)}
                    isCurrent={currentPlayer.position === tile.id}
                    style={{ left: tile.x, top: tile.y }}
                    onClick={() => focusCamera(tile.x, tile.y)}
                />
            ))}
        </div>

        {/* UI OVERLAYS */}
        <div className="absolute top-4 left-4 z-40 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-xl border border-yellow-600/30 shadow-2xl flex flex-col gap-1 min-w-[200px]">
             <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Globe2 size={12}/> ROUND {gameState.turnCount}
             </div>
             <div className="text-yellow-500 font-black text-xl flex items-center gap-2">
                 <MapIcon size={20}/>
                 {gameState.tiles.find(t => t.id === currentPlayer.position)?.name}
             </div>
             <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                 {currentPlayer.isAI ? '🤖 思考中...' : '👤 你的回合'}
             </div>
        </div>

        {/* Banner Notification */}
        {banner && (
            <div className={`
                absolute top-24 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px] animate-in slide-in-from-top-10 fade-in duration-300
                ${banner.type === 'BAD' ? 'bg-red-600 text-white' : banner.type === 'WARN' ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'}
            `}>
                <div className="text-3xl">{banner.type === 'BAD' ? <AlertTriangle/> : banner.type === 'WARN' ? '⚠️' : 'ℹ️'}</div>
                <div>
                    <div className="text-xl font-black">{banner.title}</div>
                    <div className="text-sm opacity-90">{banner.desc}</div>
                </div>
            </div>
        )}

        <div className="absolute top-4 right-4 z-40 w-48 h-36 bg-black/60 border border-slate-600 rounded-lg overflow-hidden backdrop-blur-sm hidden md:block">
            <div className="relative w-full h-full">
                {gameState.tiles.map(t => (
                    <div key={t.id} className={`absolute w-1 h-1 rounded-full ${t.type===TileType.PROPERTY?'bg-slate-500':'bg-white'}`} 
                         style={{ left: `${t.x / MAP_WIDTH * 100}%`, top: `${t.y / MAP_HEIGHT * 100}%` }} />
                ))}
                {gameState.players.filter(p=>!p.isBankrupt).map(p => (
                    <div key={p.id} className={`absolute w-2 h-2 rounded-full border border-black ${p.color} ${p.id === gameState.currentPlayerIndex ? 'z-10 scale-150':''}`} 
                         style={{ left: `${gameState.tiles.find(t=>t.id===p.position)?.x / MAP_WIDTH * 100}%`, top: `${gameState.tiles.find(t=>t.id===p.position)?.y / MAP_HEIGHT * 100}%` }} />
                ))}
                <div className="absolute border-2 border-yellow-500/50 bg-yellow-500/10"
                     style={{ 
                         width: `${(mapRef.current?.clientWidth || 0) / MAP_WIDTH * 100}%`, 
                         height: `${(mapRef.current?.clientHeight || 0) / MAP_HEIGHT * 100}%`,
                         left: `${-camera.x / MAP_WIDTH * 100}%`,
                         top: `${-camera.y / MAP_HEIGHT * 100}%`
                     }}
                />
            </div>
        </div>

        <button onClick={() => {
            const t = gameState.tiles.find(x => x.id === currentPlayer.position);
            if(t) focusCamera(t.x, t.y);
        }} className="absolute bottom-32 right-8 z-40 bg-slate-800 p-3 rounded-full text-white hover:bg-slate-700 shadow-lg" title="回到当前角色">
            <Crosshair size={24}/>
        </button>

        {speechBubble && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-none">
                <div className="bg-white text-black px-6 py-3 rounded-2xl border-4 border-black font-bold flex items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.3)] max-w-xs text-center">
                   <MessageCircle size={20} className="shrink-0 text-yellow-600"/> {speechBubble.text}
                </div>
            </div>
        )}

        {gameState.gameStatus === 'WAITING_FOR_DIRECTION' && !currentPlayer.isAI && (
             <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-8 animate-bounce">请选择路线</h2>
                    <div className="flex gap-8 justify-center">
                        {gameState.tiles.find(t => t.id === currentPlayer.position)?.next.map(nextId => {
                            const nextTile = gameState.tiles.find(t => t.id === nextId)!;
                            return (
                                <button key={nextId} onClick={() => handleDirectionSelect(nextId)}
                                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-xl shadow-lg hover:scale-105 transition-all">
                                    去往: {nextTile.name}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

        <div className="absolute bottom-8 right-8 z-40">
            <button
                disabled={gameState.isMoving || currentPlayer.isAI || gameState.pendingAction !== 'NONE' || gameState.gameStatus === 'WAITING_FOR_DIRECTION'}
                onClick={handleRollDice}
                className={`
                    w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border-4 border-white/20 backdrop-blur-md transition-all
                    ${gameState.isMoving || currentPlayer.isAI ? 'bg-slate-800/80 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-yellow-400 to-orange-600 hover:scale-110 active:scale-95 animate-pulse cursor-pointer'}
                `}
            >
                {currentPlayer.isAI ? <Brain size={32} className="text-white"/> : <Dices size={40} className="text-white drop-shadow-md"/>}
            </button>
        </div>

         {gameState.lastDiceRoll && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 animate-in zoom-in spin-in-180 duration-500">
                 <div className="bg-white text-black text-8xl font-black w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl border-8 border-yellow-500">
                     {gameState.lastDiceRoll}
                 </div>
             </div>
        )}
      </div>

      <ActionModal isOpen={modalState.isOpen} title={modalState.title} description={modalState.desc} image={modalState.image} options={modalState.options}/>
    </div>
  );
};

export default App;
