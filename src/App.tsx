import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PARTS, DINOSAUR_POOL, shuffle } from './data/parts';
import type { PartDef } from './data/parts';
import { useDotPad } from './dotpad/useDotPad';
import { PinPlate } from './components/PinPlate';
import { CampBackdrop } from './components/CampBackdrop';
import { MenuIcon } from './components/MenuIcon';
import { StoryScreen } from './components/StoryScreen';
import { FormationScreen } from './components/FormationScreen';
import { DigExperienceScreen } from './components/DigExperienceScreen';
import { ExpeditionScreen } from './components/ExpeditionScreen';
import { CampaignMissionScreen, CampaignStatusScreen, JourneyHome, ResearchCollectionScreen, TrainingLabScreen } from './components/CampaignScreens';
import { speak, replay, subscribeSpeech } from './tts';
import { IS_EMBED, SHOW_PREVIEW, postExit } from './embed';
import { useKeys } from './hooks/useKeys';
import { loadProgress, reconcileProgress, saveProgress } from './progress';
import type { Progress } from './progress';
import { BADGES, FIELD_TOOLS, LEVEL_NAMES, MISSIONS } from './campaign/campaignData';
import introImage from './assets/Dot-Fossil-Lab-intro.png';
import introMobileImage from './assets/Dot-Fossil-Lab-intro-mobile.png';

type Screen = 'intro' | 'home' | 'campaign' | 'research' | 'training' | 'status' | 'learn' | 'quiz1' | 'quiz2' | 'collection' | 'story' | 'formation' | 'dig' | 'expedition';

const KEY_HELP =
  '조작 안내. 화살표로 이동, 엔터로 선택. 에프2 다시 듣기, 에프3 진행도, 에프4 촉각 패턴 다시 출력, 에프1 홈으로. ' +
  '닷패드에서는 기능키 1과 2로 위아래, 패닝키로 좌우, 기능키 3으로 선택, 기능키 4로 표시, 전체 패닝키로 음성을 다시 들어요.';

