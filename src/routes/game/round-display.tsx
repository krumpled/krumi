import React from 'react';
import { AsyncRequest } from '@krumpled/krumi/std';
import { RoundCursor as ActiveRound, ActiveRound as EntryRound, VotingRound } from '@krumpled/krumi/routes/game/state';
import { RoundSubmission as Submission } from '@krumpled/krumi/routes/game/round-submission';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import moment from 'moment';
import debug from 'debug';

const log = debug('krumi:routes.game.round-display');

type Props = {
  round: ActiveRound;
  updateSubmission: (value: string) => void;
  submitSubmission: (roundId: string, value: string) => void;
  voteForEntry: (roundId: string, entryId: string) => void;
};

function SubmissionDisplay(props: {
  submission: Submission;
  update: (value: string) => void;
  submit: (value: string) => void;
}): React.FunctionComponentElement<{}> {
  const { submission } = props;

  switch (submission.kind) {
    case 'not-submitted':
      return (
        <div data-role="submission-form" className="flex items-center">
          <input
            type="text"
            className="input-white mr-3"
            value={submission.value}
            onChange={(evt): void => props.update((evt.target as HTMLInputElement).value)}
          />
          <button className="btn" onClick={(): void => props.submit(submission.value)}>
            Submit
          </button>
        </div>
      );
    case 'submitted': {
      const { submission: request } = submission;
      switch (request.kind) {
        case 'not-asked':
        case 'loading':
          return <Loading />;
        case 'failed':
          return <ApplicationError errors={request.errors} />;
        case 'loaded': {
          const text = request.data.entry;
          return (
            <div>
              your response: <span>{text}</span>
            </div>
          );
        }
      }
    }
  }
}

type EntryRoundDisplayProps = {
  cursor: EntryRound;
} & Omit<Props, 'round'>;

function EntryRoundDisplay(props: EntryRoundDisplayProps): React.FunctionComponentElement<{}> {
  const { round: details, submission } = props.cursor;
  const prompt = <div>{details.prompt}</div>;

  return (
    <article data-role="active-round" className="block" data-round-id={details.id}>
      <header className="block mb-2 pb-2">
        <h2 className="block">
          <span>
            Round #<span>{details.position + 1}</span>
          </span>
          <span> (started {moment(details.started).fromNow()})</span>
        </h2>
      </header>
      <section data-role="prompt" className="pb-2 mb-2">
        {prompt}
      </section>
      <section data-role="submission">
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
): React.FunctionComponentElement<{}> {
  return (
    <tr key={option.id} data-option-id={option.id}>
      <td>{option.value}</td>
      <td>
        <button
          className="block btn"
          disabled={activeVote.kind !== 'not-asked'}
          onClick={(): void => voteForEntry(option.id)}
        >
          vote
        </button>
      </td>
    </tr>
  );
}

function VotingRoundDisplay(props: VotingRoundProps): React.FunctionComponentElement<{}> {
  const { round, options, vote } = props.cursor;
  const voteForEntry = (entryId: string): void => props.voteForEntry(round.id, entryId);
  const renderedOptions = options.map((option) => renderOptionRow(option, vote, voteForEntry));

  return (
    <section data-role="voting-round">
      <header className="block mb-2 pb-2">
        Voting for round <span>{round.position + 1}</span>
      </header>
      <table>
        <thead>
          <tr>
            <th>Entry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{renderedOptions}</tbody>
      </table>
    </section>
  );
}

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
