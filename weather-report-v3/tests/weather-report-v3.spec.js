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
        window.lastSpeechRate = utterance.rate;
        window.lastSpeechPitch = utterance.pitch;
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

function mockWeather(page, {
  icon = 50,
  updateTime = '2026-11-16T08:20:00+08:00',
  iconUpdateTime = updateTime
} = {}) {
  return page.route(weatherApi, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      icon: [icon],
      updateTime,
      iconUpdateTime
    })
  }));
}

test('reports clear weather with the student name and displays today date and time', async ({ page }) => {
  await mockWeather(page, { icon: 50 });
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：晴天');
  await expect(page.locator('#weather-override')).toHaveValue('');
  await expect(page.locator('#update-time')).toContainText('2026年11月16日（今天）');
  await expect(page.locator('#update-time')).toContainText('8時20分');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位早晨，我係今天天氣小主播小明。今日天晴，太陽伯伯出來喇！');
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

test('uses the weather icon update time instead of the overall update time', async ({ page }) => {
  await mockWeather(page, {
    updateTime: '2026-11-16T10:02:00+08:00',
    iconUpdateTime: '2026-11-16T08:10:00+08:00'
  });
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：晴天');
  await expect(page.locator('#update-time')).toContainText('8時10分');
  await expect(page.locator('#update-time')).not.toContainText('10時02分');
});

test('does not report a previous-day icon when the overall data is current', async ({ page }) => {
  await mockWeather(page, {
    updateTime: '2026-11-16T08:20:00+08:00',
    iconUpdateTime: '2026-11-15T23:50:00+08:00'
  });
  await preparePage(page);

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toContainText('不是今天的天氣資料');
  await expect(page.locator('#update-time')).toContainText('2026年11月15日（昨天）');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('注意，天氣資料不是今天更新的，請老師先核對，暫不報告天氣。');
});

test('uses the teacher-selected local weather without requesting HKO data', async ({ page }) => {
  let weatherRequests = 0;
  await page.route(weatherApi, route => {
    weatherRequests += 1;
    return route.fulfill({
      status: 503,
      contentType: 'text/plain',
      body: 'Service unavailable'
    });
  });
  await preparePage(page);
  await page.locator('#weather-override').selectOption('60');

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：陰天（老師選擇）');
  await expect(page.locator('#update-time')).toHaveText('老師已手動選擇天氣，不使用天文台資料。');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位早晨，我係今天天氣小主播小明。今日係陰天，有雲遮住咗太陽，冇陽光。');
  expect(weatherRequests).toBe(0);
});

test('groups teacher settings and explains the local weather selection', async ({ page }) => {
  await preparePage(page);

  await expect(page.getByRole('region', { name: '老師設定' })).toBeVisible();
  await expect(page.getByLabel('本區天氣（選填）：')).toHaveValue('');
  await expect(page.locator('#weather-override')).toHaveAttribute('aria-describedby', 'weather-help');
  await expect(page.locator('#weather-help'))
    .toHaveText('保留「跟隨天文台」使用天文台資料；選擇本區天氣後，按報告即可按老師選項播報。');
});

test('allows an empty name and uses the afternoon greeting', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page, { studentName: '', time: '2026-11-16T13:30:00+08:00' });

  await page.locator('#btn-weather').click();

  await expect(page.locator('#header')).toHaveText('天氣：晴天');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('午安。今日天晴，太陽伯伯出來喇！');
});

test('uses the named afternoon weather anchor', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page, { studentName: '小美', time: '2026-11-16T13:30:00+08:00' });

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位午安，我係今天天氣小主播小美。今日天晴，太陽伯伯出來喇！');
});

test('uses the evening greeting and says a provided name without a title', async ({ page }) => {
  await mockWeather(page);
  await preparePage(page, { studentName: '小美', time: '2026-11-16T20:30:00+08:00' });

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位晚安，我係今天天氣小主播小美。今日天晴，太陽伯伯出來喇！');
});

test('uses the selected weather voice for the named report', async ({ page }) => {
  await mockWeather(page, { icon: 51 });
  await preparePage(page);
  await page.locator('#voice-selector').selectOption('male');

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastVoiceName))
    .toBe('Microsoft WanLung Online');
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位早晨，我係今天天氣小主播小明。今日有時出太陽，有時有雲呀！');
});

test('uses the higher-pitched child voice setting for a named report', async ({ page }) => {
  await mockWeather(page, { icon: 50 });
  await preparePage(page);
  await page.locator('#voice-selector').selectOption('child');

  await page.locator('#btn-weather').click();

  await expect.poll(() => page.evaluate(() => window.lastSpeechPitch)).toBe(1.35);
  await expect.poll(() => page.evaluate(() => window.lastSpeechRate)).toBe(0.95);
  await expect.poll(() => page.evaluate(() => window.lastSpokenText))
    .toBe('各位早晨，我係今天天氣小主播小明。今日天晴，太陽伯伯出來喇！');
});

for (const { icon, description, line } of [
  { icon: 60, description: '陰天', line: '今日係陰天，有雲遮住咗太陽，冇陽光。' },
  { icon: 61, description: '陰天', line: '今日係陰天，有雲遮住咗太陽，冇陽光。' },
  { icon: 62, description: '雨天', line: '今日落雨，記得帶遮呀！' },
  { icon: 64, description: '大雨', line: '今日落大雨，出門要小心呀！' },
  { icon: 65, description: '有雷暴', line: '今日有雷暴，聽到雷聲要留喺室內！' },
  { icon: 70, description: '有驟雨', line: '今日有驟雨，記得帶遮呀！' },
  { icon: 72, description: '有雷暴及驟雨', line: '今日有雷暴同驟雨，出門要小心呀！' },
  { icon: 75, description: '有大驟雨', line: '今日有大驟雨，出門要小心呀！' },
  { icon: 76, description: '有薄霧', line: '今日有薄霧，遠處會睇得唔清楚。' },
  { icon: 77, description: '有霧', line: '今日有霧，睇路要小心呀！' },
  { icon: 84, description: '有雷暴及大驟雨', line: '今日有雷暴同大驟雨，出門要小心呀！' },
  { icon: 85, description: '有全面驟雨', line: '今日好多地方有驟雨，記得帶遮呀！' }
]) {
  test(`uses a short, clear report for ${description} (icon ${icon})`, async ({ page }) => {
    await mockWeather(page, { icon });
    await preparePage(page);

    await page.locator('#btn-weather').click();

    await expect(page.locator('#header')).toHaveText(`天氣：${description}`);
    await expect.poll(() => page.evaluate(() => window.lastSpokenText))
      .toBe(`各位早晨，我係今天天氣小主播小明。${line}`);
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
  const weatherSelector = await page.locator('#weather-override').boundingBox();

  expect(heading.y).toBeGreaterThanOrEqual(controls.y + controls.height);
  expect(weatherSelector.x + weatherSelector.width).toBeLessThanOrEqual(390);
});

test('keeps the report button visible below settings on a compact mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await preparePage(page);

  const controls = await page.locator('#teacher-controls').boundingBox();
  const heading = await page.locator('#header').boundingBox();
  const button = await page.locator('#btn-weather').boundingBox();

  expect(heading.y).toBeGreaterThanOrEqual(controls.y + controls.height);
  expect(button.y + button.height).toBeLessThanOrEqual(568);
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