export default function App() {
  const [screen, setScreen] = useState<Screen>(IS_EMBED ? 'home' : 'intro');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [returnScreen, setReturnScreen] = useState<Screen>('home');
  const [activityReturn, setActivityReturn] = useState<Screen>('home');
  const [homeIndex, setHomeIndex] = useState(0);
  const [liveSpeech, setLiveSpeech] = useState('');
  const pad = useDotPad();

  const updateProgress = useCallback((fn: (p: Progress) => Progress) => {
    setProgress(prev => {
      const next = reconcileProgress(fn(prev));
      saveProgress(next);
      const levelUp = next.campaign.level > prev.campaign.level;
      const newBadges = Object.keys(next.campaign.earnedBadges).filter(id => !prev.campaign.earnedBadges[id]);
      if (levelUp || newBadges.length) {
        window.setTimeout(() => {
          const messages: string[] = [];
          if (levelUp) {
            const tool = FIELD_TOOLS.find(x => x.level === next.campaign.level);
            const mission = MISSIONS[next.campaign.level - 1];
            const fragmentCount = Object.values(next.campaign.fragments).reduce((n,x)=>n+Number(x.body)+Number(x.signature)+Number(x.footprint),0);
            messages.push(`${LEVEL_NAMES[next.campaign.level-1]}로 레벨업했습니다. ${tool?.name ?? '새 도구'}를 얻었어요. ${mission.title}이 열렸습니다. 다음 임무는 ${mission.goal} 현재 조각은 15개 중 ${fragmentCount}개입니다. ${mission.teaser}`);
          }
          for (const id of newBadges) {
            const badge = BADGES.find(x => x.id === id);
            if (badge) messages.push(`${badge.name} 배지를 받았어요. ${badge.desc}`);
          }
          speak(messages.join(' '));
        }, 1500);
      }
      return next;
    });
  }, []);

  const goHome = useCallback(() => setScreen('home'), []);

  useEffect(() => subscribeSpeech(setLiveSpeech), []);

  useEffect(() => {
    const showStatus = (e: KeyboardEvent) => {
      if (e.key !== 'F3' || screen === 'intro' || screen === 'status') return;
      e.preventDefault(); e.stopImmediatePropagation();
      setReturnScreen(screen); setScreen('status');
    };
    window.addEventListener('keydown', showStatus, true);
    return () => window.removeEventListener('keydown', showStatus, true);
  }, [screen]);

  useEffect(() => {
    if (screen === 'intro') return;
    requestAnimationFrame(() => {
      const title = document.querySelector('.screen-title') as HTMLElement | null;
      if (title) { title.tabIndex = -1; title.focus(); }
    });
  }, [screen]);

  return (
    <div className={`app ${IS_EMBED ? 'app--embed' : ''} ${screen === 'intro' ? 'app--intro' : ''}`}>
      <CampBackdrop />
      {!IS_EMBED && screen !== 'intro' && (
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">⠙⠋</span>
            <h1>Dot Fossil Lab</h1>
            <span className="brand-sub">공룡 화석 부위 맞추기</span>
          </div>
          <PadStatus pad={pad} />
        </header>
      )}
      {IS_EMBED && screen !== 'intro' && (
        <div className="embed-strip">
          <PadStatus pad={pad} />
        </div>
      )}

      <main className={`stage ${screen === 'intro' ? 'stage--intro' : ''}`}>
        <p className="visually-hidden" aria-live="polite" aria-atomic="true">{liveSpeech}</p>
        {screen === 'intro' && (
          <IntroScreen onStart={() => setScreen('home')} />
        )}
        {screen === 'home' && (
          <JourneyHome pad={pad} progress={progress} onNavigate={setScreen} initialIndex={homeIndex} onIndex={setHomeIndex} />
        )}
        {screen === 'campaign' && (
          <CampaignMissionScreen pad={pad} progress={progress} onNavigate={s => { if (s === 'status') setReturnScreen('campaign'); else setActivityReturn('campaign'); setScreen(s); }} onHome={goHome} updateProgress={updateProgress} />
        )}
        {screen === 'training' && (
          <TrainingLabScreen onNavigate={s => { setActivityReturn('training'); setScreen(s); }} onHome={goHome} />
        )}
        {screen === 'research' && (
          <ResearchCollectionScreen pad={pad} progress={progress} onHome={goHome} />
        )}
        {screen === 'status' && (
          <CampaignStatusScreen pad={pad} progress={progress} onReturn={() => setScreen(returnScreen)} />
        )}
        {screen === 'learn' && (
          <LearnScreen pad={pad} onHome={() => setScreen(activityReturn)} updateProgress={updateProgress} />
        )}
        {screen === 'dig' && (
          <DigExperienceScreen pad={pad} onHome={() => setScreen(activityReturn)} updateProgress={updateProgress} />
        )}
        {screen === 'expedition' && (
          <ExpeditionScreen pad={pad} onHome={() => setScreen(activityReturn)} updateProgress={updateProgress} />
        )}
        {screen === 'formation' && (
          <FormationScreen pad={pad} onHome={() => setScreen(activityReturn)} updateProgress={updateProgress} />
        )}
        {screen === 'story' && (
          <StoryScreen pad={pad} onHome={() => setScreen(activityReturn)} updateProgress={updateProgress} />
        )}
        {(screen === 'quiz1' || screen === 'quiz2') && (
          <QuizScreen
            key={screen}
            level={screen === 'quiz1' ? 1 : 2}
            pad={pad}
            onHome={() => setScreen(activityReturn)}
            updateProgress={updateProgress}
          />
        )}
        {screen === 'collection' && (
          <CollectionScreen pad={pad} progress={progress} onHome={goHome} />
        )}
      </main>
    </div>
  );
}

