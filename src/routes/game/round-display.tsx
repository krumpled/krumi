import React from 'react';
import { Option } from '@krumpled/krumi/std';
import { ActiveRound } from '@krumpled/krumi/routes/game/state';
import { RoundSubmission as Submission } from '@krumpled/krumi/routes/game/round-submission';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import moment from 'moment';
import debug from 'debug';

const log = debug('krumi:routes.game.round-display');

type Props = {
  round: Option<ActiveRound>;
  updateSubmission: (value: string) => void;
  submitSubmission: (roundId: string, value: string) => void;
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
            onChange={(evt): void =>
              props.update((evt.target as HTMLInputElement).value)
            }
          />
          <button
            className="btn"
            onClick={(): void => props.submit(submission.value)}
          >
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

function RoundDisplay(props: Props): React.FunctionComponentElement<{}> {
  const { round } = props;

  if (round.kind === 'none') {
    return <div data-role="no-active-round">No Active Round</div>;
  }

  const { round: details, submission } = round.data;
  log('rendering round, submission - %s', submission.kind);

  const prompt = <div>{details.prompt}</div>;

  return (
    <article
      data-role="active-round"
      className="block"
      data-round-id={details.id}
    >
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

export default RoundDisplay;
