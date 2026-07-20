import React, { useState, useEffect, useRef } from 'react';
import { 
  Skull, 
  Terminal, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  User, 
  Check, 
  X, 
  AlertTriangle, 
  Award,
  Zap,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Clock,
  Eye
} from 'lucide-react';
import { BackgroundOverlay } from './components/BackgroundOverlay';
import { InteractiveMap } from './components/InteractiveMap';
import { Typewriter } from './components/Typewriter';
import { CharacterClass, CharacterClassId, MissionItem, MissionItemId, ScreenType, SurvivorProfile } from './types';
import { 
  playTick, 
  playSuccessChime, 
  playErrorBuzz, 
  playTerminalAccess, 
  playWarningAlarm, 
  playDecryptStatic, 
  playZombieGroan,
  toggleSound, 
  isSoundEnabled 
} from './utils/audio';

// Survivor classes definition
const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'TECNOLOGICO',
    name: 'O Tecnológico',
    icon: '💻',
    description: 'Usa a tecnologia para decodificar sinais, encontrar rotas seguras e hackear sistemas de bunker.',
    revealWord: 'PARA',
  },
  {
    id: 'CIENTISTA',
    name: 'O Cientista',
    icon: '🧪',
    description: 'Busca compreender o patógeno, analisar mutações no sangue e encontrar uma cura para a epidemia.',
    revealWord: 'OLHE',
  },
  {
    id: 'ESTRATEGISTA',
    name: 'O Estrategista',
    icon: '♟️',
    description: 'Mapeia rotas de fuga com precisão cirúrgica, calcula chances de risco e protege os recursos do grupo.',
    revealWord: 'OLHE',
  },
  {
    id: 'GUERREIRO',
    name: 'O Guerreiro',
    icon: '⚔️',
    description: 'Luta na linha de frente contra hordas zumbis, garantindo a proteção física e escolta tática do grupo.',
    revealWord: 'ANFITRIÕES',
  },
  {
    id: 'LIDER',
    name: 'O Líder',
    icon: '👑',
    description: 'Mantém a coesão psicológica do grupo, decide destinos de fuga e faz escolhas difíceis sob extrema pressão.',
    revealWord: 'ANFITRIÕES',
  },
  {
    id: 'SOLITARIO',
    name: 'O Solitário',
    icon: '🌙',
    description: 'Especialista em infiltração silenciosa e furtividade, sobrevive autonomamente nas sombras da cidade.',
    revealWord: 'ANFITRIÕES',
  },
];