// ── 인트로 ───────────────────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    speak('닷 화석 연구소. 공룡 화석 부위 맞추기. 엔터를 눌러 연구소에 입장하세요.');
  }, []);

  useKeys(e => {
    if (e.key === 'Enter') {
      onStart();
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F1') {
      speak('엔터를 누르면 연구소에 입장합니다. 닷패드에서는 기능키 3을 누르세요.');
    }
  });

  return (
    <section className="intro-screen" aria-labelledby="intro-title">
      <picture className="intro-picture" aria-hidden="true">
        <source media="(orientation: portrait)" srcSet={introMobileImage} />
        <img className="intro-art" src={introImage} alt="" />
      </picture>
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-content">
        <p className="intro-kicker">TACTILE EXPEDITION · RESEARCH FILE 01</p>
        <h2 id="intro-title" className="visually-hidden">닷 화석 연구소 — 공룡 화석 부위 맞추기</h2>
        <button className="intro-start" type="button" onClick={onStart} autoFocus>
          <span className="intro-start__signal" aria-hidden="true" />
          <span>
            <strong>연구소 입장</strong>
            <small>ENTER · 닷패드 F3</small>
          </span>
          <span className="intro-start__arrow" aria-hidden="true">›</span>
        </button>
        <p className="intro-help">화살표로 탐색하고 손끝으로 화석의 비밀을 밝혀 보세요</p>
      </div>
    </section>
  );
}

// ── 닷패드 연결 상태 ─────────────────────────────────────────────────────────
function PadStatus({ pad }: { pad: ReturnType<typeof useDotPad> }) {
  const label =
    pad.status === 'connected' ? '닷패드 연결됨' :
    pad.status === 'connecting' ? '연결 중…' :
    pad.status === 'unsupported' ? '이 브라우저는 블루투스 미지원' : '닷패드 미연결';
  return (
    <div className="pad-status">
      <span className={`pad-dot pad-dot--${pad.status}`} aria-hidden="true" />
      <span aria-live="polite">{label}</span>
      {pad.status === 'connected' ? (
        <button type="button" onClick={pad.disconnect}>연결 해제</button>
      ) : (
        <button type="button" onClick={pad.connect}>닷패드 연결</button>
      )}
    </div>
  );
}

