
import { Character, TileData, TileType } from './types';

export const INITIAL_MONEY = 100000000; // 1亿初始资金
export const PASS_GO_REWARD = 10000000; // 经过起点奖励 1000万

// --- CHARACTERS (Unchanged mostly) ---
export const CHARACTERS: Omit<Character, 'isAI'>[] = [
  // 歌坛巨星
  { id: 0, name: "周董", avatar: "🎤", color: "bg-pink-600", desc: "哎哟不错哦，奶茶不离手。", iq: 85, charm: 98, luck: 95, catchphrase: "哎哟，不错哦！" },
  { id: 1, name: "阿臣", avatar: "🦁", color: "bg-orange-600", desc: "夸张的爆炸头，K歌之王。", iq: 88, charm: 92, luck: 85, catchphrase: "明年今日，我还在这里。" },
  { id: 2, name: "邓紫棋", avatar: "🐠", color: "bg-red-500", desc: "巨肺小天后，全都是泡沫。", iq: 90, charm: 95, luck: 88, catchphrase: "全都是泡沫！" },
  { id: 3, name: "老薛", avatar: "👓", color: "bg-teal-600", desc: "深情段子手，世界和平。", iq: 95, charm: 90, luck: 80, catchphrase: "我的心愿是世界和平。" },
  
  // 影坛传奇
  { id: 4, name: "星爷", avatar: "🎬", color: "bg-slate-600", desc: "喜剧之王，其实是个悲剧演员。", iq: 100, charm: 90, luck: 82, catchphrase: "我养你啊！" },
  { id: 5, name: "发哥", avatar: "🕶️", color: "bg-zinc-800", desc: "赌神在世，自带BGM。", iq: 98, charm: 99, luck: 99, catchphrase: "因为我是赌神。" },
  { id: 6, name: "志玲姐姐", avatar: "💃", color: "bg-rose-400", desc: "娃娃音女神，温柔杀手。", iq: 92, charm: 100, luck: 85, catchphrase: "萌萌站起来！" },
  { id: 7, name: "战狼京", avatar: "🥊", color: "bg-green-700", desc: "任何邪恶终将绳之以法。", iq: 85, charm: 80, luck: 90, catchphrase: "犯我中华者，虽远必诛。" },

  // 商界大佬
  { id: 8, name: "马爸爸", avatar: "💸", color: "bg-yellow-600", desc: "悔创阿里，对钱没兴趣。", iq: 120, charm: 60, luck: 75, catchphrase: "我对钱没有兴趣。" },
  { id: 9, name: "雷布斯", avatar: "📱", color: "bg-orange-500", desc: "Are you OK? 性价比之王。", iq: 115, charm: 85, luck: 80, catchphrase: "Are you OK?" },
  { id: 10, name: "老干妈", avatar: "🌶️", color: "bg-red-700", desc: "国民女神，火辣辣的爱。", iq: 105, charm: 80, luck: 90, catchphrase: "吃饭稍微加点辣。" },
  { id: 11, name: "企鹅王", avatar: "🐧", color: "bg-blue-600", desc: "充钱你就能变强。", iq: 118, charm: 50, luck: 95, catchphrase: "充值成功了吗？" },
  { id: 12, name: "董小姐", avatar: "🔌", color: "bg-cyan-700", desc: "掌握核心科技，铁娘子。", iq: 110, charm: 60, luck: 70, catchphrase: "不仅要好，还要掌握核心科技。" },

  // 体育与网红
  { id: 13, name: "姚巨人", avatar: "🏀", color: "bg-red-800", desc: "移动长城，表情包之王。", iq: 95, charm: 90, luck: 85, catchphrase: "好球！" },
  { id: 14, name: "飞人翔", avatar: "🏃", color: "bg-yellow-500", desc: "中国速度，跨栏王子。", iq: 90, charm: 92, luck: 80, catchphrase: "这就是中国速度。" },
  { id: 15, name: "带货一哥", avatar: "💄", color: "bg-pink-500", desc: "OMG！买它买它！", iq: 100, charm: 98, luck: 90, catchphrase: "OMG！买它！" },
  { id: 16, name: "罗老师", avatar: "🔨", color: "bg-slate-700", desc: "行业冥灯，交个朋友。", iq: 110, charm: 95, luck: 10, catchphrase: "理解万岁。" },
  { id: 17, name: "papi酱", avatar: "📹", color: "bg-lime-600", desc: "集美貌才华于一身。", iq: 105, charm: 90, luck: 85, catchphrase: "我是papi酱。" },
  { id: 18, name: "王校长", avatar: "🌭", color: "bg-zinc-500", desc: "国民老公，热狗爱好者。", iq: 95, charm: 70, luck: 99, catchphrase: "不服solo。" },
  { id: 19, name: "凤姐", avatar: "📖", color: "bg-fuchsia-700", desc: "初代网红，自信放光芒。", iq: 120, charm: 10, luck: 100, catchphrase: "往前推三百年..." }
];

