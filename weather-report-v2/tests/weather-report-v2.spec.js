import { expect, test } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;
const weatherApi = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc';
const testVoices = [{
  name: 'Microsoft WanLung Online',
  voiceURI: 'Microsoft WanLung',
  lang: 'zh-HK',
  default: true
}];

async function preparePage(page, { studentName = '小明', time = '2026-11-16T08:30:00+08:00' } = {}) {
  await page.clock.setFixedTime(new Date(time));
  await page.addInitScript(availableVoices => {
    const speechSynthesis = {
      cancel() {},
      getVoices() {
        return availableVoices;
      },
      speak(utterance) {
        window.lastSpokenText = utterance.text;
        window.lastVoiceName = utterance.voice?.name || '';
      },
      addEventListener() {}
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: speechSynthesis
    });
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.voice = null;
      }
    };
  }, testVoices);
  await page.goto(pageUrl);
  await page.locator('#unlock-screen').click();
  if (studentName) await page.locator('#student-name').fill(studentName);
}

function mockWeather(page, { icon = 50, updateTime = '2026-11-16T08:20:00+08:00' } = {}) {
  return page.route(weatherApi, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      icon: [icon],
      updateTime,
      iconUpdateTime: updateTime
    })
  }));
}

test('reports playful weather with the student name and displays today date and time', async ({ page }) => {
  await mockWeather(page, { icon: 50 });
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：晴天');
  await expect(page.locator('#update-time')).toContainText('2026年11月16日（今天）');
  await expect(page.locator('#update-time')).toContainText('8時20分');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('早晨，小明。太陽公公笑哈哈，今天是晴天呀！');
  await expect(page.locator('#update-time')).not.toContainText('我是');
});

test('does not report weather when HKO data is not from today', async ({ page }) => {
  await mockWeather(page, { icon: 50, updateTime: '2026-11-15T08:20:00+08:00' });
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toContainText('不是今天的天氣資料');
  await expect(page.locator('#update-time')).toContainText('2026年11月15日（昨天）');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('注意，天氣資料不是今天更新的，請老師先核對，暫不報告天氣。');
  await expect(page.locator('#weather-icon')).not.toBeVisible();
});

test('allows an empty name and uses the afternoon greeting', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page, { studentName: '', time: '2026-11-16T13:30:00+08:00' });

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：晴天');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('午安。太陽公公笑哈哈，今天是晴天呀！');
});

test('uses the evening greeting and says a provided name without a title', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page, { studentName: '小美', time: '2026-11-16T20:30:00+08:00' });

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('晚安，小美。太陽公公笑哈哈，今天是晴天呀！');
});

test('uses the selected weather voice for the named report', async ({ page }) => {
  await mockWeather(page, { icon: 51 });
  await preparePage(page);
  await page.locator('#voice-selector').selectOption('male');

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastVoiceName))
    .toBe('Microsoft WanLung Online');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('早晨，小明。太陽同白雲玩捉迷藏，部分時間有陽光呀！');
});

for (const { icon, description, line } of [
  { icon: 60, description: '陰天', line: '雲朵排排坐，今天是陰天呀！' },
  { icon: 62, description: '雨天', line: '雨點滴答滴，今天有雨呀，記得帶遮！' },
  { icon: 64, description: '大雨', line: '雨水嘩啦啦，今天有大雨，記得帶遮呀！' },
  { icon: 65, description: '有雷暴', line: '雷公打鼓咚咚響，今天有雷暴，要留心天氣呀！' },
  { icon: 70, description: '有驟雨', line: '雨點突然來探班，今天有驟雨呀！' },
  { icon: 72, description: '有雷暴及驟雨', line: '雷公打鼓又落雨，今天有雷暴及驟雨，要留心天氣呀！' },
  { icon: 75, description: '有大驟雨', line: '雨點嘩啦啦地來了，今天有大驟雨，記得帶遮呀！' },
  { icon: 76, description: '有薄霧', line: '薄霧像輕紗飄呀飄，今天有薄霧呀！' },
  { icon: 77, description: '有霧', line: '霧氣白茫茫，今天有霧呀，出門要留心！' },
  { icon: 84, description: '有雷暴及大驟雨', line: '雷公打鼓又落大雨，今天有雷暴及大驟雨，要留心天氣呀！' },
  { icon: 85, description: '有全面驟雨', line: '雨點四處來探班，今天有全面驟雨，記得帶遮呀！' }
]) {
  test(`uses an accurate playful report for ${description}`, async ({ page }) => {
    await mockWeather(page, { icon });
    await preparePage(page);

    await page.locator('#btn-weather').click();

    await expect(page.locator('#header')).toHaveText(`天氣：${description}`);
    await expect.poll(() => page.evaluate(() => window.lastSpokenText))
      .toBe(`早晨，小明。${line}`);
  });
}

test('makes the gaze target substantially larger than the status text', async ({ page }) => {
  await preparePage(page);

  const button = await page.locator('#btn-weather').boundingBox();
  const heading = await page.locator('#header').boundingBox();
  const viewport = page.viewportSize();

  expect(button.width).toBeGreaterThan(viewport.width * 0.8);
  expect(button.height).toBeGreaterThan(heading.height * 5);
});

test('keeps the teacher settings clear of the main status on a mobile-sized screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preparePage(page);

  const controls = await page.locator('#teacher-controls').boundingBox();
  const heading = await page.locator('#header').boundingBox();

  expect(heading.y).toBeGreaterThanOrEqual(controls.y + controls.height);
});

test('reports after the selected gaze duration', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page);
  await page.locator('#time-selector').selectOption('1000');

  await page.locator('#btn-weather').hover();

  await expect(page.locator('#header')).toHaveText('天氣：晴天', { timeout: 5000 });
});

test('shows an error when the weather API is unavailable', async ({ page }) => {
  await page.route(weatherApi, route => route.fulfill({
    status: 503,
    contentType: 'text/plain',
    body: 'Service unavailable'
  }));
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('暫時未能取得天氣資料，請稍後再試。');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('暫時未能取得天氣資料，請稍後再試。');
});
