import React from 'react';
import { AsyncRequest } from '@krumpled/krumi/std';
import { RoundCursor as ActiveRound, ActiveRound as EntryRound, VotingRound } from '@krumpled/krumi/routes/game/state';
import { RoundSubmission as Submission } from '@krumpled/krumi/routes/game/round-submission';
import Icon from '@krumpled/krumi/components/icon';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { extractServerError } from '@krumpled/krumi/errors';
import * as std from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:routes.game.round-display');

type Props = {
  round: ActiveRound;
  updateSubmission: (value: string) => void;
  submitSubmission: (roundId: string, value: string) => void;
  clearWarning: () => void;
  voteForEntry: (roundId: string, entryId: string) => void;
};

function validEntryLength(value: string): string {
  return value.length && value.length < 255 ? value : '';
}

function SubmissionDisplay(props: {
  submission: Submission;
  update: (value: string) => void;
  submit: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/ban-types
}): React.FunctionComponentElement<{}> {
  const { submission } = props;

  if (submission.kind === 'not-submitted') {
    const { value } = submission;
    const validValue = validEntryLength(value);

    const checkKeypress = (evt: React.KeyboardEvent<HTMLInputElement>): void => {
      if (evt.keyCode === 13) {
        props.submit(value);
      }
    };

    return (
      <section data-role="submission-form" className="flex items-center w-full">
        <input
          type="text"
          className="input-white mr-3 w-full"
          data-invalid={value.length && !validValue.length}
          value={value}
          placeholder="He who laughs last didn’t get the joke."
          onChange={(evt): void => props.update((evt.target as HTMLInputElement).value)}
          onKeyDown={checkKeypress}
        />
        <button className="btn" onClick={(): void => props.submit(value)} disabled={!validValue.length}>
          <Icon icon="paper-plane" />
        </button>
      </section>
    );
  }

  const { submission: request } = submission;

  if (request.kind === 'not-asked' || request.kind === 'loading') {
    return <Loading />;
  } else if (request.kind === 'failed') {
    return <ApplicationError errors={request.errors} />;
  }

  const text = request.data.entry;
  return (
    <section data-role="submission-waiting">
      <article data-role="user-submission" className="flex items-center">
        <h1 className="block mr-3 text-gray-500">Entry:</h1>
        <div className="py-3 w-full px-3 bg-white border border-solid border-gray-300 rounded-sm text-center">
          <span>{text}</span>
        </div>
      </article>
      <div className="text-center mt-5">
        <i className="text-gray-500 italic">Waiting for others...</i>
      </div>
    </section>
  );
}

type EntryRoundDisplayProps = {
  cursor: EntryRound;
} & Omit<Props, 'round'>;

// eslint-disable-next-line @typescript-eslint/ban-types
function EntryRoundDisplay(props: EntryRoundDisplayProps): React.FunctionComponentElement<{}> {
  const { round: details, submission } = props.cursor;

  return (
    <article data-role="active-round" className="block" data-round-id={details.id}>
      <h1 className="block m-auto text-center mb-3 text-gray-500">Your Prompt</h1>
      <section
        data-role="prompt"
        className="py-3 mb-2 text-center bg-white border border-solid rounded border-gray-300"
      >
        <h1>{details.prompt || 'Freeform!'}</h1>
      </section>
      <section className="mt-5 pt-5 border-t border-solid border-gray-400">
        <SubmissionDisplay
          submission={submission}
          update={(value): void => {
            log('updating value: %s', value);
            props.updateSubmission(value);
          }}
          submit={(value): void => {
            log('submitting value: %s', value);
            props.submitSubmission(details.id, value);
          }}
        />
      </section>
    </article>
  );
}

type VotingRoundProps = {
  cursor: VotingRound;
  voteForEntry: (roundId: string, entryId: string) => void;
} & Omit<Props, 'round'>;

function renderOptionRow(
  option: { id: string; value: string },
  activeVote: AsyncRequest<{ id: string }>,
  voteForEntry: (id: string) => void,
  // eslint-disable-next-line @typescript-eslint/ban-types
): React.FunctionComponentElement<{}> {
  const canVote = activeVote.kind === 'failed' || activeVote.kind === 'not-asked';

  return (
    <tr key={option.id} data-option-id={option.id}>
      <td className="w-full">{option.value}</td>
      <td>
        <button className="block btn" disabled={!canVote} onClick={(): void => voteForEntry(option.id)}>
          vote
        </button>
      </td>
    </tr>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function renderVoteErrorFlash(error: Error, clear: () => void): React.FunctionComponentElement<{}> {
  const key = window.btoa(error.name);
  const serverError = extractServerError(error);
  const message = std.unwrapOptionOr(
    std.mapOption(serverError, (error) => error.humanized),
    'Unable to submit vote',
  );

  return (
    <div key={key} className="warn-flash mb-3 flex items-center">
      <span className="block">{message}</span>
      <button className="block ml-auto" onClick={clear}>
        <Icon icon="times" />
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function VotingRoundDisplay(props: VotingRoundProps): React.FunctionComponentElement<{}> {
  const { round, options, vote } = props.cursor;
  const voteForEntry = (entryId: string): void => props.voteForEntry(round.id, entryId);
  const renderedOptions = options.map((option) => renderOptionRow(option, vote, voteForEntry));
  const flashMessages = [];

  if (vote.kind === 'failed') {
    const { errors } = vote;
    flashMessages.push(...errors.map((err) => renderVoteErrorFlash(err, props.clearWarning)));
  }

  return (
    <section data-role="voting-round">
      {flashMessages}
      <header className="block mb-2 pb-2 flex items-center">
        <h1 className="text-gray-500 mr-3">Vote!</h1>
        <section
          data-role="prompt"
          className="py-3 mb-2 text-center bg-white border border-solid w-full rounded border-gray-300"
        >
          <h1>{round.prompt || 'Freeform!'}</h1>
        </section>
      </header>
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-full text-left">Entry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{renderedOptions}</tbody>
      </table>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function RoundDisplay(props: Props): React.FunctionComponentElement<{}> {
  const { round } = props;

  if (round.kind === 'none') {
    return <div data-role="no-active-round">No Active Round</div>;
  }

  const { data: cursor } = round;

  if (cursor.kind === 'active-round') {
    return <EntryRoundDisplay {...props} cursor={cursor} />;
  }

  return <VotingRoundDisplay {...props} cursor={cursor} />;
}

export default RoundDisplay;