// --- MAP GENERATION HELPERS ---

// Procedural generation for a winding, space-filling Shanghai map
const generateShanghaiMap = (): TileData[] => {
  const tiles: TileData[] = [];
  let idCounter = 0;

  const addTile = (name: string, type: TileType, x: number, y: number, district: string, priceBase?: number, nextOverride?: number[]) => {
    tiles.push({
      id: idCounter,
      name,
      type,
      x,
      y,
      next: nextOverride || [idCounter + 1],
      level: 0,
      district,
      price: priceBase,
      rent: priceBase ? priceBase * 0.15 : 0,
      color: getDistrictColor(district)
    });
    idCounter++;
  };

  const getDistrictColor = (d: string) => {
    switch(d) {
      case '黄浦': return 'border-red-500 shadow-red-500/50';
      case '浦东': return 'border-blue-500 shadow-blue-500/50';
      case '徐汇': return 'border-purple-500 shadow-purple-500/50';
      case '静安': return 'border-orange-500 shadow-orange-500/50';
      case '杨浦': return 'border-cyan-500 shadow-cyan-500/50';
      case '长宁': return 'border-green-500 shadow-green-500/50';
      case '郊区': return 'border-gray-500 shadow-gray-500/50';
      default: return 'border-white';
    }
  };

  // Coordinates are pixels on a 3000x2400 canvas
  // We will create a Winding Loop that fills the center space better

  // SECTION 1: START -> PUDONG SOUTH -> CENTURY PARK -> LUJIAZUI
  // Fills Bottom-Right and Center-Right
  addTile("起点", TileType.START, 2600, 2100, "浦东"); // 0
  
  // Go Up-Left into the map center (Century Park area)
  const sec1 = ["康桥", "御桥", "三林", "东方体育", "前滩太古里", "世博公园", "中华艺术宫", "梅赛德斯", "龙阳路", "磁悬浮", "世纪公园", "上海科技馆", "源深体育", "民生路", "陆家嘴中心"];
  // Coordinates curve: (2600,2100) -> (2200, 1800) -> (1800, 1600) -> (2000, 1200) -> (2400, 800) -> (2600, 400)
  for (let i = 0; i < sec1.length; i++) {
      // Logic to curve the line "S" shape roughly
      let x, y;
      if (i < 5) { // Bottom area moving left
          x = 2600 - ((i+1) * 120); 
          y = 2100 - ((i+1) * 20);
      } else if (i < 10) { // Moving Up-Right
          x = 2000 + ((i-5) * 80);
          y = 2000 - ((i-5) * 160);
      } else { // Moving Up to Lujiazui
          x = 2400 + ((i-10) * 40);
          y = 1200 - ((i-10) * 160);
      }
      
      let type = TileType.PROPERTY;
      if (i === 3 || i === 11) type = TileType.CHANCE;
      if (i === 7) type = TileType.SHOP;
      
      addTile(sec1[i], type, x, y, "浦东", 15000000 + (i*1000000));
  }
  
  // CORNER: Lujiazui Tip
  addTile("东方明珠", TileType.PROPERTY, 2600, 300, "浦东", 80000000); 

  // SECTION 2: LUJIAZUI -> NORTH BUND -> PEOPLE'S SQUARE -> JINGAN
  // Fills Top Edge and Top Center
  // (2600, 300) -> Leftwards
  const sec2 = ["陆家嘴滨江", "外滩隧道", "外白渡桥", "北外滩", "南京东路", "和平饭店", "外滩18号", "福州路", "人民广场", "大剧院", "南京西路", "静安寺", "久光百货", "曹家渡", "长寿路", "中山公园"];
  for(let i=0; i<sec2.length; i++) {
      let x = 2450 - (i * 140);
      let y = 300;
      // Dip down for People's Square / Nanjing Rd to fill center top
      if (i >= 4 && i <= 10) {
          y = 300 + Math.sin((i-4) * 0.5) * 200; // Curve down
      }
      
      let type = TileType.PROPERTY;
      let price = 45000000;
      if (sec2[i] === "南京东路" || sec2[i] === "静安寺") price = 60000000;
      if (i === 6) type = TileType.BANK;
      if (i === 12) type = TileType.CHANCE;

      addTile(sec2[i], type, x, y, i < 4 ? "浦东" : (i < 9 ? "黄浦" : (i < 13 ? "静安" : "长宁")), price);
  }

  // CORNER: Hongqiao
  addTile("虹桥枢纽", TileType.PARK, 150, 400, "长宁");

  // SECTION 3: HONGQIAO -> GUBEI -> XUJIAHUI -> MINHANG
  // Fills Left Edge and Center Left
  // (150, 400) -> Downwards
  const sec3 = ["动物园", "古北", "龙之梦", "交通大学", "徐家汇", "港汇恒隆", "上海体育馆", "漕河泾", "锦江乐园", "南方商城", "莘庄", "闵行开发区"];
  for(let i=0; i<sec3.length; i++) {
      let x = 150;
      let y = 550 + (i * 130);
      
      // Indent Xujiahui to center
      if (i >= 3 && i <= 7) {
          x = 150 + Math.sin((i-3) * 0.8) * 400; // Curve right into map
      }

      let type = TileType.PROPERTY;
      if (i === 2) type = TileType.JAIL;
      if (i === 8) type = TileType.TAX;

      addTile(sec3[i], type, x, y, i < 6 ? "徐家汇" : "郊区", 30000000);
  }

  // CORNER: Old Street
  addTile("七宝老街", TileType.SHOP, 200, 2100, "郊区");

  // SECTION 4: SOUTH -> XUHUI RIVERSIDE -> START
  // Fills Bottom Edge and Bottom Center
  // (200, 2100) -> Rightwards
  const sec4 = ["华东理工", "上海南站", "植物园", "龙华寺", "滨江大道", "西岸艺术", "后滩", "耀华路"];
  for(let i=0; i<sec4.length; i++) {
      // Zigzag up to fill the gap below the center
      let x = 400 + (i * 240);
      let y = 2100;
      
      // West Bund area curves up
      if (i >= 4 && i <= 6) {
          y = 2100 - 300; 
      }
      
      let type = TileType.PROPERTY;
      if (i === 3) type = TileType.CHANCE;
      
      addTile(sec4[i], type, x, y, "徐汇", 28000000);
  }

  // Link last tile to Start
  tiles[tiles.length - 1].next = [0];


  // --- SHORTCUT: CENTRAL ARTERY ---
  // Connects "People's Square" (Top Center) to "West Bund" (Bottom Center)
  // This cuts right through the middle
  const tStart = tiles.find(t => t.name === "人民广场");
  const tEnd = tiles.find(t => t.name === "西岸艺术");

  if (tStart && tEnd) {
      const startId = tStart.id;
      const endId = tEnd.id;
      
      const scNames = ["新天地", "淮海中路", "复兴公园", "田子坊", "打浦桥", "瑞金医院"];
      // Path from (1200, 500) down to (1600, 1800) roughly
      
      const scStartId = idCounter;
      for (let i = 0; i < scNames.length; i++) {
          const x = 1200 + (i * 80);
          const y = 600 + (i * 180);
          
          let type = TileType.PROPERTY;
          let price = 60000000;
          if (scNames[i] === "新天地") price = 99000000; // Prime location
          if (i === 2) type = TileType.CHANCE;

          tiles.push({
            id: idCounter,
            name: scNames[i],
            type,
            x,
            y,
            next: [idCounter + 1],
            level: 0,
            district: "黄浦",
            price,
            rent: price * 0.15,
            color: 'border-yellow-400 shadow-yellow-500/80'
          });
          
          if (i === scNames.length - 1) {
             tiles[tiles.length - 1].next = [endId];
          }
          idCounter++;
      }
      // Add branch
      tStart.next.push(scStartId);
  }

  return tiles;
};

export const MAP_NODES = generateShanghaiMap();
