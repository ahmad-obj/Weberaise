'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { SERVICES } from './servicesModel';
import styles from './ServicesPage.module.css';

gsap.registerPlugin(Flip);

const OPEN_DURATION = 0.9;
const CLOSE_DURATION = 0.72;

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
  const rowBlocksRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const previewRefs = useRef<Array<HTMLElement | null>>([]);
  const previewGridRefs = useRef<Array<HTMLDivElement | null>>([]);
  const originButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentIndexRef = useRef(-1);
  const animationLockRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const introTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const detailTimelineRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const previousOverflowRef = useRef('');

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
    const rowInners = rowRefs.current
      .map((row) => row?.querySelector<HTMLElement>('[data-row-inner]') ?? null)
      .filter((value): value is HTMLElement => Boolean(value));

    const context = gsap.context(() => {
      gsap.set(introLineInners, { yPercent: 112 });
      gsap.set(rowInners, { yPercent: 112 });

      if (reducedMotionRef.current) {
        servicesLabelSlot.appendChild(servicesWord);
        servicesWord.dataset.docked = 'true';
        page.dataset.indexReady = 'true';
        gsap.set(rowInners, { yPercent: 0 });
        gsap.set(intro, { autoAlpha: 0 });
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
        .to(leftExit, {
          xPercent: -118,
          duration: 0.72,
          ease: 'power4.inOut',
        }, 'questionExit')
        .to(rightExit, {
          xPercent: 118,
          duration: 0.72,
          ease: 'power4.inOut',
        }, 'questionExit')
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

          gsap.to(rowInners, {
            yPercent: 0,
            duration: 0.72,
            ease: 'power4.out',
            stagger: 0.065,
            onComplete: revealIndexForInteraction,
          });
        })
        .to(intro, {
          autoAlpha: 0,
          duration: 0.36,
          ease: 'power2.out',
        }, '+=0.72');
    }, page);

    return () => {
      introTimelineRef.current?.kill();
      context.revert();
      if (servicesWord.parentElement !== introServicesSlot) {
        introServicesSlot.appendChild(servicesWord);
      }
      delete servicesWord.dataset.docked;
      page.dataset.indexReady = 'false';
      page.dataset.indexInteractive = 'false';
      indexStage.setAttribute('aria-hidden', 'true');
      setRowsFocusable(false);
    };
  }, []);

  const openService = (index: number) => {
    if (animationLockRef.current || currentIndexRef.current !== -1) return;

    const page = pageRef.current;
    const row = rowRefs.current[index];
    const button = rowButtonRefs.current[index];
    const originBlocks = rowBlocksRefs.current[index];
    const preview = previewRefs.current[index];
    const previewGrid = previewGridRefs.current[index];
    const cover = coverRef.current;
    const closeButton = closeButtonRefs.current[index];
    const indexStage = indexStageRef.current;

    if (!page || !row || !button || !originBlocks || !preview || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(originBlocks.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const allRowInners = rowRefs.current
      .map((item) => item?.querySelector<HTMLElement>('[data-row-inner]') ?? null)
      .filter((value): value is HTMLElement => Boolean(value));
    const previewTitle = preview.querySelector<HTMLElement>('[data-preview-title]');
    const previewLead = preview.querySelector<HTMLElement>('[data-preview-lead]');
    const secondaryBlocks = Array.from(preview.querySelectorAll<HTMLElement>('[data-secondary-block]'));

    if (!previewTitle || !previewLead || primaryBlocks.length === 0) return;

    animationLockRef.current = true;
    currentIndexRef.current = index;
    originButtonRef.current = button;
    button.setAttribute('aria-expanded', 'true');
    setRowsFocusable(false);

    previousOverflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    page.dataset.detailOpen = 'true';
    preview.dataset.active = 'true';
    preview.setAttribute('aria-hidden', 'false');
    closeButton.tabIndex = 0;

    const rowRect = row.getBoundingClientRect();

    if (reducedMotionRef.current) {
      previewGrid.prepend(...primaryBlocks);
      gsap.set(cover, { top: 0, height: window.innerHeight, opacity: 1 });
      gsap.set([previewTitle, previewLead, ...secondaryBlocks, closeButton], { clearProps: 'transform', autoAlpha: 1 });
      indexStage.setAttribute('aria-hidden', 'true');
      animationLockRef.current = false;
      closeButton.focus({ preventScroll: true });
      return;
    }

    gsap.set(cover, {
      top: rowRect.top,
      height: Math.max(1, rowRect.height),
      opacity: 1,
    });
    gsap.set(previewTitle, { yPercent: 110 });
    gsap.set(previewLead, { autoAlpha: 0, y: 18 });
    gsap.set(secondaryBlocks, { autoAlpha: 0, y: 28, scale: 0.94 });
    gsap.set(closeButton, { autoAlpha: 0, y: -10 });

    const flipState = Flip.getState(primaryBlocks, { simple: true });
    previewGrid.prepend(...primaryBlocks);

    const flipTween = Flip.from(flipState, {
      duration: OPEN_DURATION,
      ease: 'power4.inOut',
      stagger: 0.045,
      absolute: true,
      paused: true,
    });

    const timeline = gsap.timeline({
      onComplete: () => {
        indexStage.setAttribute('aria-hidden', 'true');
        animationLockRef.current = false;
        closeButton.focus({ preventScroll: true });
      },
    });
    detailTimelineRef.current = timeline;

    timeline
      .addLabel('open', 0)
      .to(cover, {
        top: 0,
        height: window.innerHeight,
        duration: OPEN_DURATION,
        ease: 'power4.inOut',
      }, 'open')
      .to(allRowInners, {
        yPercent: (_: number, target: Element) => {
          const targetRow = (target as HTMLElement).closest<HTMLElement>('[data-service-row]');
          if (!targetRow) return -112;
          return targetRow.getBoundingClientRect().top > rowRect.top ? 112 : -112;
        },
        duration: 0.56,
        ease: 'power4.inOut',
      }, 'open')
      .add(flipTween, 'open')
      .to(previewTitle, {
        yPercent: 0,
        duration: 0.86,
        ease: 'power4.out',
      }, 'open+=0.12')
      .to(previewLead, {
        autoAlpha: 1,
        y: 0,
        duration: 0.64,
        ease: 'power3.out',
      }, 'open+=0.28')
      .to(secondaryBlocks, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.66,
        ease: 'power3.out',
        stagger: 0.055,
      }, 'open+=0.3')
      .to(closeButton, {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
      }, 'open+=0.28');
  };

  const closeService = () => {
    const index = currentIndexRef.current;
    if (animationLockRef.current || index < 0) return;

    const page = pageRef.current;
    const row = rowRefs.current[index];
    const button = rowButtonRefs.current[index];
    const originBlocks = rowBlocksRefs.current[index];
    const preview = previewRefs.current[index];
    const previewGrid = previewGridRefs.current[index];
    const cover = coverRef.current;
    const closeButton = closeButtonRefs.current[index];
    const indexStage = indexStageRef.current;

    if (!page || !row || !button || !originBlocks || !preview || !previewGrid || !cover || !closeButton || !indexStage) return;

    const primaryBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
    const allRowInners = rowRefs.current
      .map((item) => item?.querySelector<HTMLElement>('[data-row-inner]') ?? null)
      .filter((value): value is HTMLElement => Boolean(value));
    const previewTitle = preview.querySelector<HTMLElement>('[data-preview-title]');
    const previewLead = preview.querySelector<HTMLElement>('[data-preview-lead]');
    const secondaryBlocks = Array.from(preview.querySelectorAll<HTMLElement>('[data-secondary-block]'));

    if (!previewTitle || !previewLead || primaryBlocks.length === 0) return;

    animationLockRef.current = true;
    const rowRect = row.getBoundingClientRect();

    if (reducedMotionRef.current) {
      originBlocks.append(...primaryBlocks);
      preview.dataset.active = 'false';
      preview.setAttribute('aria-hidden', 'true');
      page.dataset.detailOpen = 'false';
      button.setAttribute('aria-expanded', 'false');
      closeButton.tabIndex = -1;
      gsap.set(cover, { opacity: 0, height: 0 });
      document.documentElement.style.overflow = previousOverflowRef.current;
      indexStage.removeAttribute('aria-hidden');
      setRowsFocusable(true);
      currentIndexRef.current = -1;
      animationLockRef.current = false;
      originButtonRef.current?.focus({ preventScroll: true });
      return;
    }

    const flipState = Flip.getState(primaryBlocks, { simple: true });
    originBlocks.append(...primaryBlocks);

    const flipTween = Flip.from(flipState, {
      duration: CLOSE_DURATION,
      ease: 'power4.inOut',
      stagger: 0.04,
      absolute: true,
      paused: true,
    });

    const timeline = gsap.timeline({
      onComplete: () => {
        preview.dataset.active = 'false';
        preview.setAttribute('aria-hidden', 'true');
        page.dataset.detailOpen = 'false';
        button.setAttribute('aria-expanded', 'false');
        closeButton.tabIndex = -1;
        gsap.set(cover, { opacity: 0, height: 0 });
        document.documentElement.style.overflow = previousOverflowRef.current;
        indexStage.removeAttribute('aria-hidden');
        setRowsFocusable(true);
        currentIndexRef.current = -1;
        animationLockRef.current = false;
        originButtonRef.current?.focus({ preventScroll: true });
      },
    });
    detailTimelineRef.current = timeline;

    timeline
      .addLabel('close', 0)
      .to([previewLead, ...secondaryBlocks], {
        autoAlpha: 0,
        y: 18,
        duration: 0.35,
        ease: 'power2.in',
      }, 'close')
      .to(previewTitle, {
        yPercent: 110,
        duration: 0.48,
        ease: 'power3.in',
      }, 'close')
      .to(closeButton, {
        autoAlpha: 0,
        y: -8,
        duration: 0.32,
        ease: 'power2.in',
      }, 'close')
      .add(flipTween, 'close+=0.08')
      .to(cover, {
        top: rowRect.top + rowRect.height / 2,
        height: 0,
        duration: CLOSE_DURATION,
        ease: 'power4.inOut',
      }, 'close+=0.14')
      .to(allRowInners, {
        yPercent: 0,
        duration: 0.58,
        ease: 'power4.out',
        stagger: {
          each: 0.035,
          from: index,
        },
      }, 'close+=0.28');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeService();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      detailTimelineRef.current?.kill();
      const index = currentIndexRef.current;
      if (index >= 0) {
        const originBlocks = rowBlocksRefs.current[index];
        const previewGrid = previewGridRefs.current[index];
        if (originBlocks && previewGrid) {
          const movedBlocks = Array.from(previewGrid.querySelectorAll<HTMLElement>('[data-primary-block]'));
          originBlocks.append(...movedBlocks);
        }
      }
      document.documentElement.style.overflow = previousOverflowRef.current;
    };
  }, []);

  return (
    <main ref={pageRef} className={styles.page} data-index-ready="false" data-index-interactive="false" data-detail-open="false">
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
          <p className={styles.indexInstruction}>SELECT A SERVICE</p>
        </header>

        <div className={styles.serviceList}>
          {SERVICES.map((service, index) => (
            <div
              key={service.id}
              ref={(element: HTMLDivElement | null) => { rowRefs.current[index] = element; }}
              className={styles.serviceRow}
              data-service-row
            >
              <button
                ref={(element: HTMLButtonElement | null) => { rowButtonRefs.current[index] = element; }}
                type="button"
                className={styles.rowButton}
                aria-expanded="false"
                aria-controls={`service-preview-${service.id}`}
                tabIndex={-1}
                onClick={() => openService(index)}
              >
                <span className={styles.rowClip}>
                  <span className={styles.rowInner} data-row-inner>
                    <span className={styles.rowIndex}>{service.index}</span>
                    <span className={styles.rowTitle}>{service.title}</span>
                  </span>
                </span>

                <span
                  ref={(element: HTMLSpanElement | null) => { rowBlocksRefs.current[index] = element; }}
                  className={styles.rowBlocks}
                  aria-hidden="true"
                  data-service-blocks
                >
                  {service.primary.map((item) => (
                    <span key={item} className={styles.primaryBlock} data-primary-block>
                      {item}
                    </span>
                  ))}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <div ref={coverRef} className={styles.cover} aria-hidden="true" />

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
              tabIndex={-1}
              onClick={closeService}
              aria-label="Close service details"
            >
              <span>CLOSE</span>
              <span aria-hidden="true">×</span>
            </button>

            <div className={styles.previewFrame}>
              <header className={styles.previewHeader}>
                <span className={styles.previewIndex}>{service.index}</span>
                <div className={styles.previewTitleClip}>
                  <h2
                    id={`service-preview-title-${service.id}`}
                    className={styles.previewTitle}
                    data-preview-title
                  >
                    {service.title}
                  </h2>
                </div>
                <p className={styles.previewLead} data-preview-lead>{service.lead}</p>
              </header>

              <div
                ref={(element: HTMLDivElement | null) => { previewGridRefs.current[index] = element; }}
                className={styles.detailGrid}
                data-service-grid
              >
                {service.secondary.map((item) => (
                  <div key={item} className={styles.secondaryBlock} data-secondary-block>
                    <span className={styles.blockEyebrow}>INCLUDES</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
