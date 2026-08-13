'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { SERVICES } from './servicesModel';
import { getIntroExitX, SERVICES_MOTION } from './servicesMotion';
import styles from './ServicesPage.module.css';

gsap.registerPlugin(Flip);

export function ServicesPage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const introRef = useRef<HTMLElement | null>(null);
  const introServicesSlotRef = useRef<HTMLDivElement | null>(null);
  const servicesWordRef = useRef<HTMLSpanElement | null>(null);
  const servicesLabelSlotRef = useRef<HTMLDivElement | null>(null);
  const indexStageRef = useRef<HTMLElement | null>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rowButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rowTitleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rowBlocksRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previewRefs = useRef<Array<HTMLElement | null>>([]);
  const previewTitleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const previewGridRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hoverTimelineRefs = useRef<Array<ReturnType<typeof gsap.timeline> | null>>([]);
  const rowInteractionRefs = useRef<Array<{ pointer: boolean; focus: boolean }>>([]);
  const originButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentIndexRef = useRef(-1);
  const animationLockRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const finePointerRef = useRef(false);
  const introTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const handoffTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const handoffFlipRef = useRef<ReturnType<typeof Flip.from> | null>(null);
  const detailTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const introBodyOverflowRef = useRef('');
  const introScrollbarGutterRef = useRef('');
  const introScrollLockedRef = useRef(false);
  const previousBodyOverflowRef = useRef('');

  const setRowsFocusable = (enabled: boolean) => {
    rowButtonRefs.current.forEach((button) => {
      if (button) button.tabIndex = enabled ? 0 : -1;
    });
  };

  const releaseIntroScroll = () => {
    if (!introScrollLockedRef.current) return;
    document.body.style.overflow = introBodyOverflowRef.current;
    document.documentElement.style.scrollbarGutter = introScrollbarGutterRef.current;
    introScrollLockedRef.current = false;
  };

  const revealIndexForInteraction = () => {
    const page = pageRef.current;
    const indexStage = indexStageRef.current;
    if (!page || !indexStage) return;
    page.dataset.indexInteractive = 'true';
    indexStage.removeAttribute('aria-hidden');
    setRowsFocusable(true);
    releaseIntroScroll();
  };

  const showRowPreview = (index: number, source: 'pointer' | 'focus') => {
    if (source === 'pointer' && !finePointerRef.current) return;
    const interaction = rowInteractionRefs.current[index] ?? { pointer: false, focus: false };
    rowInteractionRefs.current[index] = interaction;
    const wasActive = interaction.pointer || interaction.focus;
    interaction[source] = true;
    if (currentIndexRef.current !== -1 || wasActive) return;
    const row = rowRefs.current[index];
    const title = rowTitleRefs.current[index];
    const blocksWrap = rowBlocksRefs.current[index];
    if (!row || !title || !blocksWrap) return;

    row.dataset.rowActive = 'true';

    const blocks = Array.from(blocksWrap.querySelectorAll<HTMLElement>('[data-primary-block]'));
    gsap.killTweensOf([blocks, title]);
    hoverTimelineRefs.current[index]?.kill();

    if (reducedMotionRef.current) {
      title.dataset.switched = 'true';
      gsap.set(title, { yPercent: 0, rotation: 0 });
      gsap.set(blocks, { opacity: 1, scale: 1, xPercent: 0 });
      return;
    }

    const blocksIn = SERVICES_MOTION.hover.blocksIn;
    const { surfaceLead, titleIn, titleOut } = SERVICES_MOTION.hover;

    const timeline = gsap.timeline();
    hoverTimelineRefs.current[index] = timeline;
    timeline
      .to(blocks, {
        duration: blocksIn.duration,
        ease: blocksIn.ease,
        startAt: { scale: blocksIn.scale, xPercent: blocksIn.xPercent },
        scale: 1,
        xPercent: 0,
        opacity: 1,
        stagger: blocksIn.stagger,
      }, surfaceLead)
      .to(title, {
        duration: titleOut.duration,
        ease: titleOut.ease,
        yPercent: -100,
        onComplete: () => { title.dataset.switched = 'true'; },
      }, surfaceLead)
      .to(title, {
        duration: titleIn.duration,
        ease: titleIn.ease,
        startAt: { yPercent: 100, rotation: titleIn.rotation },
        yPercent: 0,
        rotation: 0,
      }, surfaceLead + titleOut.duration);
  };

  const hideRowPreview = (index: number, source: 'pointer' | 'focus') => {
    if (source === 'pointer' && !finePointerRef.current) return;
    const interaction = rowInteractionRefs.current[index] ?? { pointer: false, focus: false };
    rowInteractionRefs.current[index] = interaction;
    interaction[source] = false;
    if (interaction.pointer || interaction.focus || currentIndexRef.current !== -1) return;
    const row = rowRefs.current[index];
    const title = rowTitleRefs.current[index];
    const blocksWrap = rowBlocksRefs.current[index];
    if (!row || !title || !blocksWrap) return;

    delete row.dataset.rowActive;

    const blocks = Array.from(blocksWrap.querySelectorAll<HTMLElement>('[data-primary-block]'));
    gsap.killTweensOf([blocks, title]);
    hoverTimelineRefs.current[index]?.kill();

    if (reducedMotionRef.current) {
      delete title.dataset.switched;
      gsap.set(title, { yPercent: 0, rotation: 0 });
      gsap.set(blocks, { opacity: 0, scale: 1, xPercent: 0 });
      return;
    }

    const { blocksOut, titleIn, titleOut } = SERVICES_MOTION.hover;

    const timeline = gsap.timeline();
    hoverTimelineRefs.current[index] = timeline;
    timeline
      .to(blocks, {
        duration: blocksOut.duration,
        ease: blocksOut.ease,
        opacity: 0,
        scale: blocksOut.scale,
      }, 0)
      .to(title, {
        duration: titleOut.duration,
        ease: titleOut.ease,
        yPercent: -100,
        onComplete: () => { delete title.dataset.switched; },
      }, 0)
      .to(title, {
        duration: titleIn.duration,
        ease: titleIn.ease,
        startAt: { yPercent: 100, rotation: titleIn.rotation },
        yPercent: 0,
        rotation: 0,
      }, titleOut.duration);
  };

  useLayoutEffect(() => {
    const page = pageRef.current;
    const intro = introRef.current;
    const introServicesSlot = introServicesSlotRef.current;
    const servicesWord = servicesWordRef.current;
    const servicesLabelSlot = servicesLabelSlotRef.current;
    const indexStage = indexStageRef.current;
    if (!page || !intro || !introServicesSlot || !servicesWord || !servicesLabelSlot || !indexStage) return;

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    finePointerRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    introBodyOverflowRef.current = document.body.style.overflow;
    introScrollbarGutterRef.current = document.documentElement.style.scrollbarGutter;
    introScrollLockedRef.current = true;
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    setRowsFocusable(false);
    indexStage.setAttribute('aria-hidden', 'true');

    const introLineInners = Array.from(intro.querySelectorAll<HTMLElement>('[data-intro-line-inner]'));
    const leftExit = intro.querySelector<HTMLElement>("[data-intro-exit='left']");
    const rightExit = intro.querySelector<HTMLElement>("[data-intro-exit='right']");
    if (!leftExit || !rightExit) return;
    const rowTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));
    const rowNumbers = Array.from(indexStage.querySelectorAll<HTMLElement>('[data-service-index]'));
    const introMotion = SERVICES_MOTION.intro;
    const leftExitX = getIntroExitX(window.innerWidth, leftExit.getBoundingClientRect().width, 'left');
    const rightExitX = getIntroExitX(window.innerWidth, rightExit.getBoundingClientRect().width, 'right');

    const context = gsap.context(() => {
      gsap.set(introLineInners, { yPercent: 112 });
      gsap.set(rowTitles, { yPercent: 112 });
      gsap.set(rowNumbers, { autoAlpha: 0, y: 10 });

      if (reducedMotionRef.current) {
        servicesLabelSlot.appendChild(servicesWord);
        servicesWord.dataset.docked = 'true';
        page.dataset.indexReady = 'true';
        gsap.set(servicesWord, { yPercent: 0 });
        gsap.set(rowTitles, { yPercent: 0 });
        gsap.set(rowNumbers, { autoAlpha: 1, y: 0 });
        gsap.set(intro, { display: 'none' });
        revealIndexForInteraction();
        return;
      }

      const timeline = gsap.timeline();
      introTimelineRef.current = timeline;
      timeline
        .to(introLineInners, {
          yPercent: 0,
          duration: introMotion.lineDuration,
          ease: 'power4.out',
          stagger: introMotion.lineStagger,
        })
        .to({}, { duration: introMotion.readingHold })
        .addLabel('questionExit')
        .to(leftExit, { x: leftExitX, duration: introMotion.outerExitDuration, ease: 'power4.inOut' }, 'questionExit')
        .to(rightExit, { x: rightExitX, duration: introMotion.outerExitDuration, ease: 'power4.inOut' }, 'questionExit')
        .to({}, { duration: introMotion.servicesBeat })
        .add(() => {
          const flipState = Flip.getState(servicesWord, { simple: true });
          page.dataset.handoffActive = 'true';
          page.dataset.indexReady = 'true';
          servicesLabelSlot.appendChild(servicesWord);
          servicesWord.dataset.docked = 'true';

          const flip = Flip.from(flipState, {
            duration: introMotion.handoffDuration,
            ease: 'power4.inOut',
            absolute: true,
            scale: true,
          });
          handoffFlipRef.current = flip;

          const handoff = gsap.timeline({
            onComplete: () => {
              gsap.set(intro, { display: 'none' });
              revealIndexForInteraction();
              requestAnimationFrame(() => {
                delete page.dataset.handoffActive;
              });
            },
          });
          handoffTimelineRef.current = handoff;
          handoff
            .to(rowTitles, {
              yPercent: 0,
              duration: introMotion.rowRevealDuration,
              ease: 'power4.out',
              stagger: {
                each: introMotion.rowRevealStagger,
                from: 'end',
              },
            }, 0.12)
            .to(rowNumbers, {
              autoAlpha: 1,
              y: 0,
              duration: 0.32,
              ease: 'power3.out',
              stagger: {
                each: introMotion.rowRevealStagger,
                from: 'end',
              },
            }, 0.12)
            .to(intro, {
              autoAlpha: 0,
              duration: 0.22,
              ease: 'power2.out',
            }, 0.74);
        });
    }, page);

    return () => {
      introTimelineRef.current?.kill();
      handoffTimelineRef.current?.kill();
      handoffFlipRef.current?.kill();
      context.revert();
      if (servicesWord.parentElement !== introServicesSlot) introServicesSlot.appendChild(servicesWord);
      delete servicesWord.dataset.docked;
      delete page.dataset.handoffActive;
      releaseIntroScroll();
    };
  }, []);

  const openService = (index: number) => {
    if (animationLockRef.current || currentIndexRef.current !== -1) return;

    const row = rowRefs.current[index];
    const button = rowButtonRefs.current[index];
    const title = rowTitleRefs.current[index];
    const originBlocks = rowBlocksRefs.current[index];
    const preview = previewRefs.current[index];
    const previewTitle = previewTitleRefs.current[index];
    const previewGrid = previewGridRefs.current[index];
    const cover = coverRef.current;
    const closeButton = closeButtonRefs.current[index];
    const indexStage = indexStageRef.current;
    if (!row || !button || !title || !originBlocks || !preview || !previewTitle || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(originBlocks.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const secondaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-secondary-block]'));
    const allNumbers = rowRefs.current
      .map((serviceRow) => serviceRow?.querySelector<HTMLElement>('[data-service-index]') ?? null)
      .filter((value): value is HTMLElement => Boolean(value));
    const allTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));
    if (primaryBlocks.length === 0) return;

    animationLockRef.current = true;
    currentIndexRef.current = index;
    rowInteractionRefs.current[index] = { pointer: false, focus: false };
    originButtonRef.current = button;
    button.setAttribute('aria-expanded', 'true');
    setRowsFocusable(false);

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    row.dataset.rowActive = 'true';
    row.dataset.current = 'true';
    preview.dataset.active = 'true';
    preview.setAttribute('aria-hidden', 'false');
    closeButton.dataset.visible = 'true';
    closeButton.tabIndex = 0;

    const rowRect = row.getBoundingClientRect();
    gsap.set(cover, {
      height: Math.max(1, row.offsetHeight - 1),
      top: rowRect.top,
      opacity: 1,
    });
    gsap.set(secondaryBlocks, { opacity: 0 });
    gsap.set(previewTitle, { yPercent: -100, rotation: 15, transformOrigin: '100% 50%' });
    gsap.set(closeButton, { opacity: 0 });

    if (reducedMotionRef.current) {
      previewGrid.prepend(...primaryBlocks);
      gsap.set([...primaryBlocks, ...secondaryBlocks], { opacity: 1, scale: 1, xPercent: 0, yPercent: 0 });
      gsap.set(allNumbers, { opacity: 0 });
      gsap.set(cover, { height: window.innerHeight, top: 0 });
      gsap.set(previewTitle, { yPercent: 0, rotation: 0 });
      gsap.set(closeButton, { opacity: 1 });
      indexStage.setAttribute('aria-hidden', 'true');
      animationLockRef.current = false;
      closeButton.focus({ preventScroll: true });
      return;
    }

    hoverTimelineRefs.current[index]?.progress(1, false);
    gsap.set(primaryBlocks, { opacity: 1, scale: 1, xPercent: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        delete title.dataset.switched;
        indexStage.setAttribute('aria-hidden', 'true');
        animationLockRef.current = false;
        closeButton.focus({ preventScroll: true });
      },
    });
    detailTimelineRef.current = timeline;

    timeline
      .addLabel('start', 0)
      .to(cover, {
        duration: 0.9,
        ease: 'power4.inOut',
        height: window.innerHeight,
        top: 0,
      }, 'start')
      .to(allTitles, {
        duration: 0.5,
        ease: 'power4.inOut',
        yPercent: (_: number, target: Element) => {
          const targetRow = (target as HTMLElement).closest<HTMLElement>('[data-service-row]');
          return targetRow && targetRow.getBoundingClientRect().top > rowRect.top ? 100 : -100;
        },
        rotation: 0,
      }, 'start')
      .to(allNumbers, {
        duration: 0.25,
        ease: 'power2.out',
        opacity: 0,
      }, 'start')
      .add(() => {
        const flipState = Flip.getState(primaryBlocks, { simple: true });
        previewGrid.prepend(...primaryBlocks);
        Flip.from(flipState, {
          duration: 0.9,
          ease: 'power4.inOut',
          stagger: 0.04,
        })
          .to(secondaryBlocks, {
            duration: 0.9,
            ease: 'power4.inOut',
            startAt: { scale: 0, yPercent: () => gsap.utils.random(0, 200) },
            scale: 1,
            opacity: 1,
            yPercent: 0,
            stagger: 0.04,
          }, 0.04 * primaryBlocks.length);
      }, 'start')
      .to(previewTitle, {
        duration: 1,
        ease: 'power4.inOut',
        yPercent: 0,
        rotation: 0,
      }, 'start')
      .to(closeButton, {
        duration: 1,
        ease: 'power4.inOut',
        opacity: 1,
      }, 'start');
  };

  const closeService = () => {
    const index = currentIndexRef.current;
    if (animationLockRef.current || index < 0) return;

    const row = rowRefs.current[index];
    const button = rowButtonRefs.current[index];
    const originBlocks = rowBlocksRefs.current[index];
    const preview = previewRefs.current[index];
    const previewTitle = previewTitleRefs.current[index];
    const previewGrid = previewGridRefs.current[index];
    const cover = coverRef.current;
    const closeButton = closeButtonRefs.current[index];
    const indexStage = indexStageRef.current;
    if (!row || !button || !originBlocks || !preview || !previewTitle || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const secondaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-secondary-block]'));
    const gridItems = [...primaryBlocks, ...secondaryBlocks];
    const allTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));
    const allNumbers = rowRefs.current
      .map((serviceRow) => serviceRow?.querySelector<HTMLElement>('[data-service-index]') ?? null)
      .filter((value): value is HTMLElement => Boolean(value));
    const rowRect = row.getBoundingClientRect();

    animationLockRef.current = true;

    const finishClose = () => {
      preview.dataset.active = 'false';
      preview.setAttribute('aria-hidden', 'true');
      row.dataset.current = 'false';
      delete row.dataset.rowActive;
      button.setAttribute('aria-expanded', 'false');
      closeButton.dataset.visible = 'false';
      closeButton.tabIndex = -1;
      document.body.style.overflow = previousBodyOverflowRef.current;
      indexStage.removeAttribute('aria-hidden');
      setRowsFocusable(true);
      currentIndexRef.current = -1;
      animationLockRef.current = false;
      originButtonRef.current?.focus({ preventScroll: true });
    };

    if (reducedMotionRef.current) {
      originBlocks.prepend(...primaryBlocks);
      gsap.set(primaryBlocks, { opacity: 0, scale: 1, xPercent: 0, yPercent: 0 });
      gsap.set(secondaryBlocks, { opacity: 0, scale: 1, yPercent: 0 });
      gsap.set(cover, { height: 0, opacity: 0 });
      gsap.set(allTitles, { yPercent: 0 });
      gsap.set(allNumbers, { opacity: 1 });
      finishClose();
      return;
    }

    const timeline = gsap.timeline({
      defaults: { duration: 0.5, ease: 'power4.inOut' },
      onComplete: finishClose,
    });
    detailTimelineRef.current = timeline;

    timeline
      .addLabel('start', 0)
      .to(gridItems, {
        scale: 0,
        opacity: 0,
        stagger: 0.04,
        onComplete: () => { originBlocks.prepend(...primaryBlocks); },
      }, 'start')
      .to(previewTitle, {
        duration: 0.6,
        yPercent: 100,
      }, 'start')
      .to(closeButton, { opacity: 0 }, 'start')
      .to(cover, {
        ease: 'power4',
        height: 0,
        top: rowRect.top + row.offsetHeight / 2,
      }, 'start+=0.4')
      .to(cover, {
        duration: 0.3,
        opacity: 0,
      }, 'start+=0.9')
      .to(allTitles, {
        yPercent: 0,
        stagger: {
          each: 0.03,
          from: index,
        },
      }, 'start+=0.4')
      .to(allNumbers, {
        opacity: 1,
        stagger: {
          each: SERVICES_MOTION.close.titleStagger,
          from: index,
        },
      }, 'start+=0.4')
      .add(() => {
        delete row.dataset.rowActive;
        row.dataset.current = 'false';
      }, 'start+=0.7');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeService();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => () => {
    introTimelineRef.current?.kill();
    handoffTimelineRef.current?.kill();
    handoffFlipRef.current?.kill();
    detailTimelineRef.current?.kill();
    hoverTimelineRefs.current.forEach((timeline) => timeline?.kill());
    rowRefs.current.forEach((row) => {
      if (row) delete row.dataset.rowActive;
    });
    const index = currentIndexRef.current;
    if (index >= 0) {
      const originBlocks = rowBlocksRefs.current[index];
      const previewGrid = previewGridRefs.current[index];
      if (originBlocks && previewGrid) {
        const primaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
        originBlocks.prepend(...primaryBlocks);
      }
    }
    if (currentIndexRef.current >= 0) document.body.style.overflow = previousBodyOverflowRef.current;
  }, []);

  return (
    <main ref={pageRef} className={styles.page} data-index-ready="false" data-index-interactive="false">
      <h1 className="sr-only">SO, WHAT SERVICES DO WE PROVIDE?</h1>

      <section ref={introRef} className={styles.intro} aria-hidden="true">
        <div className={styles.introCopy}>
          <div className={styles.introLine}>
            <span className={styles.introLineInner} data-intro-line-inner data-intro-exit="left">SO, WHAT</span>
          </div>
          <div ref={introServicesSlotRef} className={`${styles.introLine} ${styles.introServicesLine}`}>
            <span ref={servicesWordRef} className={styles.servicesWord} data-intro-line-inner>SERVICES</span>
          </div>
          <div className={styles.introLine}>
            <span className={styles.introLineInner} data-intro-line-inner data-intro-exit="right">DO WE PROVIDE?</span>
          </div>
        </div>
      </section>

      <section ref={indexStageRef} className={styles.indexStage} aria-label="Services" aria-hidden="true">
        <header className={styles.indexHeader}>
          <div ref={servicesLabelSlotRef} className={styles.servicesLabelSlot} aria-hidden="true" />
        </header>

        <div className={styles.content}>
          <div ref={coverRef} className={styles.cover} aria-hidden="true" />
          {SERVICES.map((service, index) => (
            <div
              key={service.id}
              ref={(element: HTMLDivElement | null) => { rowRefs.current[index] = element; }}
              className={styles.row}
              data-current="false"
              data-long-title={service.title.length > 26 ? 'true' : undefined}
              data-service-row
              onMouseEnter={() => showRowPreview(index, 'pointer')}
              onMouseLeave={() => hideRowPreview(index, 'pointer')}
            >
              <svg
                className={styles.rowInversionSurface}
                viewBox="0 0 120 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M 12 -5 C -4 28 22 45 8 64 C 0 80 16 91 10 105 L 125 105 L 125 -5 Z" />
              </svg>

              <button
                ref={(element: HTMLButtonElement | null) => { rowButtonRefs.current[index] = element; }}
                type="button"
                className={styles.rowButton}
                aria-label={`Open ${service.title}`}
                aria-expanded="false"
                aria-controls={`service-preview-${service.id}`}
                tabIndex={-1}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) showRowPreview(index, 'focus');
                }}
                onBlur={() => hideRowPreview(index, 'focus')}
                onClick={() => openService(index)}
              />

              <div className={`${styles.cell} ${styles.cellText} ${styles.rowIdentity}`}>
                <span className={styles.rowNumber} data-service-index aria-hidden="true">
                  {service.index}
                </span>
                <h2 className={styles.titleClip}>
                  <span
                    ref={(element: HTMLSpanElement | null) => { rowTitleRefs.current[index] = element; }}
                    className={styles.rowTitle}
                  >
                    {service.title}
                  </span>
                </h2>
              </div>

              <div
                ref={(element: HTMLDivElement | null) => { rowBlocksRefs.current[index] = element; }}
                className={`${styles.cell} ${styles.cellBlocks}`}
                aria-hidden="true"
                data-service-blocks
              >
                {service.primary.map((item, blockIndex) => (
                  <div
                    key={item}
                    className={`${styles.tile} ${styles.rowTile}`}
                    data-grid-index={blockIndex}
                    data-primary-block
                  >
                    <div className={styles.tileInner}>
                      <span className={styles.tileOrdinal}>{service.index}.{String(blockIndex + 1).padStart(2, '0')}</span>
                      <span className={styles.tileLabel}>{item}</span>
                      <span className={styles.tileSignal} aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.futureRunway} aria-hidden="true" />
      </section>

      <section className={styles.previewLayer} aria-label="Service details">
        {SERVICES.map((service, index) => (
          <article
            key={service.id}
            ref={(element: HTMLElement | null) => { previewRefs.current[index] = element; }}
            id={`service-preview-${service.id}`}
            className={styles.preview}
            role="dialog"
            aria-modal="true"
            aria-hidden="true"
            aria-labelledby={`service-preview-title-${service.id}`}
            data-active="false"
            data-service-preview
          >
            <button
              ref={(element: HTMLButtonElement | null) => { closeButtonRefs.current[index] = element; }}
              type="button"
              className={styles.closeButton}
              data-visible="false"
              tabIndex={-1}
              onClick={closeService}
              aria-label="Close service details"
            >
              ×
            </button>

            <h2 className={styles.previewTitleClip}>
              <span
                ref={(element: HTMLSpanElement | null) => { previewTitleRefs.current[index] = element; }}
                id={`service-preview-title-${service.id}`}
                className={styles.previewTitle}
                data-preview-title
              >
                {service.title}
              </span>
            </h2>

            <div
              ref={(element: HTMLDivElement | null) => { previewGridRefs.current[index] = element; }}
              className={styles.previewGrid}
              data-service-grid
            >
              {service.secondary.map((item, blockIndex) => (
                <div
                  key={item}
                  className={`${styles.tile} ${styles.previewTile}`}
                  data-grid-index={service.primary.length + blockIndex}
                  data-secondary-block
                >
                  <div className={styles.tileInner}>
                    <span className={styles.tileOrdinal}>
                      {service.index}.{String(service.primary.length + blockIndex + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.tileLabel}>{item}</span>
                    <span className={styles.tileSignal} aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
