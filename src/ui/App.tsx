import { useEffect, useLayoutEffect, useState } from 'react';
import * as G from '../game/state.ts';
import { saveCareer, loadCareer, savedSummary, clearCareer } from '../game/save.ts';
import type { SaveSummary } from '../game/save.ts';
import { TitleScreen } from './screens/Title.tsx';
import { IntroCinematic } from './screens/Intro.tsx';
import { Gate, hasEntry } from './screens/Gate.tsx';
import { Tutorial } from './components/Tutorial.tsx';
import { OnboardManager, OnboardClub } from './screens/Onboard.tsx';
import { ArchetypeScreen } from './screens/Archetype.tsx';
import { SquadScreen } from './screens/Squad.tsx';
import { SigningScreen } from './screens/Signing.tsx';
import { PreSeasonMarket } from './screens/PreSeason.tsx';
import { TransfersScreen } from './screens/Transfers.tsx';
import { Hub } from './screens/Hub.tsx';
import { DilemmaChat } from './screens/Dilemma.tsx';
import { TacticScreen } from './screens/Tactic.tsx';
import { VsScreen } from './screens/Vs.tsx';
import { MatchBroadcast } from './screens/Match.tsx';
import { ResultScreen } from './screens/Result.tsx';
import { PressScreen } from './screens/Press.tsx';
import { SeasonEnd, PreSeasonScreen } from './screens/SeasonEnd.tsx';
import { SackedScreen } from './screens/Sacked.tsx';
import { SponsorScreen } from './screens/Sponsor.tsx';
import { YouthScreen } from './screens/Youth.tsx';
import { UltimatumScreen } from './screens/Ultimatum.tsx';
import { RescueScreen } from './screens/Rescue.tsx';
import { ChronicleScreen } from './screens/Chronicle.tsx';
import { InboxScreen } from './screens/Inbox.tsx';
import { ChatScreen } from './screens/Chat.tsx';
import { StandingsScreen } from './screens/Standings.tsx';
import { CaptainScreen } from './screens/Captain.tsx';
import { AssistantScreen } from './screens/Assistant.tsx';
import { StadiumScreen } from './screens/Stadium.tsx';
import { PacksScreen } from './screens/Packs.tsx';
import { CoachScreen } from './screens/Coach.tsx';