const MISSION_ITEMS: Record<MissionItemId, {
  name: string;
  label: string;
  emoji: string;
  riddle: string;
  letterCount: number;
  hint2: string;
  hint3: string;
  correctAnswer: string;
}> = {
  LIVRO: {
    name: 'Livro',
    label: 'MÓDULO DE INFORMAÇÃO [ALFA]',
    emoji: '📚',
    riddle: 'Tenho páginas. Posso salvar vidas. No fim do mundo posso ser mais valioso que comida. Quem sou eu?',
    letterCount: 5,
    hint2: 'Sua função principal é registrar conhecimento impresso, contar histórias e documentar mapas e manuais de primeiros socorros.',
    hint3: 'Consiste de uma capa de proteção que envolve folhas encadernadas de papel impresso. Costuma estar guardado em estantes de bibliotecas.',
    correctAnswer: 'livro',
  },
  TELEVISAO: {
    name: 'Televisão',
    label: 'SINALIZADOR AUDIOVISUAL [BRAVO]',
    emoji: '📺',
    riddle: 'Tenho tela. Mostro o caos. Mas não posso impedir que ele aconteça. Quem sou eu?',
    letterCount: 9,
    hint2: 'Sua função principal é captar e decodificar ondas eletromagnéticas para exibir imagens dinâmicas e áudio nas salas de convívio.',
    hint3: 'Aparelho eletrônico de entretenimento dotado de painel de vidro ou LED, alto-falantes e sintonizador de canais por cabo ou satélite.',
    correctAnswer: 'televisao',
  },
  QUADRO: {
    name: 'Quadro',
    label: 'DISPOSITIVO DE PLANEJAMENTO [CHARLIE]',
    emoji: '🖼',
    riddle: 'Sou usado para ensinar. Mas no apocalipse posso guardar suas estratégias. O que sou?',
    letterCount: 6,
    hint2: 'Sua função principal é servir como suporte liso e durável para registrar notas de aula ou diagramas táticos com marcadores removíveis.',
    hint3: 'Uma lousa ou quadro-negro tático retangular que fica pendurado na parede para discussões ou ensinamentos em grupo.',
    correctAnswer: 'quadro',
  },
  CHAVE: {
    name: 'Chave',
    label: 'MÓDULO DE ACESSO MECÂNICO [DELTA]',
    emoji: '🔑',
    riddle: 'O que nunca pode faltar no seu quarto durante um apocalipse zumbi?',
    letterCount: 5,
    hint2: 'Sua função mecânica principal é acionar os pinos internos de um tambor de fechadura para abrir ou travar uma porta física.',
    hint3: 'Um pequeno dispositivo metálico recortado com precisão que permite travar o quarto ou destrancar compartimentos secretos e caixas de ferramentas.',
    correctAnswer: 'chave',
  }
};

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('HOME');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [realTime, setRealTime] = useState('');

  // Survivor state
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClassId | null>(null);
  const [nameError, setNameError] = useState(false);

  // Special Mission Modal Popup
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialModalState, setSpecialModalState] = useState<'PROMPT' | 'REJECTED'>('PROMPT');

  // Loading Screen States
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Mission Game States
  const [completedItems, setCompletedItems] = useState<MissionItemId[]>([]);
  const [activeRiddleItem, setActiveRiddleItem] = useState<MissionItemId | null>(null);
  const [riddleAnswerInput, setRiddleAnswerInput] = useState('');
  const [riddleErrorMsg, setRiddleErrorMsg] = useState('');
  const [showRiddleSuccess, setShowRiddleSuccess] = useState(false);

  // Progressive Hints & Performance tracking states
  const [errorCounts, setErrorCounts] = useState<Record<MissionItemId, number>>({
    LIVRO: 0,
    TELEVISAO: 0,
    QUADRO: 0,
    CHAVE: 0,
  });
  const [highlightedItemId, setHighlightedItemId] = useState<MissionItemId | null>(null);
  const [useAssistRequested, setUseAssistRequested] = useState<Record<MissionItemId, boolean>>({
    LIVRO: false,
    TELEVISAO: false,
    QUADRO: false,
    CHAVE: false,
  });
  const [confirmAssistId, setConfirmAssistId] = useState<MissionItemId | null>(null);
  const [performanceScore, setPerformanceScore] = useState(100);

  // Final Cinematic Decryption states
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptStep, setDecryptStep] = useState(0);
  const [showFinalWord, setShowFinalWord] = useState(false);

  // Zombie Startup Animation states
  const [showIntro, setShowIntro] = useState(true);
  const [introStage, setIntroStage] = useState<'PROMPT' | 'ALERTA' | 'SCANNING' | 'STABILIZING'>('PROMPT');
  const [introLogIndex, setIntroLogIndex] = useState(0);

  // Triggering stages for zombie intro sequence
  const handleStartIntro = () => {
    setIntroStage('ALERTA');
    playWarningAlarm(1.8);
    playZombieGroan();
    
    // Switch to scanning phase after alert alarm is initialized
    setTimeout(() => {
      setIntroStage('SCANNING');
    }, 1800);
  };

  useEffect(() => {
    if (introStage !== 'SCANNING') return;

    const logTimer = setInterval(() => {
      setIntroLogIndex((prev) => {
        if (prev >= 5) {
          clearInterval(logTimer);
          // Proceed to stabilizing
          setTimeout(() => {
            setIntroStage('STABILIZING');
            playSuccessChime();
            setTimeout(() => {
              setShowIntro(false);
            }, 1000);
          }, 800);
          return 5;
        }
        playTick();
        return prev + 1;
      });
    }, 900);

    return () => clearInterval(logTimer);
  }, [introStage]);

  // Dynamic system time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setRealTime(now.toLocaleTimeString('pt-BR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSoundToggle = () => {
    const isEnabled = toggleSound();
    setSoundActive(isEnabled);
    playTick();
  };

  const handleStartMissionClick = () => {
    playTerminalAccess();
    setScreen('SURVIVOR_SETUP');
  };

  const handleSetupContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      playErrorBuzz();
      return;
    }
    if (!selectedClass) {
      playErrorBuzz();
      return;
    }
    setNameError(false);
    playSuccessChime();
    setIsLoadingMission(true);
    setLoadingProgress(0);
    setLoadingTextIndex(0);
  };

  // Rejecting the special mission modal
  const handleRejectSpecialMission = () => {
    playErrorBuzz();
    setSpecialModalState('REJECTED');
  };

  const handleAcceptSpecialMission = () => {
    playSuccessChime();
    setShowSpecialModal(false);
    setIsLoadingMission(true);
    setLoadingProgress(0);
    setLoadingTextIndex(0);
  };

  // Simulated computer loading routine
  useEffect(() => {
    if (!isLoadingMission) return;

    // Fast interval for loading percentage
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Increment with natural speeds
        const increment = Math.floor(Math.random() * 8) + 4;
        return Math.min(100, prev + increment);
      });
    }, 150);

    // Text step indexing interval
    const textStepsInterval = setInterval(() => {
      setLoadingTextIndex((prev) => {
        if (prev >= 4) {
          clearInterval(textStepsInterval);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textStepsInterval);
    };
  }, [isLoadingMission]);

  // Transition to main mission once fully loaded
  useEffect(() => {
    if (isLoadingMission && loadingProgress === 100 && loadingTextIndex === 4) {
      const timer = setTimeout(() => {
        setIsLoadingMission(false);
        setScreen('MISSION_SCREEN');
        playWarningAlarm(0.8);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMission, loadingProgress, loadingTextIndex]);

  // Riddle normalization
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/^(o|a|os|as)\s+/, '');
  };

  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRiddleItem) return;

    const input = normalizeText(riddleAnswerInput);
    let isCorrect = false;

    if (activeRiddleItem === 'LIVRO') {
      isCorrect = ['livro', 'livros'].includes(input);
    } else if (activeRiddleItem === 'TELEVISAO') {
      isCorrect = ['televisao', 'tv', 'televisor', 'television'].includes(input);
    } else if (activeRiddleItem === 'QUADRO') {
      isCorrect = ['quadro', 'lousa', 'quadronegro', 'quadroverde', 'painel', 'lousa digital'].includes(input);
    } else if (activeRiddleItem === 'CHAVE') {
      isCorrect = ['chave', 'chaves', 'chaveiro', 'key'].includes(input);
    }

    if (isCorrect) {
      playSuccessChime();
      setShowRiddleSuccess(true);
      setRiddleErrorMsg('');
      setTimeout(() => {
        const nextCompleted = [...completedItems, activeRiddleItem];
        setCompletedItems(nextCompleted);
        setActiveRiddleItem(null);
        setRiddleAnswerInput('');
        setShowRiddleSuccess(false);

        // Reset error count for this item
        setErrorCounts(prev => ({ ...prev, [activeRiddleItem]: 0 }));

        // Check if game is completed
        if (nextCompleted.length === 4) {
          triggerDecryptCinematic();
        }
      }, 1500);
    } else {
      playErrorBuzz();
      const nextErrCount = (errorCounts[activeRiddleItem] || 0) + 1;
      setErrorCounts(prev => ({ ...prev, [activeRiddleItem]: nextErrCount }));

      const info = MISSION_ITEMS[activeRiddleItem];
      if (nextErrCount === 1) {
        setRiddleErrorMsg(`Acesso negado! DICA NÍVEL 1: A palavra contém exatamente ${info.letterCount} letras.`);
      } else if (nextErrCount === 2) {
        setRiddleErrorMsg(`Acesso negado! DICA NÍVEL 2 (USO/FUNÇÃO): ${info.hint2}`);
      } else if (nextErrCount === 3) {
        setRiddleErrorMsg(`Acesso negado! DICA NÍVEL 3 (CONTEXTO): ${info.hint3}`);
      } else if (nextErrCount === 4) {
        setRiddleErrorMsg(`Acesso negado! DICA NÍVEL 4 (SINALIZADOR RADAR): Radar ativado! A ilustração física correspondente está brilhando em amarelo no cenário ao fundo!`);
        setHighlightedItemId(activeRiddleItem);
        setTimeout(() => {
          setHighlightedItemId(null);
        }, 5000);
      } else {
        setRiddleErrorMsg(`Acesso negado! DICA NÍVEL 5 (DESCRIPTOGRAFIA EMERGENCIAL): Se você precisar da resposta, solicite a decodificação do mainframe abaixo.`);
      }
    }
  };

  const handleRequestAssist = (itemId: MissionItemId) => {
    playWarningAlarm(0.5);
    setConfirmAssistId(itemId);
  };

  const handleConfirmAssist = (itemId: MissionItemId) => {
    playSuccessChime();
    setConfirmAssistId(null);
    setUseAssistRequested(prev => ({ ...prev, [itemId]: true }));
    setPerformanceScore(prev => Math.max(0, prev - 25)); // reduce performance by 25 points
    setRiddleAnswerInput(MISSION_ITEMS[itemId].correctAnswer);
    setRiddleErrorMsg(`Mainframe decriptografou o segredo. A resposta correta foi inserida.`);
  };

  const handleCancelAssist = () => {
    playTick();
    setConfirmAssistId(null);
  };

  // Cinematic decrypt setup when 4 items solved
  const triggerDecryptCinematic = () => {
    setTimeout(() => {
      setScreen('FINAL_REVEAL');
      setIsDecrypting(true);
      setDecryptProgress(0);
      setDecryptStep(0);
      setShowFinalWord(false);
      playWarningAlarm(1.5);
    }, 1000);
  };

  // Cinematic decrypt ticks
  useEffect(() => {
    if (!isDecrypting) return;

    playDecryptStatic(4);

    // Percentage increments
    const steps = [
      { p: 25, delay: 900 },
      { p: 57, delay: 1800 },
      { p: 82, delay: 2800 },
      { p: 100, delay: 4000 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDecryptProgress(step.p);
        setDecryptStep(idx + 1);
        playTick();
        if (step.p === 100) {
          setTimeout(() => {
            setIsDecrypting(false);
            setShowFinalWord(true);
            playSuccessChime();
          }, 800);
        }
      }, step.delay);
    });
  }, [isDecrypting]);

  const handleResetGame = () => {
    playTerminalAccess();
    setScreen('HOME');
    setName('');
    setSelectedClass(null);
    setCompletedItems([]);
    setRiddleAnswerInput('');
    setRiddleErrorMsg('');
    setShowSpecialModal(false);
    setErrorCounts({ LIVRO: 0, TELEVISAO: 0, QUADRO: 0, CHAVE: 0 });
    setHighlightedItemId(null);
    setUseAssistRequested({ LIVRO: false, TELEVISAO: false, QUADRO: false, CHAVE: false });
    setConfirmAssistId(null);
    setPerformanceScore(100);
  };

  // Find selected class details
  const currentClassDetails = CHARACTER_CLASSES.find(c => c.id === selectedClass);

  if (showIntro) {
    return (
      <div className="relative min-h-screen bg-black text-neon-green font-mono select-none overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Deep atmospheric scanlines & particles */}
        <BackgroundOverlay />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,102,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,102,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="absolute top-4 left-4 text-[10px] text-neon-green/40 font-mono tracking-widest uppercase select-none">
          MAIN_BOOT_SEQUENCE // BETA-92
        </div>
        
        <div className="absolute top-4 right-4 text-[10px] text-neon-red/60 font-mono tracking-widest uppercase select-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
          <span>STATUS: EM INFECÇÃO</span>
        </div>

        {/* Content Box */}
        <div className="w-full max-w-xl p-6 sm:p-10 bg-black/80 border border-zinc-800 rounded-lg backdrop-blur-md relative overflow-hidden text-center shadow-[0_0_50px_rgba(239,68,68,0.05)] border-glow-red transition-all duration-500">
          
          {introStage === 'PROMPT' && (
            <div className="space-y-8 py-6 animate-flicker">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-neon-red/10 border border-neon-red/30 text-neon-red relative animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <Skull className="w-10 h-10 sm:w-12 sm:h-12" />
                <div className="absolute -inset-1.5 rounded-full border border-neon-red/20 animate-ping" />
              </div>
              
              <div className="space-y-3">
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-white tracking-widest uppercase glow-red">
                  SINAL INTERCEPTADO
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                  Nosso receptor captou transmissões de emergência de um bunker. Para iniciar a decodificação e sintonizar sua rádio de sobrevivência tática, estabeleça a conexão.
                </p>
              </div>

              <div>
                <button
                  id="btn-conectar-bunker"
                  onClick={handleStartIntro}
                  className="px-8 py-4 bg-neon-red/10 border-2 border-neon-red hover:bg-neon-red hover:text-black text-neon-red font-orbitron font-bold text-sm tracking-widest rounded transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] cursor-pointer uppercase animate-pulse"
                >
                  CONECTAR AO BUNKER
                </button>
              </div>
            </div>
          )}

          {introStage === 'ALERTA' && (
            <div className="space-y-8 py-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neon-red flex items-center justify-center rounded-full text-black shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-bounce">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="space-y-3">
                <p className="text-neon-red font-orbitron text-xl sm:text-2xl font-black tracking-widest animate-pulse">
                  ⚠️ ALERTA DE INFECÇÃO CRÍTICA ⚠️
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">
                  Varredura biológica em andamento...
                </p>
              </div>
              
              {/* Progress bar simulation for alert warning */}
              <div className="w-full max-w-xs h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-neon-red animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {introStage === 'SCANNING' && (
            <div className="space-y-6 text-left py-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
                <span className="font-orbitron text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                  SISTEMA DE SEGURANÇA OPERACIONAL
                </span>
                <span className="text-[10px] text-neon-green/60">ETAPA: {introLogIndex}/5</span>
              </div>

              {/* Dynamic typed style terminal printout */}
              <div className="font-mono text-xs space-y-3 min-h-[160px] bg-black/40 p-4 rounded border border-zinc-900/60 leading-relaxed text-zinc-300">
                {introLogIndex >= 0 && (
                  <p className="text-neon-red flex gap-2">
                    <span className="text-neon-red font-bold">&gt;</span>
                    <span>[AVISO] INFECTADOS DETECTADOS NO PERÍMETRO DO REFÚGIO.</span>
                  </p>
                )}
                {introLogIndex >= 1 && (
                  <p className="flex gap-2 animate-pulse">
                    <span className="text-neon-green font-bold">&gt;</span>
                    <span>[LOG] Varredura de rádio iniciada nas frequências de emergência...</span>
                  </p>
                )}
                {introLogIndex >= 2 && (
                  <p className="flex gap-2">
                    <span className="text-neon-green font-bold">&gt;</span>
                    <span>[LOG] Conectando canais de comunicação com sobreviventes...</span>
                  </p>
                )}
                {introLogIndex >= 3 && (
                  <p className="flex gap-2 text-neon-green">
                    <span className="font-bold">&gt;</span>
                    <span>[SEGURANÇA] Bloqueio automático de portas reforçadas ativado com sucesso.</span>
                  </p>
                )}
                {introLogIndex >= 4 && (
                  <p className="flex gap-2">
                    <span className="text-neon-green font-bold">&gt;</span>
                    <span>[SISTEMA] Mainframe pronto. Sincronizando chaves de sobrevivência...</span>
                  </p>
                )}
                {introLogIndex >= 5 && (
                  <p className="text-white font-bold animate-pulse flex gap-2">
                    <span className="text-neon-green font-bold">&gt;</span>
                    <span>[STATUS] CONEXÃO ESTABILIZADA. SEJA BEM-VINDO AO ABRIGO!</span>
                  </p>
                )}
              </div>

              {/* Simulating scanning action line */}
              <div className="w-full h-1 bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden">
                <div 
                  className="h-full bg-neon-green shadow-[0_0_10px_#00ff66] transition-all duration-300"
                  style={{ width: `${(introLogIndex / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {introStage === 'STABILIZING' && (
            <div className="space-y-6 py-10 flex flex-col items-center justify-center text-center animate-pulse">
              <div className="w-16 h-16 bg-neon-green/10 border border-neon-green text-neon-green flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <p className="text-neon-green font-orbitron text-xl sm:text-2xl font-black tracking-widest uppercase">
                  SISTEMA ESTABILIZADO
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  ENTRANDO NO TERMINAL TÁTICO...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-terminal-dark text-terminal-light font-sans select-none overflow-x-hidden flex flex-col justify-between">
      
      {/* Immersive background canvas particles, scanlines & neon grid */}
      <BackgroundOverlay />

      {/* FIXED TOP HUD RAIL */}
      <header className="relative w-full z-40 bg-black/80 border-b border-neon-green/20 px-4 py-2.5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse border-glow-green" />
          <h1 className="font-orbitron font-black tracking-wider text-sm md:text-base text-white flex items-center gap-1.5">
            APOCALIPSE ZUMBI <span className="text-[10px] text-neon-green px-1.5 py-0.5 bg-neon-green/10 border border-neon-green/20 rounded font-mono font-normal">TACTICAL HUD</span>
          </h1>
        </div>

        {/* HUD Data Grid */}
        <div className="flex items-center gap-4 text-[10px] md:text-xs font-mono text-neon-green/80 select-none">
          <div className="hidden md:flex items-center gap-1.5 bg-terminal-gray px-2 py-1 rounded border border-neon-green/10">
            <Clock className="w-3.5 h-3.5" />
            <span>LOCAL_TIME: <span className="text-white">{realTime || '12:28:03'}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-neon-green/50">PERÍMETRO:</span>
            <span className="text-neon-red font-bold animate-pulse">SETOR_RESTREITO</span>
          </div>

          {/* Sound Controls */}
          <button
            onClick={handleSoundToggle}
            className={`p-1.5 rounded border transition-all duration-300 ${
              soundActive 
                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green hover:bg-neon-green/20' 
                : 'bg-black border-zinc-700 text-zinc-500 hover:text-zinc-400'
            }`}
            title={soundActive ? "Mudar para Silencioso" : "Ativar Efeitos de Som"}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CORE VIEWPORT STATE ROUTER */}
      <main className="relative flex-grow flex items-center justify-center p-4 z-10 w-full max-w-7xl mx-auto">
        
        {/* ==================== TELA 1: HOME SCREEN ==================== */}
        {screen === 'HOME' && !isLoadingMission && (
          <div className="w-full max-w-2xl py-10 px-6 md:p-12 bg-black/60 border border-neon-green/20 rounded-lg text-center backdrop-blur-md relative overflow-hidden border-glow-green animate-flicker">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent" />
            
            {/* Danger Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-red/10 border border-neon-red/30 rounded-full text-neon-red text-xs font-mono tracking-widest mb-6 animate-pulse select-none">
              <Skull className="w-4 h-4" />
              <span>NÍVEL DE AMEAÇA: MÁXIMO (CATASTRÓFICO)</span>
            </div>

            {/* Main Cyberpunk Glitched Title */}
            <h1 className="font-orbitron font-black text-4xl sm:text-6xl tracking-tighter text-white glow-green leading-none mb-4 select-none uppercase">
              APOCALIPSE<br />
              <span className="text-neon-green">ZUMBI</span>
            </h1>

            {/* Mission Prompt text */}
            <p className="text-zinc-300 font-mono text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
              <Typewriter 
                text="Descubra se você possui as habilidades necessárias para sobreviver à epidemia." 
                speed={30} 
                playSound={soundActive}
              />
            </p>

            {/* Glowing Action Button */}
            <div className="relative group inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-emerald-500 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <button
                id="btn-iniciar-missao"
                onClick={handleStartMissionClick}
                className="relative px-8 py-4 bg-terminal-dark border-2 border-neon-green rounded-lg text-neon-green font-orbitron text-lg font-bold tracking-widest hover:bg-neon-green hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,255,102,0.2)] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] uppercase cursor-pointer"
              >
                INICIAR MISSÃO
              </button>
            </div>

            {/* Footer decoration */}
            <div className="mt-12 flex justify-center items-center gap-6 opacity-30 font-mono text-[10px] tracking-widest">
              <span>GRID-PERIMETER: 42-N</span>
              <span>●</span>
              <span>PROTOCOL: BRAIN_SCAN_01</span>
            </div>
          </div>
        )}

        {/* ==================== TELA 2: SURVIVOR PROFILE SETUP ==================== */}
        {screen === 'SURVIVOR_SETUP' && !isLoadingMission && (
          <div className="w-full max-w-4xl bg-black/75 border border-neon-green/20 rounded-lg p-5 md:p-8 backdrop-blur-md border-glow-green">
            
            {/* Header label */}
            <div className="flex items-center gap-2 border-b border-neon-green/20 pb-4 mb-6">
              <Terminal className="text-neon-green w-5 h-5 animate-pulse" />
              <h2 className="font-orbitron text-lg font-bold uppercase tracking-wider text-white">
                REGISTRO DE INGRESSO NO REFÚGIO
              </h2>
            </div>

            <form onSubmit={handleSetupContinue} className="space-y-6">
              {/* Question 1: Name input */}
              <div className="space-y-2">
                <label className="block font-mono text-sm text-neon-green tracking-wider uppercase">
                  Qual é o seu nome?
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-green font-mono select-none">&gt;</span>
                  <input
                    id="input-survivor-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder="DIGITE SEU NOME CIVIL..."
                    className={`w-full bg-terminal-gray/60 border ${
                      nameError ? 'border-neon-red/60 text-neon-red' : 'border-neon-green/30 text-white'
                    } rounded py-3 pl-8 pr-4 font-mono text-sm tracking-wide focus:outline-none focus:border-neon-green/95 transition-all duration-300 placeholder-zinc-600`}
                  />
                </div>
                {nameError && (
                  <p className="text-neon-red font-mono text-xs mt-1 animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> IDENTIFICAÇÃO OBRIGATÓRIA. DIGITE SEU NOME PARA PROSSEGUIR.
                  </p>
                )}
              </div>

              {/* Question 2: Character class select */}
              <div className="space-y-3">
                <label className="block font-mono text-sm text-neon-green tracking-wider uppercase">
                  Em um apocalipse zumbi, qual personagem você seria? <span className="text-zinc-500 text-xs font-normal font-sans lowercase">(selecione uma classe operacional abaixo)</span>
                </label>
                
                {/* Responsive Bento-Style Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {CHARACTER_CLASSES.map((cls) => {
                    const isSelected = selectedClass === cls.id;
                    return (
                      <button
                        key={cls.id}
                        id={`card-class-${cls.id.toLowerCase()}`}
                        type="button"
                        onClick={() => {
                          playTick();
                          setSelectedClass(cls.id);
                        }}
                        className={`text-left p-4 rounded border transition-all duration-300 relative group cursor-pointer ${
                          isSelected 
                            ? 'bg-neon-green/10 border-neon-green border-glow-green-strong' 
                            : 'bg-terminal-gray/40 border-neon-green/20 hover:border-neon-green/50 hover:bg-terminal-gray/80'
                        }`}
                      >
                        {/* Selector Indicator Light */}
                        <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full transition-all duration-300 ${
                          isSelected ? 'bg-neon-green border-glow-green animate-pulse' : 'bg-transparent border border-zinc-600'
                        }`} />

                        {/* Card Icon & Title */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-2xl select-none" role="img" aria-label={cls.name}>
                            {cls.icon}
                          </span>
                          <h3 className={`font-orbitron font-bold text-sm tracking-wider ${isSelected ? 'text-neon-green' : 'text-white'}`}>
                            {cls.name}
                          </h3>
                        </div>

                        {/* Card Description */}
                        <p className="text-xs font-sans text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                          {cls.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Button */}
              <div className="pt-4 border-t border-neon-green/10 flex justify-end">
                <button
                  id="btn-confirmar-setup"
                  type="submit"
                  disabled={!name.trim() || !selectedClass}
                  className={`px-8 py-3.5 rounded font-orbitron font-bold tracking-widest text-sm transition-all duration-300 cursor-pointer ${
                    name.trim() && selectedClass
                      ? 'bg-neon-green text-black hover:bg-neon-green/80 hover:scale-102 shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                      : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  CONTINUAR PROCESSO
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== TELA DE LOADING MILITAR ==================== */}
        {isLoadingMission && (
          <div className="w-full max-w-xl bg-black/80 border border-neon-green/30 rounded-lg p-6 md:p-8 backdrop-blur-md relative border-glow-green font-mono text-sm">
            <div className="flex items-center justify-between border-b border-neon-green/20 pb-3 mb-6">
              <span className="text-neon-green tracking-wider font-bold">TERMINAL CENTRAL // CARREGANDO COG-NET</span>
              <span className="text-xs animate-pulse text-neon-yellow">STATUS: SYNC_IN_PROGRESS</span>
            </div>

            {/* Typewriter computer loading feedback lines */}
            <div className="space-y-2 mb-8 min-h-[120px] text-zinc-400">
              <p className="text-white">&gt; SYSTEM INIT SECURE SEQUENCE...</p>
              
              {loadingTextIndex >= 0 && (
                <p>
                  <span className="text-neon-green">&gt; </span>
                  <Typewriter text="Inicializando teste de sobrevivência da amizade verdadeira..." speed={20} showCursor={false} playSound={soundActive} />
                </p>
              )}
              {loadingTextIndex >= 1 && (
                <p>
                  <span className="text-neon-green">&gt; </span>
                  <Typewriter text={`Verificando sobrevivente amigo: ${name.toUpperCase()} [ID: #${selectedClass}]`} speed={20} showCursor={false} playSound={soundActive} />
                </p>
              )}
              {loadingTextIndex >= 2 && (
                <p>
                  <span className="text-neon-green">&gt; </span>
                  <Typewriter text="Analisando lealdade e empatia de convivência..." speed={20} showCursor={false} playSound={soundActive} />
                </p>
              )}
              {loadingTextIndex >= 3 && (
                <p>
                  <span className="text-neon-green">&gt; </span>
                  <Typewriter text="Sincronizando frequências de rádio do abrigo..." speed={20} showCursor={false} playSound={soundActive} />
                </p>
              )}
              {loadingTextIndex >= 4 && (
                <p className="text-neon-green font-bold animate-pulse">
                  &gt; MISSÃO TOTALMENTE CARREGADA. ENTRANDO NO BUNKER...
                </p>
              )}
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs tracking-wider text-neon-green">
                <span>INDEXANDO_VECTORES</span>
                <span className="font-bold">{loadingProgress}%</span>
              </div>
              <div className="w-full h-3.5 bg-terminal-gray border border-neon-green/30 rounded overflow-hidden p-0.5">
                <div 
                  className="h-full bg-neon-green rounded-sm transition-all duration-150 ease-out shadow-[0_0_10px_rgba(0,255,102,0.6)]" 
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TELA DA MISSÃO: CAÇA AO TESOURO ==================== */}
        {screen === 'MISSION_SCREEN' && !isLoadingMission && (
          <div className="w-full space-y-6 animate-flicker">
            
            {/* Mission Progress Panel Header */}
            <div className="w-full bg-black/75 border border-neon-green/20 rounded-lg p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md border-glow-green select-none">
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-sm text-white tracking-wider uppercase">
                    CAÇA AO TESOURO OPERACIONAL
                  </h3>
                  <p className="font-mono text-[10px] text-neon-green/70">
                    SOBREVIVENTE: <span className="text-white">{name.toUpperCase()}</span> // CLASSE: <span className="text-neon-green">{currentClassDetails?.name}</span>
                  </p>
                </div>
              </div>

              {/* Top Progress bar: 0/4 to 4/4 */}
              <div className="w-full md:w-96 space-y-1">
                <div className="flex justify-between text-[11px] font-mono tracking-widest text-neon-green">
                  <span>DISPOSITIVOS RECORRADOS:</span>
                  <span className="font-bold">{completedItems.length} / 4 CONCLUÍDOS</span>
                </div>
                
                <div className="relative">
                  {/* Glowing progress background */}
                  <div className="w-full h-3 bg-terminal-gray border border-neon-green/20 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-neon-green rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,255,102,0.5)]" 
                      style={{ width: `${(completedItems.length / 4) * 100}%` }}
                    />
                  </div>
                  {/* Tick indicators */}
                  <div className="absolute inset-0 flex justify-between px-4 pointer-events-none text-[8px] font-mono text-zinc-500 font-bold -top-0.5">
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-terminal-gray/50 border border-neon-green/10 p-3 rounded text-center text-xs md:text-sm font-mono text-zinc-300">
              ⚡ <span className="text-white font-bold">INSTRUÇÃO:</span> Explore o blueprint abaixo e clique nos quatro componentes eletrônicos espalhados para decifrar as transmissões de rádio e encontrar o segredo de fuga.
            </div>

            {/* Interactive Vector MAP Canvas */}
            <InteractiveMap 
              completedItems={completedItems} 
              highlightedItemId={highlightedItemId}
              onItemClick={(id) => {
                if (completedItems.includes(id)) {
                  playTick();
                  return; // already completed
                }
                setActiveRiddleItem(id);
                setRiddleAnswerInput('');
                setRiddleErrorMsg('');
                setShowRiddleSuccess(false);
              }} 
            />

            {/* Bottom decoration */}
            <div className="flex justify-between items-center text-[10px] font-mono text-neon-green/40 select-none">
              <span>SYS_ENCRYPTION_STATUS: HARD_ALGORITHM_AES_256</span>
              <span>●</span>
              <span>DYNAMIC_ID: {selectedClass?.substring(0, 4)}-778-900</span>
            </div>
          </div>
        )}

        {/* ==================== TELA 4: FINAL REVEAL (DECRYPTING & SECRET WORD) ==================== */}
        {screen === 'FINAL_REVEAL' && (
          <div className="w-full max-w-3xl py-12 px-6 md:p-12 bg-black/85 border-2 border-neon-green/30 rounded-lg text-center backdrop-blur-md relative overflow-hidden border-glow-green-strong animate-flicker">
            
            {/* Decrypting Loading state */}
            {isDecrypting && (
              <div className="space-y-8 py-10">
                {/* Danger Pulsar */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full border border-neon-red/30 flex items-center justify-center bg-neon-red/5 animate-pulse">
                    <ShieldAlert className="w-8 h-8 text-neon-red animate-bounce" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="font-orbitron font-extrabold text-2xl tracking-widest text-white uppercase animate-pulse">
                    MISSÃO CONCLUÍDA
                  </h2>
                  <p className="font-mono text-sm text-neon-green">
                    Descriptografando transmissão confidencial de rádio...
                  </p>
                </div>

                {/* Progress bar and percentages */}
                <div className="max-w-md mx-auto space-y-3 font-mono">
                  <div className="flex justify-between text-xs text-neon-green">
                    <span>CRAQUEANDO_CHAVES</span>
                    <span className="font-bold">{decryptProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-terminal-gray border border-neon-green/30 rounded p-0.5">
                    <div 
                      className="h-full bg-neon-green rounded-sm transition-all duration-300"
                      style={{ width: `${decryptProgress}%` }}
                    />
                  </div>

                  {/* Intermittent visual feedback logs */}
                  <div className="text-[10px] text-zinc-500 space-y-1 h-12 overflow-hidden text-left mt-2 pl-2 border-l border-neon-green/20">
                    {decryptStep >= 1 && <div>[SYS] CHAVE ALFA EXTRAÍDA... (25%)</div>}
                    {decryptStep >= 2 && <div>[SYS] MATRIX SINAL RECOMBINADO... (57%)</div>}
                    {decryptStep >= 3 && <div>[SYS] CONEXÃO COM BANCO DE DADOS RESTAURADA... (82%)</div>}
                    {decryptStep >= 4 && <div className="text-neon-green">[SYS] PACOTE DESCRIPTOGRAFADO COM SUCESSO! (100%)</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Revealed Safe State */}
            {showFinalWord && (
              <div className="space-y-8 py-4">
                
                {/* Success Banner */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green text-xs font-mono tracking-widest mb-2 animate-pulse select-none">
                  <Award className="w-4 h-4" />
                  <span>TRANSMISSÃO DESCRIPTOGRAFADA // SECURE</span>
                </div>

                {/* Survivor Name and Status */}
                <div className="space-y-1.5 font-mono">
                  <h3 className="text-zinc-400 text-sm tracking-wider">
                    SOBREVIVENTE AVALIADO: <span className="text-white font-bold">{name.toUpperCase()}</span>
                  </h3>
                  <p className="text-neon-green text-xs tracking-wider">
                    OPERACIONAL: {currentClassDetails?.name.toUpperCase()}
                  </p>
                  <p className="text-xs text-zinc-300">
                    DESEMPENHO DA MISSÃO:{' '}
                    <span className={`font-bold ${
                      performanceScore === 100 
                        ? 'text-neon-green glow-green' 
                        : performanceScore >= 75 
                        ? 'text-neon-yellow' 
                        : 'text-neon-red animate-pulse'
                    }`}>
                      {performanceScore}% {
                        performanceScore === 100 
                          ? '(EXCELENTE - CLASSE ALFA)' 
                          : performanceScore >= 75 
                          ? '(BOM - OPERAÇÕES TÁTICAS)' 
                          : performanceScore >= 50 
                          ? '(REDUZIDO - SUPORTE ADICIONAL)' 
                          : '(CRÍTICO - DESEMPENHO COMPROMETIDO)'
                      }
                    </span>
                  </p>
                </div>

                {/* THE EXCLUSIVE SINGLE WORD REVEAL */}
                <div className="my-6 sm:my-10 p-4 sm:p-6 md:p-8 bg-terminal-gray border border-neon-green/20 rounded relative border-glow-green overflow-hidden">
                  <div className="absolute top-1 right-2 font-mono text-[8px] text-neon-green/40">SINAL_DADOS_CRIA_KEY_01</div>
                  
                  {/* CRT horizontal flickering scanner over the revealed word */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-neon-green/30 animate-scanline" />

                  <p className="font-mono text-xs text-neon-green/60 uppercase tracking-wide sm:tracking-widest mb-3 select-none">
                    Sua palavra secreta de identificação é:
                  </p>
                  
                  {/* GIANT GLOWING REVEALED WORD WITH RESPONSIVE SCALING AND NO OVERFLOW */}
                  <div className="font-orbitron font-black text-2xl min-[360px]:text-3xl min-[410px]:text-4xl sm:text-6xl md:text-8xl text-white glow-green tracking-wider sm:tracking-widest select-all animate-pulse py-2 break-words">
                    {currentClassDetails?.revealWord}
                  </div>
                  
                  <div className="absolute bottom-1 left-2 font-mono text-[8px] text-neon-green/30">SEGMENTO_REVELACAO: CONFIDENCIAL</div>
                </div>

                {/* WARNING FOOTER - EXPLICIT PROTOCOL */}
                <div className="max-w-xl mx-auto p-4 bg-neon-red/5 border border-neon-red/20 rounded text-left space-y-2.5 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2 text-neon-red font-bold">
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                    <span>⚠ PROTOCOLO DE CONFIANÇA MÚTUA</span>
                  </div>
                  <p className="leading-relaxed">
                    A palavra secreta acima representa uma fração cifrada do arquivo de fuga. 
                    <span className="text-white font-bold"> Não revele sua palavra levianamente</span> para preservar o teste de lealdade. 
                    A verdadeira sobrevivência depende da confiança. Una forças, coopere com seus amigos de verdade e combinem suas respectivas chaves de identificação para juntos revelarem a verdade completa!
                  </p>
                </div>

                {/* RESET OR COMPLETE */}
                <div className="pt-6 border-t border-neon-green/10">
                  <button
                    onClick={handleResetGame}
                    className="px-8 py-3.5 bg-terminal-dark border border-neon-green text-neon-green rounded font-orbitron font-bold tracking-widest text-sm hover:bg-neon-green hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(0,255,102,0.15)] hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] cursor-pointer uppercase"
                  >
                    FINALIZAR MISSÃO
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* ==================== GLOBAL RETAINED POPUPS & MODALS ==================== */}

      {/* 1. SPECIAL CHALLENGE POPUP */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none animate-flicker">
          
          {specialModalState === 'PROMPT' ? (
            <div className="w-full max-w-md bg-terminal-dark border-2 border-neon-yellow rounded-lg p-6 font-mono text-center border-glow-green">
              {/* Caution Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full border border-neon-yellow/30 flex items-center justify-center bg-neon-yellow/5 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-neon-yellow" />
                </div>
              </div>

              <h3 className="font-orbitron font-black text-lg text-neon-yellow tracking-wider mb-2">
                ⚠ PROTOCOLO AMIZADE VERDADEIRA
              </h3>
              
              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed text-left my-4">
                <p className="text-white font-bold border-b border-zinc-800 pb-1.5 mb-1.5">Antes de iniciarmos...</p>
                <p>
                  Este é um teste tático especial projetado para avaliar se o elo de amizade de vocês consegue sobreviver às pressões extremas do apocalipse.
                  Nossa varredura de emergência detectou quatro transmissões ocultas de rádio eletrônicas no abrigo.
                </p>
                <p className="text-neon-green font-bold">
                  Você aceita o desafio de caça ao tesouro para comprovar a força, lealdade e sobrevivência da sua amizade verdadeira?
                </p>
              </div>

              {/* Action options */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleAcceptSpecialMission}
                  className="py-3 bg-neon-green text-black font-orbitron font-bold text-xs tracking-widest rounded hover:bg-neon-green/80 transition-colors duration-300 cursor-pointer uppercase shadow-[0_0_10px_rgba(0,255,102,0.3)]"
                >
                  SIM, ACEITO
                </button>
                <button
                  onClick={handleRejectSpecialMission}
                  className="py-3 bg-zinc-900 border border-zinc-700 text-zinc-400 font-orbitron font-bold text-xs tracking-widest rounded hover:bg-zinc-800 hover:text-white transition-colors duration-300 cursor-pointer uppercase"
                >
                  NÃO, CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md bg-terminal-dark border border-neon-red/30 rounded-lg p-6 font-mono text-center border-glow-red">
              <div className="flex justify-center mb-4">
                <ShieldAlert className="w-12 h-12 text-neon-red animate-pulse" />
              </div>
              <h3 className="font-orbitron font-bold text-neon-red tracking-wider uppercase mb-3">
                AVALIAÇÃO REJEITADA
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed mb-6">
                Talvez você ainda não esteja preparado para sobreviver à hostilidade deste apocalipse.
              </p>
              <button
                onClick={() => {
                  playTick();
                  setShowSpecialModal(false);
                }}
                className="w-full py-3 bg-neon-red text-white font-orbitron font-bold text-xs tracking-widest rounded hover:bg-neon-red/80 transition-all duration-300 cursor-pointer uppercase"
              >
                Voltar
              </button>
            </div>
          )}

        </div>
      )}

      {/* 2. RIDDLE RESOLUTION MODAL */}
      {activeRiddleItem && (
        (() => {
          const itemData = MISSION_ITEMS[activeRiddleItem];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-flicker">
              <div className="w-full max-w-lg bg-terminal-dark border border-neon-green/40 rounded-lg p-5 md:p-6 font-mono border-glow-green relative">
                
                {/* Header indicators */}
                <div className="flex items-center justify-between border-b border-neon-green/20 pb-3 mb-4 text-xs text-neon-green select-none">
                  <span className="font-bold flex items-center gap-1.5 uppercase">
                    <Radio className="w-4 h-4 animate-ping" /> DECIFRANDO TRANSMISSÃO: {itemData.label}
                  </span>
                  <button
                    onClick={() => {
                      playTick();
                      setActiveRiddleItem(null);
                    }}
                    className="p-1 hover:bg-neon-green/10 rounded text-neon-green hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Riddle Description */}
                <div className="space-y-4">
                  
                  {/* Success animation block overlay */}
                  {showRiddleSuccess ? (
                    <div className="py-8 text-center space-y-3 animate-pulse">
                      <div className="inline-flex w-14 h-14 rounded-full bg-neon-green/20 text-neon-green border-2 border-neon-green items-center justify-center mx-auto border-glow-green-strong">
                        <Check className="w-8 h-8" />
                      </div>
                      <h4 className="text-neon-green font-orbitron font-bold text-lg tracking-wider uppercase">
                        SINAL AUTORIZADO!
                      </h4>
                      <p className="text-zinc-400 text-xs">
                        Coordenadas do dispositivo gravadas no banco de dados.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Character item prompt */}
                      <div className="p-4 bg-terminal-gray border border-neon-green/15 rounded flex items-start gap-3.5">
                        <span className="text-3xl p-1 select-none">{itemData.emoji}</span>
                        <div>
                          <h4 className="text-white text-sm font-bold font-orbitron uppercase tracking-wider mb-1">
                            Dispositivo: {itemData.label}
                          </h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Criptografia de rádio detectada. Decifre a charada do terminal para liberar o acesso:
                          </p>
                        </div>
                      </div>

                      {/* Riddle text block */}
                      <div className="bg-black/40 border-l-4 border-neon-green p-4 rounded text-sm text-neon-green italic leading-relaxed my-2">
                        "{itemData.riddle}"
                      </div>

                      {/* Unlocked hints section */}
                      {errorCounts[activeRiddleItem] > 0 && (
                        <div className="p-3 bg-neon-yellow/10 border border-neon-yellow/30 rounded text-xs space-y-2 select-none">
                          <div className="font-bold text-neon-yellow flex items-center gap-1.5 uppercase tracking-wide">
                            <Zap className="w-3.5 h-3.5 animate-pulse" />
                            <span>Dicas Desbloqueadas ({Math.min(5, errorCounts[activeRiddleItem])}/5)</span>
                          </div>
                          <ul className="space-y-1.5 text-zinc-300 font-mono text-[11px] list-disc pl-4">
                            {errorCounts[activeRiddleItem] >= 1 && (
                              <li>
                                <strong className="text-neon-yellow">Tamanho:</strong> A palavra possui exatamente <span className="text-white font-bold">{itemData.letterCount}</span> letras.
                              </li>
                            )}
                            {errorCounts[activeRiddleItem] >= 2 && (
                              <li>
                                <strong className="text-neon-yellow">Uso/Função:</strong> {itemData.hint2}
                              </li>
                            )}
                            {errorCounts[activeRiddleItem] >= 3 && (
                              <li>
                                <strong className="text-neon-yellow">Contexto:</strong> {itemData.hint3}
                              </li>
                            )}
                            {errorCounts[activeRiddleItem] >= 4 && (
                              <li className="text-neon-green animate-pulse">
                                <strong className="text-neon-green">Radar Ativo:</strong> A ilustração física está piscando em amarelo no mapa estratégico ao fundo!
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Answer Submission Form */}
                      <form onSubmit={handleRiddleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="block text-xs text-zinc-400 tracking-wider uppercase">
                            Insira sua resposta lógica:
                          </label>
                          <input
                            type="text"
                            value={riddleAnswerInput}
                            onChange={(e) => {
                              setRiddleAnswerInput(e.target.value);
                              if (riddleErrorMsg) setRiddleErrorMsg('');
                            }}
                            placeholder="DIGITE SUA RESPOSTA AQUI..."
                            autoFocus
                            className="w-full bg-terminal-gray/80 border border-neon-green/30 text-white rounded py-3 px-4 font-mono text-sm tracking-wide focus:outline-none focus:border-neon-green transition-all"
                          />
                        </div>

                        {/* Error Warning */}
                        {riddleErrorMsg && (
                          <div className="p-2.5 bg-neon-red/10 border border-neon-red/30 rounded text-neon-red text-xs font-mono leading-relaxed flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-pulse" />
                            <span>{riddleErrorMsg}</span>
                          </div>
                        )}

                        {/* Emergency Assist Action Option */}
                        {errorCounts[activeRiddleItem] >= 5 && !useAssistRequested[activeRiddleItem] && (
                          <div className="p-3 bg-neon-red/10 border border-neon-red/25 rounded space-y-2">
                            <p className="text-[10px] text-zinc-300 leading-normal">
                              🚨 <strong className="text-neon-red">DESCRIPTOGRAFIA DO MAINFRAME:</strong> Erros múltiplos detectados. Você pode forçar a revelação do sinal, mas isso reduzirá permanentemente seu desempenho tático (-25%).
                            </p>
                            {confirmAssistId === activeRiddleItem ? (
                              <div className="p-2 bg-black/60 border border-neon-red/40 rounded text-center space-y-2">
                                <span className="text-[10px] text-neon-red font-bold block">CONFIRMAR SUPORTE DO MAINFRAME?</span>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmAssist(activeRiddleItem)}
                                    className="px-3 py-1 bg-neon-red text-white text-[10px] font-bold rounded uppercase cursor-pointer"
                                  >
                                    SIM, SOLICITAR (-25% SCORE)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelAssist}
                                    className="px-3 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold rounded uppercase cursor-pointer"
                                  >
                                    NÃO, DEIXA PRA LÁ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRequestAssist(activeRiddleItem)}
                                className="w-full py-2 bg-neon-red text-white hover:bg-neon-red/80 rounded text-[11px] font-orbitron font-bold tracking-wider transition uppercase cursor-pointer shadow-[0_0_10px_rgba(255,0,51,0.2)]"
                              >
                                SOLICITAR DECODIFICAÇÃO DO MAINFRAME
                              </button>
                            )}
                          </div>
                        )}

                        {/* Submit Actions */}
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              playTick();
                              setActiveRiddleItem(null);
                            }}
                            className="flex-1 py-3 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded text-xs font-orbitron font-bold tracking-widest hover:text-white transition uppercase cursor-pointer"
                          >
                            Fechar
                          </button>
                          <button
                            type="submit"
                            disabled={!riddleAnswerInput.trim()}
                            className={`flex-1 py-3 rounded text-xs font-orbitron font-bold tracking-widest transition uppercase cursor-pointer ${
                              riddleAnswerInput.trim()
                                ? 'bg-neon-green text-black hover:bg-neon-green/85 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            Responder
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* FOOTER SYSTEM STRIP */}
      <footer className="relative w-full z-40 bg-black/90 border-t border-neon-green/15 px-4 py-2.5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-neon-green/50 select-none gap-2">
        <div>
          SYS_OPERATIONAL_MATRIX v2.40 // EXCLUSIVE INTEL
        </div>
        <div className="flex items-center gap-4 text-zinc-500">
          <span>ALVO: SOBREVIVÊNCIA DA AMIZADE VERDADEIRA</span>
          <span>●</span>
          <span>APOCALIPSE ZUMBI © 2026</span>
        </div>
      </footer>

    </div>
  );
}
