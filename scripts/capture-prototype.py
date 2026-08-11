from __future__ import annotations

from pathlib import Path
import base64
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / 'screenshots'
SCREENSHOTS.mkdir(exist_ok=True)


def inline_document(debug_state: str | None) -> str:
    html = (ROOT / 'prototype/index.html').read_text()
    css = (ROOT / 'prototype/styles.css').read_text()
    engine = (ROOT / 'prototype/reveal-engine.js').read_text()
    app = (ROOT / 'prototype/app.js').read_text()
    svg = (ROOT / 'public/brand/weberaise-horizontal-on-dark.svg').read_bytes()
    svg_uri = 'data:image/svg+xml;base64,' + base64.b64encode(svg).decode()

    html = re.sub(r'<link rel="stylesheet" href="\./styles\.css"\s*/?>', f'<style>{css}</style>', html)
    html = html.replace('../public/brand/weberaise-horizontal-on-dark.svg', svg_uri)
    html = re.sub(r'<script type="module" src="\./app\.js"></script>', '', html)

    engine = engine.replace('export class RevealEngine', 'class RevealEngine')
    engine = engine.replace('export function createRevealEngine', 'function createRevealEngine')
    app = app.replace("import { createRevealEngine } from './reveal-engine.js';\n", '')
    app = app.replace('export function createAutonomousStroke', 'function createAutonomousStroke')
    app = app.replace("'../public/brand/weberaise-horizontal-on-dark.svg'", repr(svg_uri))
    app = app.replace(
        "const debugState = new URLSearchParams(location.search).get('debugState');",
        f"const debugState = {'null' if debug_state is None else repr(debug_state)};",
    )
    return html.replace('</body>', f'<script>{engine}\n{app}</script></body>')


def page_with_capture(browser, state: str | None, filename: str, wait_ms: int):
    errors: list[str] = []
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    page.on('console', lambda msg: errors.append(f'console {msg.type}: {msg.text}') if msg.type in ('error', 'warning') else None)
    page.on('pageerror', lambda exc: errors.append(f'pageerror: {exc}'))
    page.set_content(inline_document(state), wait_until='load')
    page.wait_for_timeout(wait_ms)
    page.screenshot(path=str(SCREENSHOTS / filename))
    return page, errors


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        executable_path='/usr/bin/chromium',
        args=[
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--enable-unsafe-swiftshader',
        ],
    )

    all_errors: list[str] = []

    page, errors = page_with_capture(browser, None, '01-loader.png', 220)
    all_errors += errors
    page.close()

    page, errors = page_with_capture(browser, 'hero', '02-hero-autonomous.png', 1000)
    all_errors += errors
    webgl2 = page.evaluate("() => !!document.querySelector('[data-reveal-canvas]').getContext('webgl2')")
    print('webgl2=', webgl2)
    page.mouse.move(350, 400)
    page.mouse.move(580, 430, steps=12)
    page.mouse.move(820, 390, steps=12)
    page.wait_for_timeout(300)
    page.screenshot(path=str(SCREENSHOTS / '03-hero-pointer-reveal.png'))
    page.locator('[data-explore]').click()
    page.wait_for_timeout(2600)
    page.screenshot(path=str(SCREENSHOTS / '04-main-handoff.png'))
    print('main_hidden=', page.locator('[data-main]').get_attribute('hidden'))
    print('body_class=', page.locator('body').get_attribute('class'))
    page.close()

    browser.close()

    print('errors_count=', len(all_errors))
    for error in all_errors:
        print(error)
    if all_errors:
        raise SystemExit(2)