// ── 홈 ───────────────────────────────────────────────────────────────────────
function HomeScreen({
  pad, progress, onNavigate,
}: {
  pad: ReturnType<typeof useDotPad>;
  progress: Progress;
  onNavigate: (s: Screen) => void;
}) {
  const items = useMemo(() => {
    const list: { id: string; label: string; hint: string; run: () => void }[] = [
      { id: 'learn', label: '화석 탐색 학습', hint: '다섯 가지 화석을 천천히 만져 보며 배워요', run: () => onNavigate('learn') },
      { id: 'dig', label: '발굴 체험', hint: '탐침 → 붓질 → 추출, 진짜 발굴 순서를 따라해요', run: () => onNavigate('dig') },
      { id: 'formation', label: '화석이 되기까지', hint: `공룡이 화석이 되는 여섯 단계 이야기${progress.formationDone ? ' · 완주' : ''}`, run: () => onNavigate('formation') },
      { id: 'story', label: '공룡 이야기', hint: '다섯 공룡의 생애, 서식지, 크기를 만나요', run: () => onNavigate('story') },
      { id: 'expedition', label: '화석 신호 추적', hint: `신호를 좇아 화석을 찾고 공룡을 복원해요 · ${progress.expeditionRounds}마리 복원`, run: () => onNavigate('expedition') },
      { id: 'quiz1', label: '퀴즈 1 · 부위 맞추기', hint: `손끝으로 어느 부위인지 맞혀요 · 최고 ${progress.best.lv1}점`, run: () => onNavigate('quiz1') },
      { id: 'quiz2', label: '퀴즈 2 · 주인 찾기', hint: `이 화석의 주인 공룡을 맞혀요 · 최고 ${progress.best.lv2}점`, run: () => onNavigate('quiz2') },
      { id: 'collection', label: '화석 도감', hint: '지금까지 배운 화석을 다시 만나요', run: () => onNavigate('collection') },
      {
        id: 'connect',
        label: pad.status === 'connected' ? '닷패드 연결 해제' : '닷패드 연결하기',
        hint: '웹 블루투스로 닷패드를 연결해요',
        run: () => (pad.status === 'connected' ? pad.disconnect() : pad.connect()),
      },
    ];
    if (IS_EMBED) {
      list.push({ id: 'exit', label: '게임 나가기', hint: '택타일 월드로 돌아가요', run: () => { speak('게임을 마칩니다.'); postExit(); } });
    }
    return list;
  }, [pad, progress, onNavigate]);

  const [idx, setIdx] = useState(0);
  const announced = useRef(false);

  const GRID_COLS = 3;
  const gridRows = Math.ceil(items.length / GRID_COLS);

  const moveGrid = useCallback((dRow: number, dCol: number, from: number) => {
    let row = Math.floor(from / GRID_COLS);
    let col = from % GRID_COLS;
    if (dCol !== 0) {
      const rowStart = row * GRID_COLS;
      const rowLen = Math.min(GRID_COLS, items.length - rowStart);
      col = (col + dCol + rowLen) % rowLen;
    }
    if (dRow !== 0) {
      row = (row + dRow + gridRows) % gridRows;
      const rowStart = row * GRID_COLS;
      const rowLen = Math.min(GRID_COLS, items.length - rowStart);
      col = Math.min(col, rowLen - 1);
    }
    return row * GRID_COLS + col;
  }, [items.length, gridRows]);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    speak(
      '닷 포실 랩, 공룡 화석 부위 맞추기에 온 걸 환영해요. ' +
      '화살표로 칸을 옮기고 엔터로 시작하세요. 처음이라면 화석 탐색 학습부터 해 보세요.',
    );
    pad.sendText('닷 포실 랩');
  }, [pad]);

  useKeys(e => {
    if (e.key === 'ArrowDown') {
      const n = moveGrid(1, 0, idx);
      setIdx(n);
      speak(`${items[n].label}. ${items[n].hint}`);
    } else if (e.key === 'ArrowUp') {
      const n = moveGrid(-1, 0, idx);
      setIdx(n);
      speak(`${items[n].label}. ${items[n].hint}`);
    } else if (e.key === 'ArrowRight') {
      const n = moveGrid(0, 1, idx);
      setIdx(n);
      speak(`${items[n].label}. ${items[n].hint}`);
    } else if (e.key === 'ArrowLeft') {
      const n = moveGrid(0, -1, idx);
      setIdx(n);
      speak(`${items[n].label}. ${items[n].hint}`);
    } else if (e.key === 'Enter') {
      items[idx].run();
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      speak(`메뉴 ${items.length}개 중 ${idx + 1}번째, ${items[idx].label}.`);
    } else if (e.key === 'F1') {
      speak(KEY_HELP);
    }
  });

  return (
    <section className="menu-screen" aria-label="메인 메뉴">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">FOSSIL RESEARCH CONSOLE · ONLINE</p>
          <h2 className="screen-title">오늘의 발굴 임무를 선택하세요</h2>
        </div>
        <div className="mission-rank" aria-label={`퀴즈 최고 점수 ${progress.best.lv1 + progress.best.lv2}점`}>
          <span>RESEARCH SCORE</span>
          <strong>{progress.best.lv1 + progress.best.lv2}<small>/10</small></strong>
        </div>
      </div>
      <ul className="menu-list menu-list--home" role="listbox" aria-label="메뉴">
        {items.map((it, i) => (
          <li
            key={it.id}
            role="option"
            aria-selected={i === idx}
            className={`${i === idx ? 'is-active' : ''} menu-item--${it.id}`}
            onClick={() => { setIdx(i); it.run(); }}
          >
            <MenuIcon id={it.id} />
            <span className="menu-label">{it.label}</span>
            <span className="menu-hint">{it.hint}</span>
            <span className="menu-chevron" aria-hidden="true">›</span>
          </li>
        ))}
      </ul>
      <p className="key-help">↑↓←→ 칸 이동 · Enter 선택 · F1 도움말 · F2 다시 듣기</p>
    </section>
  );
}