export function App() {
  const [entered, setEntered] = useState(() => hasEntry());  // soft code gate for closed testing
  const [introDone, setIntroDone] = useState(false);      // the cold open plays first, every launch
  const [booted, setBooted] = useState(false);            // still on the title screen
  const [gs, setGs] = useState<G.GameState>(() => G.newGame());
  const [squadFromHub, setSquadFromHub] = useState(false);
  const [saved, setSaved] = useState<SaveSummary | null>(() => savedSummary());
  const [tutorial, setTutorial] = useState(false);
  const [fromPreseason, setFromPreseason] = useState(false);   // market opened from the summer board

  // persist the career whenever it changes, so closing the tab is not a loss
  useEffect(() => { if (booted) saveCareer(gs); }, [gs, booted]);

  // Every screen change starts at the top. Without this the next page opens at
  // the previous page's scroll position, which makes the game look frozen.
  const screenKey = !entered ? 'gate' : !introDone ? 'intro' : !booted ? 'title' : gs.phase;
  useLayoutEffect(() => {
    const targets = [document.scrollingElement, document.documentElement, document.body,
      document.getElementById('root'), document.querySelector('.frame')];
    for (const el of targets) if (el) (el as HTMLElement).scrollTop = 0;
    window.scrollTo(0, 0);
  }, [screenKey]);

  function startNew() {
    clearCareer();
    setSaved(null);
    setGs(G.newGame(Math.floor(Math.random() * 100000) + 1));
    setBooted(true);
  }

  function continueCareer() {
    const loaded = loadCareer();
    if (loaded) setGs(loaded);
    setBooted(true);
  }

  if (!entered) {
    return (
      <div className="frame">
        <Gate onUnlock={() => setEntered(true)} />
      </div>
    );
  }

  if (!introDone) {
    return (
      <div className="frame">
        <IntroCinematic onDone={() => setIntroDone(true)} />
      </div>
    );
  }

  if (!booted) {
    return (
      <div className="frame">
        <TitleScreen saved={saved} onNew={startNew} onContinue={continueCareer} />
      </div>
    );
  }

  return (
    <div className="frame">
      {gs.phase === 'onboard-archetype' && (
        <ArchetypeScreen gs={gs} onPick={id => setGs(G.setArchetype(gs, id))} />
      )}
      {gs.phase === 'onboard-manager' && (
        <OnboardManager gs={gs} onDone={p => setGs(G.setProfile(gs, p))} />
      )}
      {gs.phase === 'onboard-club' && (
        <OnboardClub gs={gs} onPick={(city, kit, pattern) => setGs(G.pickCity(gs, city, kit, pattern))} />
      )}
      {gs.phase === 'signing' && (
        <SigningScreen gs={gs} onDone={effect => setGs(G.afterSigning(gs, effect))} />
      )}
      {gs.phase === 'squad' && (
        <SquadScreen gs={gs} firstTime={!squadFromHub}
          onSwap={(a, b) => setGs(g => G.swapPlayers(g, a, b))}
          onDone={() => {
            if (squadFromHub) { setGs(G.backToHub(gs)); setSquadFromHub(false); }
            else setGs(G.enterPreseason(gs));
          }} />
      )}
      {gs.phase === 'preseason-market' && (
        <PreSeasonMarket gs={gs} firstCareer={gs.season === 1}
          onOpenMarket={line => { setFromPreseason(true); setGs(G.openTransfers(gs, line ?? null)); }}
          onResolveDeparture={(kind, oi) => setGs(g => G.resolveDeparture(g, kind, oi))}
          onRenew={id => setGs(g => G.renewContract(g, id))}
          onRelease={id => setGs(g => G.releasePlayer(g, id))}
          onDismissOutcome={() => setGs(G.clearPreseasonOutcome(gs))}
          onTakeCourse={() => setGs(g => G.takeCourse(g))}
          onAdvance={() => {
            const next = G.advancePreseason(gs);
            if (next.phase === 'hub' && gs.season === 1) setTutorial(true);
            setGs(next);
          }} />
      )}
      {gs.phase === 'transfers' && (
        <TransfersScreen gs={gs}
          onSign={id => setGs(g => G.signPlayer(g, id))}
          onSell={id => setGs(g => G.sellPlayer(g, id))}
          onBack={() => {
            if (fromPreseason) { setFromPreseason(false); setGs(G.backToPreseason(gs)); }
            else setGs(G.backToHub(gs));
          }} />
      )}
      {gs.phase === 'hub' && (
        <Hub gs={gs}
          onStart={() => setGs(G.startWeek(gs))}
          onSquad={() => { setSquadFromHub(true); setGs(G.openSquad(gs)); }}
          onTransfers={() => setGs(G.openTransfers(gs))}
          onChronicle={() => setGs(G.openChronicle(gs))}
          onCaptain={() => setGs(G.openCaptain(gs))}
          onAssistant={() => setGs(G.openAssistant(gs))}
          onInbox={() => setGs(G.openInbox(gs))}
          onStadium={() => setGs(G.openStadium(gs))}
          onPacks={() => setGs(G.openPacks(gs))}
          onCoach={() => setGs(G.openCoach(gs))}
          onYouth={() => setGs(G.openYouth(gs))}
          onTable={() => setGs(G.openTable(gs))} />
      )}
      {gs.phase === 'youth' && (
        <YouthScreen gs={gs}
          onPromote={id => setGs(g => G.promoteYouth(g, id))}
          onRelease={id => setGs(g => G.releaseYouth(g, id))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'stadium' && (
        <StadiumScreen gs={gs}
          onBuild={key => setGs(g => G.startStadiumProject(g, key))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'coach' && (
        <CoachScreen gs={gs} onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'packs' && (
        <PacksScreen gs={gs}
          onWatchAd={() => setGs(G.watchAdForGem(gs))}
          onBuy={id => setGs(g => G.buyPack(g, id))}
          onSign={() => setGs(g => G.signPull(g))}
          onSell={() => setGs(g => G.sellPull(g))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'inbox' && (
        <InboxScreen gs={gs}
          onAnswer={(item, opt) => setGs(g => G.answerInbox(g, item, opt))}
          onDismissOutcome={() => setGs(G.clearInboxOutcome(gs))}
          onBack={() => setGs(G.closeInbox(gs))} />
      )}
      {gs.phase === 'chronicle' && (
        <ChronicleScreen gs={gs} onBack={() => setGs(G.closeChronicle(gs))} />
      )}
      {gs.phase === 'captain' && (
        <CaptainScreen gs={gs} onSet={id => setGs(G.setCaptain(gs, id))} onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'assistant' && (
        <AssistantScreen gs={gs}
          onHire={() => setGs(G.hireAssistant(gs))}
          onFire={() => setGs(G.fireAssistant(gs))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'dilemma' && (
        <DilemmaChat gs={gs}
          onChoose={i => setGs(G.chooseDilemma(gs, i))}
          onContinue={() => setGs(G.toTactic(gs))} />
      )}
      {gs.phase === 'tactic' && (
        <TacticScreen gs={gs}
          onSet={t => setGs(G.setTactic(gs, t))}
          onGo={() => setGs({ ...gs, phase: 'vs' })} />
      )}
      {gs.phase === 'vs' && (
        <VsScreen gs={gs} onGo={() => setGs({ ...gs, phase: 'match' })} />
      )}
      {gs.phase === 'match' && (
        <MatchBroadcast gs={gs} onDone={result => setGs(G.commitRound(gs, result))} />
      )}
      {gs.phase === 'result' && <ResultScreen gs={gs} onContinue={() => setGs(G.continueFromResult(gs))} />}
      {gs.phase === 'press' && <PressScreen gs={gs} onAnswer={i => setGs(G.answerPress(gs, i))} />}
      {gs.phase === 'chat' && <ChatScreen gs={gs} onDone={() => setGs(G.closeChat(gs))} />}
      {gs.phase === 'table' && <StandingsScreen gs={gs} onBack={() => setGs(G.closeTable(gs))} />}
      {gs.phase === 'season-end' && <SeasonEnd gs={gs} onContinue={() => setGs(G.startNextSeason(gs))} />}
      {gs.phase === 'ultimatum' && <UltimatumScreen gs={gs} onGo={() => setGs(G.advancePastPress(gs))} />}
      {gs.phase === 'sacked' && <SackedScreen gs={gs} onNext={() => setGs({ ...gs, phase: 'rescue' })} />}
      {gs.phase === 'rescue' && <RescueScreen gs={gs} onTake={() => setGs(G.takeRescue(gs))} onWalkAway={startNew} />}
      {gs.phase === 'sponsor' && <SponsorScreen gs={gs} onPick={id => setGs(G.takeSponsor(gs, id))} />}
      {gs.phase === 'preseason' && <PreSeasonScreen gs={gs} onStart={() => setGs(G.enterPreseason(gs))} />}

      {tutorial && <Tutorial onDone={() => setTutorial(false)} />}
    </div>
  );
}

