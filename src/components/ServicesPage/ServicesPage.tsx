'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { SERVICES } from './servicesModel';
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rowButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rowTitleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rowBlocksRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previewRefs = useRef<Array<HTMLElement | null>>([]);
  const previewTitleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const previewGridRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hoverTimelineRefs = useRef<Array<ReturnType<typeof gsap.timeline> | null>>([]);
  const originButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentIndexRef = useRef(-1);
  const animationLockRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const introTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const detailTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const previousBodyOverflowRef = useRef('');

  const setRowsFocusable = (enabled: boolean) => {
    rowButtonRefs.current.forEach((button) => {
      if (button) button.tabIndex = enabled ? 0 : -1;
    });
  };

  const revealIndexForInteraction = () => {
    const page = pageRef.current;
    const indexStage = indexStageRef.current;
    if (!page || !indexStage) return;
    page.dataset.indexInteractive = 'true';
    indexStage.removeAttribute('aria-hidden');
    setRowsFocusable(true);
  };

  const showRowPreview = (index: number) => {
    if (currentIndexRef.current !== -1 || reducedMotionRef.current) return;
    const title = rowTitleRefs.current[index];
    const blocksWrap = rowBlocksRefs.current[index];
    if (!title || !blocksWrap) return;

    const blocks = Array.from(blocksWrap.querySelectorAll<HTMLElement>('[data-primary-block]'));
    gsap.killTweensOf([blocks, title]);
    hoverTimelineRefs.current[index]?.kill();

    const timeline = gsap.timeline();
    hoverTimelineRefs.current[index] = timeline;
    timeline
      .to(blocks, {
        duration: 0.4,
        ease: 'power3',
        startAt: { scale: 0.8, xPercent: 20 },
        scale: 1,
        xPercent: 0,
        opacity: 1,
        stagger: -0.035,
      }, 0)
      .to(title, {
        duration: 0.1,
        ease: 'power1.in',
        yPercent: -100,
        onComplete: () => { title.dataset.switched = 'true'; },
      }, 0)
      .to(title, {
        duration: 0.5,
        ease: 'expo',
        startAt: { yPercent: 100, rotation: 15 },
        yPercent: 0,
        rotation: 0,
      }, 0.1);
  };

  const hideRowPreview = (index: number) => {
    if (currentIndexRef.current !== -1 || reducedMotionRef.current) return;
    const title = rowTitleRefs.current[index];
    const blocksWrap = rowBlocksRefs.current[index];
    if (!title || !blocksWrap) return;

    const blocks = Array.from(blocksWrap.querySelectorAll<HTMLElement>('[data-primary-block]'));
    gsap.killTweensOf([blocks, title]);
    hoverTimelineRefs.current[index]?.kill();

    const timeline = gsap.timeline();
    hoverTimelineRefs.current[index] = timeline;
    timeline
      .to(blocks, {
        duration: 0.4,
        ease: 'power4',
        opacity: 0,
        scale: 0.8,
      }, 0)
      .to(title, {
        duration: 0.1,
        ease: 'power1.in',
        yPercent: -100,
        onComplete: () => { delete title.dataset.switched; },
      }, 0)
      .to(title, {
        duration: 0.5,
        ease: 'expo',
        startAt: { yPercent: 100, rotation: 15 },
        yPercent: 0,
        rotation: 0,
      }, 0.1);
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
    setRowsFocusable(false);
    indexStage.setAttribute('aria-hidden', 'true');

    const introLineInners = Array.from(intro.querySelectorAll<HTMLElement>('[data-intro-line-inner]'));
    const leftExit = intro.querySelector<HTMLElement>("[data-intro-exit='left']");
    const rightExit = intro.querySelector<HTMLElement>("[data-intro-exit='right']");
    const rowTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));

    const context = gsap.context(() => {
      gsap.set(introLineInners, { yPercent: 112 });
      gsap.set(rowTitles, { yPercent: 112 });

      if (reducedMotionRef.current) {
        servicesLabelSlot.appendChild(servicesWord);
        servicesWord.dataset.docked = 'true';
        page.dataset.indexReady = 'true';
        gsap.set(rowTitles, { yPercent: 0 });
        gsap.set(intro, { display: 'none' });
        revealIndexForInteraction();
        return;
      }

      const timeline = gsap.timeline();
      introTimelineRef.current = timeline;
      timeline
        .to(introLineInners, {
          yPercent: 0,
          duration: 0.92,
          ease: 'power4.out',
          stagger: 0.075,
        })
        .to({}, { duration: 1.8 })
        .addLabel('questionExit')
        .to(leftExit, { xPercent: -118, duration: 0.72, ease: 'power4.inOut' }, 'questionExit')
        .to(rightExit, { xPercent: 118, duration: 0.72, ease: 'power4.inOut' }, 'questionExit')
        .to({}, { duration: 0.18 })
        .add(() => {
          const flipState = Flip.getState(servicesWord, { simple: true });
          page.dataset.indexReady = 'true';
          indexStage.removeAttribute('aria-hidden');
          servicesLabelSlot.appendChild(servicesWord);
          servicesWord.dataset.docked = 'true';

          Flip.from(flipState, {
            duration: 0.96,
            ease: 'power4.inOut',
            absolute: true,
          });

          gsap.to(rowTitles, {
            yPercent: 0,
            duration: 0.72,
            ease: 'power4.out',
            stagger: 0.065,
            onComplete: revealIndexForInteraction,
          });
        })
        .to(intro, {
          autoAlpha: 0,
          duration: 0.28,
          ease: 'power2.out',
          onComplete: () => { gsap.set(intro, { display: 'none' }); },
        }, '+=0.72');
    }, page);

    return () => {
      introTimelineRef.current?.kill();
      context.revert();
      if (servicesWord.parentElement !== introServicesSlot) introServicesSlot.appendChild(servicesWord);
      delete servicesWord.dataset.docked;
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
    const closeButton = closeButtonRef.current;
    const indexStage = indexStageRef.current;
    if (!row || !button || !title || !originBlocks || !preview || !previewTitle || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(originBlocks.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const secondaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-secondary-block]'));
    const allTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));
    if (primaryBlocks.length === 0) return;

    animationLockRef.current = true;
    currentIndexRef.current = index;
    originButtonRef.current = button;
    button.setAttribute('aria-expanded', 'true');
    setRowsFocusable(false);

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
    const closeButton = closeButtonRef.current;
    const indexStage = indexStageRef.current;
    if (!row || !button || !originBlocks || !preview || !previewTitle || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const secondaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-secondary-block]'));
    const gridItems = [...primaryBlocks, ...secondaryBlocks];
    const allTitles = rowTitleRefs.current.filter((value): value is HTMLSpanElement => Boolean(value));
    const rowRect = row.getBoundingClientRect();

    animationLockRef.current = true;

    const finishClose = () => {
      preview.dataset.active = 'false';
      preview.setAttribute('aria-hidden', 'true');
      row.dataset.current = 'false';
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
      }, 'start+=0.4');
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
    detailTimelineRef.current?.kill();
    hoverTimelineRefs.current.forEach((timeline) => timeline?.kill());
    const index = currentIndexRef.current;
    if (index >= 0) {
      const originBlocks = rowBlocksRefs.current[index];
      const previewGrid = previewGridRefs.current[index];
      if (originBlocks && previewGrid) {
        const primaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
        originBlocks.prepend(...primaryBlocks);
      }
    }
    document.body.style.overflow = previousBodyOverflowRef.current;
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
              data-service-row
              onMouseEnter={() => showRowPreview(index)}
              onMouseLeave={() => hideRowPreview(index)}
            >
              <button
                ref={(element: HTMLButtonElement | null) => { rowButtonRefs.current[index] = element; }}
                type="button"
                className={styles.rowButton}
                aria-label={`Open ${service.title}`}
                aria-expanded="false"
                aria-controls={`service-preview-${service.id}`}
                tabIndex={-1}
                onFocus={() => showRowPreview(index)}
                onBlur={() => hideRowPreview(index)}
                onClick={() => openService(index)}
              />

              <div className={`${styles.cell} ${styles.cellText}`}>
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
                {service.primary.map((item) => (
                  <div key={item} className={`${styles.tile} ${styles.rowTile}`} data-primary-block>
                    <div className={styles.tileInner}><span>{item}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.previewLayer} aria-label="Service details">
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          data-visible="false"
          tabIndex={-1}
          onClick={closeService}
          aria-label="Close service details"
        >
          ×
        </button>

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
              {service.secondary.map((item) => (
                <div key={item} className={`${styles.tile} ${styles.previewTile}`} data-secondary-block>
                  <div className={styles.tileInner}><span>{item}</span></div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