// ── 학습(탐색) 모드 ─────────────────────────────────────────────────────────
function LearnScreen({
  pad, onHome, updateProgress,
}: {
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  // 마지막 항목 뒤에 '홈으로' 가상 항목 — 방향키+확인만으로 모든 이동 가능(닷패드 단독 조작)
  const total = PARTS.length + 1;
  const [idx, setIdx] = useState(0);

  const announce = useCallback((i: number, withIntro = false) => {
    if (i === PARTS.length) {
      speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.');
      return;
    }
    const p = PARTS[i];
    pad.sendHex(p.hex);
    pad.sendText(p.name);
    speak(
      `${withIntro ? '화석 탐색 학습. 좌우 화살표로 넘기면 바로 설명을 들어요. ' : ''}` +
      `${i + 1}번 화석, ${p.name}. ${p.feel} 이 화석의 주인은 ${p.dinosaurName}. ${p.dinosaurFact}`,
    );
    updateProgress(prev => ({ ...prev, learned: { ...prev.learned, [p.id]: true } }));
  }, [pad, updateProgress]);

  useEffect(() => { announce(0, true); }, [announce]);

  useKeys(e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const n = (idx + 1) % total;
      setIdx(n); announce(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const n = (idx - 1 + total) % total;
      setIdx(n); announce(n);
    } else if (e.key === 'Enter') {
      if (idx === PARTS.length) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      replay();
    } else if (e.key === 'F1') {
      onHome(); speak('메뉴로 돌아왔어요.');
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      speak(idx === PARTS.length ? '마지막, 홈으로 돌아가기.' : `화석 ${PARTS.length}개 중 ${idx + 1}번째.`);
    } else if (e.key === 'F4') {
      if (idx < PARTS.length) { pad.sendHex(PARTS[idx].hex); speak('촉각 패턴을 다시 보냈어요.'); }
    }
  });

  const isHomeItem = idx === PARTS.length;
  const part = isHomeItem ? null : PARTS[idx];

  return (
    <section className="learn-screen" aria-label="화석 탐색 학습">
      <p className="eyebrow">탐색 학습 · {isHomeItem ? '끝' : `${idx + 1} / ${PARTS.length}`}</p>
      {part ? (
        <>
          <h2 className="screen-title">{part.name} <span className="title-en">{part.nameEn}</span></h2>
          <p className="lede">{part.feel}</p>
          <p className="fact"><strong>{part.dinosaurName}</strong> — {part.dinosaurFact}</p>
          {SHOW_PREVIEW && <PinPlate hex={part.hex} label={part.name} />}
        </>
      ) : (
        <>
          <h2 className="screen-title">홈으로 돌아가기</h2>
          <p className="lede">엔터를 누르면 메뉴로 돌아가요.</p>
        </>
      )}
      <p className="key-help">←→ 넘기면 바로 설명 재생 · F4 패턴 다시 출력 · F2 다시 듣기 · F1 홈</p>
    </section>
  );
}

// ── 퀴즈 ─────────────────────────────────────────────────────────────────────
interface Question {
  part: PartDef;
  prompt: string;       // 음성 질문
  choices: string[];    // 보기 4개
  answerIdx: number;
  explain: string;      // 정답 후 설명
}

function buildQuestions(level: 1 | 2): Question[] {
  return shuffle(PARTS).map(part => {
    if (level === 1) {
      const wrong = shuffle(PARTS.filter(p => p.id !== part.id)).slice(0, 3).map(p => p.name);
      const choices = shuffle([part.name, ...wrong]);
      return {
        part,
        prompt: '닷패드의 화석을 천천히 만져 보세요. 이것은 어느 부위일까요?',
        choices,
        answerIdx: choices.indexOf(part.name),
        explain: part.feel,
      };
    }
    const wrong = shuffle(DINOSAUR_POOL.filter(d => d !== part.dinosaurName)).slice(0, 3);
    const choices = shuffle([part.dinosaurName, ...wrong]);
    return {
      part,
      prompt: `닷패드의 화석은 ${part.name}이에요. 이 ${part.name}의 주인은 어느 공룡일까요?`,
      choices,
      answerIdx: choices.indexOf(part.dinosaurName),
      explain: part.dinosaurFact,
    };
  });
}

