import { expect, test } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;
const weatherApi = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc';

async function preparePage(page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance) {
          window.lastSpokenText = utterance.text;
        }
      }
    });
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
  });
  await page.goto(pageUrl);
  await page.locator('#unlock-screen').click();
}

test('reports a simple condition and its HKO update time', async ({ page }) => {
  await page.route(weatherApi, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      icon: [51],
      iconUpdateTime: '2026-11-16T08:20:00+08:00'
    })
  }));
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：部分時間有陽光');
  await expect(page.locator('#update-time')).toContainText('8時20分');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toContain('部分時間有陽光');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toContain('8時20分');
});

test('reports after the selected gaze duration', async ({ page }) => {
  await page.route(weatherApi, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      icon: [50],
      iconUpdateTime: '2026-11-16T08:30:00+08:00'
    })
  }));
  await preparePage(page);
  await page.locator('#time-selector').selectOption('1000');

  await page.locator('#btn-weather').hover();

  await expect(page.locator('#header')).toHaveText('天氣：晴天', { timeout: 5000 });
});

test('shows and speaks a clear message when the weather API fails', async ({ page }) => {
  await page.route(weatherApi, route => route.fulfill({
    status: 503,
    contentType: 'text/plain',
    body: 'Service unavailable'
  }));
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('暫時未能取得天氣資料，請稍後再試。');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toContain('暫時未能取得天氣資料');
});
