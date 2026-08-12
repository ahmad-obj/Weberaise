'use client';

import { Fragment, useLayoutEffect, useRef } from 'react';
import { createQuestionTimeline } from './questionMotion';
import styles from './PostExploreNarrative.module.css';

function VisualQuestion({ text }: { text: string }) {
  const words = text.split(' ');

  return (
    <span className={styles.questionVisual} data-question-visual aria-hidden="true">
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className={styles.questionWord}>
            {Array.from(word).map((character, characterIndex) => (
              <span
                className={styles.questionChar}
                data-question-char
                key={`${character}-${wordIndex}-${characterIndex}`}
              >
                {character}
              </span>
            ))}
          </span>
          {wordIndex < words.length - 1 ? (
            <span className={styles.questionGap} aria-hidden="true">
              {'\u00A0'}
            </span>
          ) : null}
        </Fragment>
      ))}
    </span>
  );
}

export function QuestionSequence({ questions }: { questions: readonly string[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanupTimeline = createQuestionTimeline(root, motionQuery.matches);

    const handleMotionPreference = () => {
      cleanupTimeline();
      cleanupTimeline = createQuestionTimeline(root, motionQuery.matches);
    };

    motionQuery.addEventListener('change', handleMotionPreference);

    return () => {
      motionQuery.removeEventListener('change', handleMotionPreference);
      cleanupTimeline();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={styles.questionScroll}
      data-question-sequence
      aria-label="What brings you to Weberaise"
    >
      <div className={styles.questionStage}>
        {questions.map((question, index) => (
          <h2
            className={styles.question}
            data-question-index={index}
            key={question}
          >
            <span className="sr-only">{question}</span>
            <VisualQuestion text={question} />
          </h2>
        ))}
      </div>
    </section>
  );
}
