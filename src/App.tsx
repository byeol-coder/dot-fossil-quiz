import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PARTS, DINOSAUR_POOL, shuffle } from './data/parts';
import type { PartDef } from './data/parts';
import { useDotPad } from './dotpad/useDotPad';
import { PinPlate } from './components/PinPlate';
import { speak, replay } from './tts';
import { IS_EMBED, SHOW_PREVIEW, postExit } from './embed';

type Screen = 'home' | 'learn' | 'quiz1' | 'quiz2' | 'collection';

// ── 진행도 저장 ──────────────────────────────────────────────────────────────
interface Progress {
  learned: Record<string, boolean>;                       // 학습 모드에서 상세까지 들은 부위
  correct: Record<string, { lv1?: boolean; lv2?: boolean }>; // 퀴즈 정답 경험
  best: { lv1: number; lv2: number };                     // 최고 점수 (5점 만점)
}
const STORAGE_KEY = 'dot-fossil-quiz.progress.v1';

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { learned: {}, correct: {}, best: { lv1: 0, lv2: 0 }, ...JSON.parse(raw) };
  } catch { /* 손상 시 초기화 */ }
  return { learned: {}, correct: {}, best: { lv1: 0, lv2: 0 } };
}
function saveProgress(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* 저장 실패 무시 */ }
}

// 화면별 키 핸들러 — 최신 핸들러를 ref로 유지해 stale closure 방지
function useKeys(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'F1', 'F2', 'F3', 'F4'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
}

const KEY_HELP =
  '조작 안내. 화살표로 이동, 엔터로 선택. 에프2 다시 듣기, 에프3 진행도, 에프4 촉각 패턴 다시 출력, 에프1 홈으로. ' +
  '닷패드에서는 기능키 1과 2로 위아래, 패닝키로 좌우, 기능키 3으로 선택, 기능키 4로 표시, 전체 패닝키로 음성을 다시 들어요.';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const pad = useDotPad();

  const updateProgress = useCallback((fn: (p: Progress) => Progress) => {
    setProgress(prev => {
      const next = fn(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  const goHome = useCallback(() => setScreen('home'), []);

  return (
    <div className={`app ${IS_EMBED ? 'app--embed' : ''}`}>
      {!IS_EMBED && (
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">⠙⠋</span>
            <h1>Dot Fossil Lab</h1>
            <span className="brand-sub">공룡 화석 부위 맞추기</span>
          </div>
          <PadStatus pad={pad} />
        </header>
      )}
      {IS_EMBED && (
        <div className="embed-strip">
          <PadStatus pad={pad} />
        </div>
      )}

      <main className="stage">
        {screen === 'home' && (
          <HomeScreen pad={pad} progress={progress} onNavigate={setScreen} />
        )}
        {screen === 'learn' && (
          <LearnScreen pad={pad} onHome={goHome} updateProgress={updateProgress} />
        )}
        {(screen === 'quiz1' || screen === 'quiz2') && (
          <QuizScreen
            key={screen}
            level={screen === 'quiz1' ? 1 : 2}
            pad={pad}
            onHome={goHome}
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

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    speak(
      '닷 포실 랩, 공룡 화석 부위 맞추기에 온 걸 환영해요. ' +
      '위아래 화살표로 메뉴를 고르고 엔터로 시작하세요. 처음이라면 화석 탐색 학습부터 해 보세요.',
    );
    pad.sendText('닷 포실 랩');
  }, [pad]);

  useKeys(e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const n = (idx + 1) % items.length;
      setIdx(n);
      speak(`${items[n].label}. ${items[n].hint}`);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const n = (idx - 1 + items.length) % items.length;
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
      <p className="eyebrow">발굴 캠프</p>
      <h2 className="screen-title">오늘은 무엇을 배워 볼까요?</h2>
      <ul className="menu-list" role="listbox" aria-label="메뉴">
        {items.map((it, i) => (
          <li
            key={it.id}
            role="option"
            aria-selected={i === idx}
            className={i === idx ? 'is-active' : ''}
            onClick={() => { setIdx(i); it.run(); }}
          >
            <span className="menu-label">{it.label}</span>
            <span className="menu-hint">{it.hint}</span>
          </li>
        ))}
      </ul>
      <p className="key-help">↑↓ 이동 · Enter 선택 · F1 도움말 · F2 다시 듣기</p>
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
      `${withIntro ? '화석 탐색 학습. 좌우 화살표로 화석을 바꿔요. ' : ''}` +
      `${i + 1}번 화석, ${p.name}. 닷패드를 천천히 만져 보세요. 엔터를 누르면 자세한 설명을 들어요.`,
    );
  }, [pad]);

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
      const p = PARTS[idx];
      speak(`${p.name}. ${p.feel} 이 화석의 주인은 ${p.dinosaurName}. ${p.dinosaurFact}`);
      updateProgress(prev => ({ ...prev, learned: { ...prev.learned, [p.id]: true } }));
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
      <p className="key-help">←→ 화석 바꾸기 · Enter 자세히 듣기 · F4 패턴 다시 출력 · F1 홈</p>
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
    if (c.lv1) parts.push('부위 정답');
    if (c.lv2) parts.push('주인 정답');
    return parts.length ? parts.join(' · ') : '아직 배우는 중';
  }, [progress]);

  const announce = useCallback((i: number, withIntro = false) => {
    if (i === PARTS.length) { speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.'); return; }
    const p = PARTS[i];
    pad.sendHex(p.hex);
    pad.sendText(p.name);
    speak(`${withIntro ? '화석 도감. 위아래 화살표로 넘겨 보세요. ' : ''}${p.name}, ${badge(p)}. 엔터를 누르면 설명을 들어요.`);
  }, [pad, badge]);

  useEffect(() => { announce(0, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useKeys(e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const n = (idx + 1) % total; setIdx(n); announce(n);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const n = (idx - 1 + total) % total; setIdx(n); announce(n);
    } else if (e.key === 'Enter') {
      if (idx === PARTS.length) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      const p = PARTS[idx];
      speak(`${p.name}. ${p.feel} 주인은 ${p.dinosaurName}. ${p.dinosaurFact}`);
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
      <p className="key-help">↑↓ 넘기기 · Enter 설명 듣기 · F3 전체 진행도 · F1 홈</p>
    </section>
  );
}
