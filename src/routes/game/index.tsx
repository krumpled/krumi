import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import {
  mapOption,
  Result,
  loaded,
  failed,
  loading,
} from '@krumpled/krumi/std';
import { fetch } from '@krumpled/krumi/krumnet';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Loading from '@krumpled/krumi/components/application-loading';
import debug from 'debug';
import {
  init,
  checkActive,
  changedActiveRound,
  findActiveRound,
  GameState,
  GameDetailRound,
  GameDetailResponse,
} from '@krumpled/krumi/routes/game/state';
import { empty } from '@krumpled/krumi/routes/game/round-submission';

const log = debug('krumi:route.game');

async function fetchGame(gameId: string): Promise<Result<GameDetailResponse>> {
  const params = { ids: [gameId] };
  return (await fetch(`/games`, params)) as Result<GameDetailResponse>;
}

async function load(lobbyId: string, gameId: string): Promise<GameState> {
  const lobby = { id: lobbyId };

  const res = await fetchGame(gameId);

  if (res.kind === 'err') {
    const [e] = res.errors;
    return Promise.reject(e);
  }

  const { data: details } = res;

  log('loaded game "%s"', details.created);

  const activeRound = mapOption(findActiveRound(details.rounds), (round) => ({
    round,
    submission: empty(),
  }));
  return { lobby, game: details, activeRound };
}

function roundIcon({
  completed,
  started,
}: GameDetailRound): React.FunctionComponentElement<{}> {
  if (completed) {
    return <Icon icon="circle" />;
  }

  if (started && started < new Date().getTime()) {
    return <Icon icon="dot-circle" />;
  }

  return <Icon icon="plus" className="opacity-0" />;
}

function renderRoundSummary(
  round: GameDetailRound,
): React.FunctionComponentElement<{}> {
  const icon = roundIcon(round);

  return (
    <li data-round-id={round.id} key={round.id} className="py-2 flex">
      <span className="block pr-2 mr-2">{icon}</span>
      <span className="block">
        Round <span>{round.position + 1}</span>
      </span>
    </li>
  );
}

function Game(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const { gameState: details } = state;

    switch (details.kind) {
      case 'loaded': {
        log('finished loading game, starting interval');

        const interval = setInterval(() => {
          const next = checkActive(state);

          if (changedActiveRound(state, next)) {
            log('active round changed, updating');
            return update(next);
          }

          log('game update interval, nothing changed');
        }, 1000);

        return (): void => clearInterval(interval);
      }
      case 'not-asked': {
        log('fetching details');
        const promise = load(state.lobbyId, state.gameId);
        const gameState = loading(promise);

        promise
          .then((details) => update({ ...state, gameState: loaded(details) }))
          .catch((e) => update({ ...state, gameState: failed([e]) }));

        return update({ ...state, gameState });
      }
    }
  });

  switch (state.gameState.kind) {
    case 'not-asked':
    case 'loading':
      log('loading game %s', state.gameId);
      return (
        <section className="y-content y-gutters x-gutters">
          <Loading />
        </section>
      );
    case 'failed':
      return <ApplicationError errors={state.gameState.errors} />;
    case 'loaded': {
      const { lobby, game } = state.gameState.data;

      log('game "%s" loaded', game.id);
      const roundSummaries = game.rounds.map(renderRoundSummary);

      return (
        <section className="y-content y-gutters x-gutters flex">
          <aside className="pr-5">
            <header className="pb-2 mb-2 border-b border-black border-solid">
              <Link to={`/lobbies/${lobby.id}`} className="block">
                Back to Lobby
              </Link>
            </header>
            <h2 className="pb-2 block">Rounds</h2>
            <ul className="block">{roundSummaries}</ul>
          </aside>
          <main data-role="main-game-contents" className="pl-3 block"></main>
        </section>
      );
    }
  }
}

export default AuthenticatedRoute(Game);
