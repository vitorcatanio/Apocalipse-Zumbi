import React, { useState } from 'react';
import { Book, Tv, Presentation, Key, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { MissionItemId } from '../types';
import { playTick } from '../utils/audio';

interface InteractiveMapProps {
  completedItems: MissionItemId[];
  onItemClick: (id: MissionItemId) => void;
  highlightedItemId?: MissionItemId | null;
}

interface MapNode {
  id: MissionItemId;
  name: string;
  emoji: string;
  icon: React.ComponentType<any>;
  xPercent: number; // responsive coordinates
  yPercent: number;
  roomName: string;
  description: string;
  signalStrength: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  completedItems,
  onItemClick,
  highlightedItemId = null,
}) => {
  const [hoveredNode, setHoveredNode] = useState<MissionItemId | null>(null);

  const nodes: MapNode[] = [
    {
      id: 'LIVRO',
      name: 'Livro',
      emoji: '📚',
      icon: Book,
      xPercent: 24,
      yPercent: 32,
      roomName: 'BIBLIOTECA DE TÁTICAS',
      description: 'Manuais militares e tomos de patógenos sobreviventes.',
      signalStrength: '94%',
    },
    {
      id: 'TELEVISAO',
      name: 'Televisão',
      emoji: '📺',
      icon: Tv,
      xPercent: 78,
      yPercent: 28,
      roomName: 'CENTRAL DE COMUNICAÇÃO',
      description: 'Painel receptor de satélites e ondas de rádio militar.',
      signalStrength: '42%',
    },
    {
      id: 'QUADRO',
      name: 'Quadro',
      emoji: '🖼',
      icon: Presentation,
      xPercent: 42,
      yPercent: 74,
      roomName: 'SALA DE GUERRA (SALA)',
      description: 'Painel de táticas e planejamento estratégico do grupo.',
      signalStrength: '88%',
    },
    {
      id: 'CHAVE',
      name: 'Chave',
      emoji: '🔑',
      icon: Key,
      xPercent: 82,
      yPercent: 78,
      roomName: 'BUNKER DE SUPRIMENTOS',
      description: 'Acesso mecânico para a saída e suprimentos cruciais.',
      signalStrength: '100%',
    },
  ];

  const handleNodeClick = (id: MissionItemId) => {
    playTick();
    onItemClick(id);
  };

  const handleMouseEnter = (id: MissionItemId) => {
    playTick();
    setHoveredNode(id);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] min-h-[350px] bg-terminal-dark/85 border border-neon-green/30 rounded-lg p-3 overflow-hidden border-glow-green">
      
      {/* Background blueprint details */}
      <div className="absolute inset-0 bg-grid-move opacity-5 pointer-events-none" />
      
      {/* Schematic Floorplan vectors */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 255, 102, 0.2)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Schematic Rooms */}
        {/* Room 1: Biblioteca */}
        <rect x="5%" y="10%" width="30%" height="45%" fill="rgba(0, 255, 102, 0.02)" stroke="rgba(0, 255, 102, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="7%" y="18%" fill="rgba(0,255,102,0.6)" className="font-mono text-[9px] tracking-widest">SUB-SETOR: ALFA (BIBLIOTECA)</text>
        
        {/* Room 2: Central de Comunicação */}
        <rect x="65%" y="10%" width="30%" height="40%" fill="rgba(0, 255, 102, 0.02)" stroke="rgba(0, 255, 102, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="67%" y="18%" fill="rgba(0,255,102,0.6)" className="font-mono text-[9px] tracking-widest">SUB-SETOR: BRAVO (COMUNICAÇÃO)</text>
        
        {/* Room 3: Sala de Guerra */}
        <rect x="5%" y="60%" width="50%" height="32%" fill="rgba(0, 255, 102, 0.02)" stroke="rgba(0, 255, 102, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="7%" y="68%" fill="rgba(0,255,102,0.6)" className="font-mono text-[9px] tracking-widest">SUB-SETOR: CHARLIE (SALA DE GUERRA)</text>
        
        {/* Room 4: Bunker de Suprimentos */}
        <rect x="60%" y="55%" width="35%" height="37%" fill="rgba(0, 255, 102, 0.02)" stroke="rgba(0, 255, 102, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="62%" y="63%" fill="rgba(0,255,102,0.6)" className="font-mono text-[9px] tracking-widest">SUB-SETOR: DELTA (BUNKER SUPRIMENTOS)</text>

        {/* Outer security perimeter */}
        <rect x="2%" y="4%" width="96%" height="92%" fill="none" stroke="rgba(0, 255, 102, 0.3)" strokeWidth="1.5" />
        
        {/* Structural corridors */}
        <line x1="35%" y1="30%" x2="65%" y2="30%" stroke="rgba(0, 255, 102, 0.3)" strokeWidth="12" strokeDasharray="2 2" className="opacity-40" />
        <line x1="55%" y1="30%" x2="55%" y2="75%" stroke="rgba(0, 255, 102, 0.3)" strokeWidth="12" strokeDasharray="2 2" className="opacity-40" />
      </svg>

      {/* Map Hud Margins */}
      <div className="absolute top-2 left-3 font-mono text-[10px] text-neon-green/60 tracking-wider flex items-center gap-1.5 select-none z-10">
        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-ping"></span>
        <span>MAINFRAME COGNITIVO V2.4 // ESCANEANDO AMBIENTE</span>
      </div>

      <div className="absolute bottom-2 right-3 font-mono text-[10px] text-neon-red/70 flex items-center gap-1.5 select-none z-10">
        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
        <span>SISTEMA DE QUARENTENA: CRÍTICO</span>
      </div>

      {/* Interactive Nodes */}
      {nodes.map((node) => {
        const isCompleted = completedItems.includes(node.id);
        const Icon = node.icon;
        const isHovered = hoveredNode === node.id;
        const isHighlighted = highlightedItemId === node.id;

        return (
          <button
            key={node.id}
            id={`node-${node.id.toLowerCase()}`}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => handleMouseEnter(node.id)}
            onMouseLeave={handleMouseLeave}
            style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 flex flex-col items-center justify-center cursor-pointer focus:outline-none transition-all duration-300`}
          >
            {/* Holographic Pulse Waves */}
            <div className={`absolute w-12 h-12 rounded-full border transition-all duration-700 ${
              isCompleted 
                ? 'border-neon-green/10 bg-neon-green/5' 
                : isHighlighted
                  ? 'border-neon-yellow/60 bg-neon-yellow/20 animate-ping scale-110'
                  : isHovered 
                    ? 'border-neon-red/40 bg-neon-red/10 scale-125' 
                    : 'border-neon-green/40 bg-neon-green/10 animate-ping scale-90'
            }`} />

            {/* Glowing Main Node Button */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              isCompleted
                ? 'bg-neon-green/20 border-neon-green text-neon-green border-glow-green-strong'
                : isHighlighted
                  ? 'bg-neon-yellow/30 border-neon-yellow text-neon-yellow scale-125 animate-bounce shadow-[0_0_25px_rgba(255,204,0,0.85)]'
                  : isHovered
                    ? 'bg-neon-red/20 border-neon-red text-neon-red border-glow-red scale-110'
                    : 'bg-terminal-dark/90 border-neon-green text-neon-green border-glow-green'
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Icon className={`w-5 h-5 ${isHovered || isHighlighted ? 'animate-pulse' : ''}`} />
              )}
            </div>
          </button>
        );
      })}

      {/* Floating Tactical Hover Details Box */}
      {hoveredNode && (
        (() => {
          const activeNode = nodes.find(n => n.id === hoveredNode);
          if (!activeNode) return null;
          const completed = completedItems.includes(activeNode.id);

          return (
            <div className="absolute top-10 left-3 md:top-auto md:bottom-3 max-w-[280px] bg-terminal-dark/95 border border-neon-green/40 rounded p-2.5 font-mono z-30 border-glow-green backdrop-blur-md select-none animate-flicker">
              <div className="flex items-center justify-between text-[11px] text-neon-green border-b border-neon-green/30 pb-1 mb-1.5 font-bold">
                <span>COORD: {activeNode.xPercent}°N, {activeNode.yPercent}°S</span>
                <span className={completed ? "text-neon-green" : "text-neon-yellow animate-pulse"}>
                  {completed ? "● RESOLVIDO" : "● DISPONÍVEL"}
                </span>
              </div>
              <h4 className="text-white text-xs font-bold font-orbitron tracking-wider flex items-center gap-1">
                {activeNode.emoji} {activeNode.roomName}
              </h4>
              <p className="text-[10px] text-neon-green/70 mt-1 leading-relaxed">
                {activeNode.description}
              </p>
              <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1.5 border-t border-neon-green/20 text-[9px] text-neon-green/50">
                <div>ASSINATURA: <span className="text-white">TECH-WAVE</span></div>
                <div>SINAL: <span className="text-white">{activeNode.signalStrength}</span></div>
              </div>
            </div>
          );
        })()
      )}

      {/* Grid coordinates indicators overlay */}
      <div className="absolute inset-y-0 right-2 w-4 font-mono text-[7px] text-neon-green/30 flex flex-col justify-between py-5 select-none pointer-events-none">
        <div>00.1</div>
        <div>00.2</div>
        <div>00.3</div>
        <div>00.4</div>
        <div>00.5</div>
      </div>
    </div>
  );
};
