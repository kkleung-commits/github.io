import { expect, test } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;
const weatherApi = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc';

const testVoices = [
  {
    name: 'Microsoft HiuMaan Online',
    voiceURI: 'Microsoft HiuMaan',
    lang: 'zh-HK',
    default: false
  },
  {
    name: 'Microsoft WanLung Online',
    voiceURI: 'Microsoft WanLung',
    lang: 'zh-HK',
    default: true
  }
];

async function preparePage(page, voices = testVoices) {
  await page.addInitScript(availableVoices => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        getVoices() {
          return availableVoices;
        },
        addEventListener() {},
        speak(utterance) {
          window.lastSpokenText = utterance.text;
          window.lastVoiceName = utterance.voice?.name || '';
        }
      }
    });
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.voice = null;
      }
    };
  }, voices);
  await page.goto(pageUrl);
  await page.locator('#unlock-screen').click();
}

test('speaks only the weather and displays the HKO update time', async ({ page }) => {
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
    .toBe('天氣報告：部分時間有陽光。');
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

for (const { preference, voice } of [
  {
    preference: 'female',
    voice: {
      name: 'Microsoft HiuMaan Online',
      voiceURI: 'Microsoft HiuMaan',
      lang: 'zh-HK'
    }
  },
  {
    preference: 'male',
    voice: {
      name: 'Microsoft WanLung Online',
      voiceURI: 'Microsoft WanLung',
      lang: 'zh-HK'
    }
  },
  {
    preference: 'female',
    voice: {
      name: 'Microsoft Tracy - Chinese (Traditional, Hong Kong S.A.R.)',
      voiceURI: 'Microsoft Tracy',
      lang: 'zh-HK'
    }
  },
  {
    preference: 'male',
    voice: {
      name: 'Microsoft Danny - Chinese (Traditional, Hong Kong S.A.R.)',
      voiceURI: 'Microsoft Danny',
      lang: 'zh-HK'
    }
  }
]) {
  test(`previews and uses ${voice.name} for the ${preference} preference`, async ({ page }) => {
    await page.route(weatherApi, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        icon: [50],
        iconUpdateTime: '2026-11-16T08:30:00+08:00'
      })
    }));
    await preparePage(page, [voice]);
    await page.locator('#voice-selector').selectOption(preference);
    await expect(page.locator('#voice-status')).toContainText(voice.name);

    await page.locator('#voice-preview').click();
    await expect.poll(() => page.evaluate(() => window.lastVoiceName))
      .toBe(voice.name);
    await expect.poll(() => page.evaluate(() => window.lastSpokenText))
      .toBe('天氣報告：晴天。部分時間有陽光。');

    await page.locator('#btn-weather').click();
    await expect.poll(() => page.evaluate(() => window.lastVoiceName))
      .toBe(voice.name);
  });
}

test('explains when the preferred gendered voice is unavailable', async ({ page }) => {
  await preparePage(page, [testVoices[1]]);

  await page.locator('#voice-selector').selectOption('female');

  await expect(page.locator('#voice-status'))
    .toContainText('未找到可辨認的女聲粵語語音');
});
