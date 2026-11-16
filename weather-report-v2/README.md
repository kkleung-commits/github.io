# 天氣報告系統 2.0（眼動儀訓練）

獨立的新版本，舊版仍保留不變。供學生以眼動儀、觸控或開關選取大型按鈕，練習以廣東話報告香港天文台當日天氣。

試用網址：[天氣報告系統 2.0](https://kkleung-commits.github.io/github.io/weather-report-v2/)。

## 功能

- 加大「報告天氣」眼動目標，縮小天氣狀態和時間的顯示區域；支援凝視 1、2 或 3 秒、直接點擊及開關操作。
- 報告同學姓名可留空。播報會按香港時間先說「早晨」、「午安」或「晚安」；有填姓名時再直呼姓名（不加「同學」），然後按天文台天氣圖示報告。問候時段為 05:00–11:59「早晨」、12:00–17:59「午安」，其餘時間「晚安」。
- 天氣說法簡單、原創而有童趣，例如「太陽公公笑哈哈」或「雨點滴答滴」；大雨、雷暴、驟雨和霧等仍會清楚說明。
- 顯示香港時間的天氣資料日期和更新時間。若資料不是今天，會顯示日期、提醒老師核對，並暫停播報天氣。
- 老師可選裝置預設、男聲或女聲偏好，並試聽。語音由學生裝置提供，可能因裝置而異。
- 姓名只在本機瀏覽器中用於語音，不會送往香港天文台或記錄到伺服器。

建議每天早上約 8:30 使用。資料是按下報告時讀取的最新天文台實況，不是固定 8:30 的歷史紀錄。日期和更新時間只顯示、不朗讀；若不是香港時間的今天，程式不會把舊資料當成今日天氣播報。

## 本機測試

需要 Node.js 22 或更新版本。在此目錄執行：

```powershell
npm install
npx playwright install chromium
npm test
```

自動測試使用模擬天氣資料和語音，不依賴即時天氣 API 或指定語音裝置。

## 版本及發佈

- 版本：2.0.1
- 版本記錄：[CHANGELOG.md](./CHANGELOG.md)
- GitHub Pages 網址：[天氣報告系統 2.0](https://kkleung-commits.github.io/github.io/weather-report-v2/)
- 舊版仍在 [`weather-report/`](../weather-report/)。

## 資料來源

- 香港天文台即時天氣 API：`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`
- 香港天文台天氣圖示：`https://www.weather.gov.hk/images/wxicon/`