function QuizScreen({
  level, pad, onHome, updateProgress,
}: {
  level: 1 | 2;
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(level));
  const [qIdx, setQIdx] = useState(0);
  const [choice, setChoice] = useState(0);
  const [phase, setPhase] = useState<'question' | 'feedback' | 'result'>('question');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [feedbackChoice, setFeedbackChoice] = useState(0);
  const [resultChoice, setResultChoice] = useState(0);

  const q = questions[qIdx];

  const readQuestion = useCallback((question: Question, num: number, withIntro = false) => {
    pad.sendHex(question.part.hex);
    pad.sendText(level === 1 ? '무슨 부위일까요' : question.part.name);
    const choiceText = question.choices.map((c, i) => `${i + 1}번 ${c}`).join(', ');
    speak(
      `${withIntro ? `퀴즈 ${level === 1 ? '일' : '이'} 시작. 다섯 문제예요. ` : ''}` +
      `문제 ${num}. ${question.prompt} 보기, ${choiceText}, 마지막 홈으로 돌아가기. 위아래 화살표로 고르고 엔터를 누르세요.`,
    );
  }, [pad, level]);

  useEffect(() => { readQuestion(questions[0], 1, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finishOrNext = useCallback(() => {
    if (qIdx + 1 < questions.length) {
      const n = qIdx + 1;
      setQIdx(n); setChoice(0); setPhase('question');
      readQuestion(questions[n], n + 1);
    } else {
      setPhase('result');
      setResultChoice(0);
      const finalScore = score;
      updateProgress(prev => ({
        ...prev,
        best: {
          ...prev.best,
          [level === 1 ? 'lv1' : 'lv2']: Math.max(prev.best[level === 1 ? 'lv1' : 'lv2'], finalScore),
        },
      }));
      pad.sendText(`${finalScore}점`);
      speak(
        `퀴즈 끝. 다섯 문제 중 ${finalScore}문제를 맞혔어요. ` +
        (finalScore === 5 ? '완벽해요, 훌륭한 고생물학자예요! ' : finalScore >= 3 ? '잘했어요! ' : '괜찮아요, 탐색 학습에서 다시 만져 보면 금방 늘어요. ') +
        '위아래 화살표로, 다시 하기 또는 홈으로 를 고르세요.',
      );
    }
  }, [qIdx, questions, score, level, pad, readQuestion, updateProgress]);

  useKeys(e => {
    if (e.key === 'F2') { replay(); return; }
    if (e.key === 'F1') { onHome(); speak('메뉴로 돌아왔어요.'); return; }
    if (e.key === 'F4') { pad.sendHex(q.part.hex); speak('촉각 패턴을 다시 보냈어요.'); return; }
    if (e.key === 'F3') {
      speak(`다섯 문제 중 ${qIdx + 1}번째 문제, 지금까지 ${score}문제 정답.`);
      return;
    }

    if (phase === 'question') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const n = (choice + 1) % (q.choices.length + 1);
        setChoice(n);
        speak(n === q.choices.length ? '마지막, 홈으로 돌아가기.' : `${n + 1}번, ${q.choices[n]}`);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const n = (choice - 1 + q.choices.length + 1) % (q.choices.length + 1);
        setChoice(n);
        speak(n === q.choices.length ? '마지막, 홈으로 돌아가기.' : `${n + 1}번, ${q.choices[n]}`);
      } else if (e.key === 'Enter') {
        if (choice === q.choices.length) {
          onHome(); speak('메뉴로 돌아왔어요.'); return;
        }
        const correct = choice === q.answerIdx;
        setLastCorrect(correct);
        setFeedbackChoice(0);
        setPhase('feedback');
        if (correct) {
          setScore(s => s + 1);
          updateProgress(prev => ({
            ...prev,
            correct: {
              ...prev.correct,
              [q.part.id]: { ...prev.correct[q.part.id], [level === 1 ? 'lv1' : 'lv2']: true },
            },
          }));
          pad.sendText('정답');
          speak(`딩동댕, 정답이에요! ${q.explain} 위아래 화살표로 ${qIdx + 1 < questions.length ? '다음 문제' : '결과 보기'} 또는 홈으로 돌아가기를 고르세요.`);
        } else {
          pad.sendText('아쉬워요');
          speak(`아쉬워요. 정답은 ${q.choices[q.answerIdx]}이에요. ${q.explain} 위아래 화살표로 ${qIdx + 1 < questions.length ? '다음 문제' : '결과 보기'} 또는 홈으로 돌아가기를 고르세요.`);
        }
      }
    } else if (phase === 'feedback') {
      const opts = [qIdx + 1 < questions.length ? '다음 문제' : '결과 보기', '홈으로 돌아가기'];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const n = (feedbackChoice + 1) % opts.length;
        setFeedbackChoice(n); speak(opts[n]);
      } else if (e.key === 'Enter') {
        if (feedbackChoice === 1) { onHome(); speak('메뉴로 돌아왔어요.'); }
        else finishOrNext();
      }
    } else if (phase === 'result') {
      const opts = ['다시 하기', '홈으로'];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const n = (resultChoice + 1) % opts.length;
        setResultChoice(n); speak(opts[n]);
      } else if (e.key === 'Enter') {
        if (resultChoice === 0) {
          const fresh = buildQuestions(level);
          setQuestions(fresh); setQIdx(0); setChoice(0); setScore(0); setPhase('question');
          readQuestion(fresh[0], 1, true);
        } else {
          onHome(); speak('메뉴로 돌아왔어요.');
        }
      }
    }
  });

  if (phase === 'result') {
    return (
      <section className="quiz-screen" aria-label="퀴즈 결과">
        <p className="eyebrow">퀴즈 {level} · 결과</p>
        <h2 className="screen-title">{score} / {questions.length} 문제 정답</h2>
        <p className="lede">{score === 5 ? '완벽해요! 훌륭한 고생물학자예요.' : score >= 3 ? '잘했어요!' : '탐색 학습에서 다시 만져 보면 금방 늘어요.'}</p>
        <ul className="menu-list" role="listbox" aria-label="다음 행동">
          {['다시 하기', '홈으로'].map((label, i) => (
            <li key={label} role="option" aria-selected={i === resultChoice} className={i === resultChoice ? 'is-active' : ''}>
              <span className="menu-label">{label}</span>
            </li>
          ))}
        </ul>
        <p className="key-help">↑↓ 이동 · Enter 선택</p>
      </section>
    );
  }

  return (
    <section className="quiz-screen" aria-label={`퀴즈 ${level}`}>
      <p className="eyebrow">퀴즈 {level} · 문제 {qIdx + 1} / {questions.length} · 점수 {score}</p>
      <h2 className="screen-title">{q.prompt}</h2>
      <ol className="choice-list" role="listbox" aria-label="보기">
        {q.choices.map((c, i) => {
          const state =
            phase === 'feedback' && i === q.answerIdx ? 'is-answer' :
            phase === 'feedback' && i === choice && !lastCorrect ? 'is-wrong' :
            i === choice ? 'is-active' : '';
          return (
            <li key={c} role="option" aria-selected={i === choice} className={state}>
              <span className="choice-num">{i + 1}</span>
              <span>{c}</span>
            </li>
          );
        })}
        {phase === 'question' && (
          <li role="option" aria-selected={choice === q.choices.length} className={choice === q.choices.length ? 'is-active' : ''}>
            <span className="choice-num">⌂</span>
            <span>홈으로 돌아가기</span>
          </li>
        )}
      </ol>
      {phase === 'feedback' && (
        <>
          <p className={`feedback ${lastCorrect ? 'feedback--ok' : 'feedback--no'}`} aria-live="assertive">
            {lastCorrect ? '정답!' : `아쉬워요 — 정답은 ${q.choices[q.answerIdx]}`} <span className="feedback-explain">{q.explain}</span>
          </p>
          <ul className="menu-list" role="listbox" aria-label="다음 행동">
            {[qIdx + 1 < questions.length ? '다음 문제' : '결과 보기', '홈으로 돌아가기'].map((label, i) => (
              <li key={label} role="option" aria-selected={i === feedbackChoice} className={i === feedbackChoice ? 'is-active' : ''}>
                <span className="menu-label">{label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {SHOW_PREVIEW && <PinPlate hex={q.part.hex} label={level === 1 ? '???' : q.part.name} />}
      <p className="key-help">↑↓ 이동 · Enter 선택 · F4 패턴 다시 출력 · F2 다시 듣기</p>
    </section>
  );
}

// ── 도감 ─────────────────────────────────────────────────────────────────────
function CollectionScreen({
  pad, progress, onHome,
}: {
  pad: ReturnType<typeof useDotPad>;
  progress: Progress;
  onHome: () => void;
}) {
  const total = PARTS.length + 1;
  const [idx, setIdx] = useState(0);

  const badge = useCallback((p: PartDef) => {
    const c = progress.correct[p.id] ?? {};
    const parts: string[] = [];
    if (progress.learned[p.id]) parts.push('학습 완료');
    if (progress.digDone[p.id]) parts.push('발굴 완료');
    if (progress.expeditionFound[p.id]) parts.push('신호 추적 발견');
    if (progress.restored[p.dinosaurId]) parts.push('복원 완료');
    if (c.lv1) parts.push('부위 정답');
    if (c.lv2) parts.push('주인 정답');
    if (progress.storyRead[p.dinosaurId]) parts.push('공룡 이야기 읽음');
    return parts.length ? parts.join(' · ') : '아직 배우는 중';
  }, [progress]);

  const announce = useCallback((i: number, withIntro = false) => {
    if (i === PARTS.length) { speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.'); return; }
    const p = PARTS[i];
    pad.sendHex(p.hex);
    pad.sendText(p.name);
    speak(
      `${withIntro ? '화석 도감. 위아래 화살표로 넘기면 바로 설명을 들어요. ' : ''}` +
      `${p.name}, ${badge(p)}. ${p.feel} 주인은 ${p.dinosaurName}. ${p.dinosaurFact}`,
    );
  }, [pad, badge]);

  useEffect(() => { announce(0, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useKeys(e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const n = (idx + 1) % total; setIdx(n); announce(n);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const n = (idx - 1 + total) % total; setIdx(n); announce(n);
    } else if (e.key === 'Enter') {
      if (idx === PARTS.length) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      replay();
    } else if (e.key === 'F1') {
      onHome(); speak('메뉴로 돌아왔어요.');
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      const done = PARTS.filter(p => progress.correct[p.id]?.lv1 && progress.correct[p.id]?.lv2).length;
      speak(`화석 ${PARTS.length}개 중 ${done}개를 완전히 익혔어요.`);
    } else if (e.key === 'F4') {
      if (idx < PARTS.length) { pad.sendHex(PARTS[idx].hex); speak('촉각 패턴을 다시 보냈어요.'); }
    }
  });

  return (
    <section className="collection-screen" aria-label="화석 도감">
      <p className="eyebrow">화석 도감</p>
      <h2 className="screen-title">내가 만난 화석들</h2>
      <ul className="menu-list" role="listbox" aria-label="화석 목록">
        {PARTS.map((p, i) => (
          <li key={p.id} role="option" aria-selected={i === idx} className={i === idx ? 'is-active' : ''}>
            <span className="menu-label">{p.name}</span>
            <span className="menu-hint">{badge(p)}</span>
          </li>
        ))}
        <li role="option" aria-selected={idx === PARTS.length} className={idx === PARTS.length ? 'is-active' : ''}>
          <span className="menu-label">홈으로 돌아가기</span>
        </li>
      </ul>
      {idx < PARTS.length && SHOW_PREVIEW && <PinPlate hex={PARTS[idx].hex} label={PARTS[idx].name} />}
      <p className="key-help">↑↓ 넘기면 바로 설명 재생 · F3 전체 진행도 · F2 다시 듣기 · F1 홈</p>
    </section>
  );
}
