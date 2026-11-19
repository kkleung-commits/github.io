# 天氣報告系統 2.0（眼動儀訓練）

獨立的新版本，舊版仍保留不變。供學生以眼動儀、觸控或開關選取大型按鈕，練習以廣東話報告香港天文台當日天氣。

試用網址：[天氣報告系統 2.0](https://kkleung-commits.github.io/github.io/weather-report-v2/)。

## 功能

- 加大「報告天氣」眼動目標，縮小天氣狀態和時間的顯示區域；支援凝視 1、2 或 3 秒、直接點擊及開關操作。
- 報告同學姓名可留空。播報會按香港時間先說「早晨」、「午安」或「晚安」；有填姓名時再直呼姓名（不加「同學」），然後按天文台天氣圖示報告。問候時段為 05:00–11:59「早晨」、12:00–17:59「午安」，其餘時間「晚安」。
- 天氣播報使用簡短、直接的香港廣東話，例如「今日天晴，太陽伯伯出來喇！」和「今日陰天，好多雲呀！」；大雨、雷暴、驟雨和霧等亦會用簡單說法清楚提醒。
- 顯示香港時間的天氣圖示更新日期和時間，並以圖示專屬的更新時間判斷是否為今天。若不是今天，會顯示日期、提醒老師核對，並暫停播報天氣。
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
- 最新版本標籤：[weather-report-v2.0.1](https://github.com/kkleung-commits/github.io/tree/weather-report-v2.0.1)
- 版本記錄：[CHANGELOG.md](./CHANGELOG.md)
- GitHub Pages 網址：[天氣報告系統 2.0](https://kkleung-commits.github.io/github.io/weather-report-v2/)
- 舊版仍在 [`weather-report/`](../weather-report/)。
- Repository：[kkleung-commits/github.io](https://github.com/kkleung-commits/github.io)，主要分支為 `main`。

## 接手與現場測試

目前最新版為 2.0.1；GitHub Actions 的 [20 項 Playwright 測試全數通過](https://github.com/kkleung-commits/github.io/actions/runs/43880626745)，也已確認 GitHub Pages 可讀取天文台即時資料。自動測試使用模擬語音和天氣資料，**尚未在實際眼動儀、學生裝置或禮堂藍牙音響上測試**。

在另一台公司電腦接續時：

1. 在 VS Code 開啟或複製 `kkleung-commits/github.io` repository，切換至 `main` 並執行 `git pull origin main`。
2. 讓 AI 先閱讀本 README 和[版本記錄](./CHANGELOG.md)，再說：「請由天氣報告系統 2.0.1 接手，先按 README 完成現場眼動儀和禮堂藍牙音響測試；保留 `weather-report/` 舊版，未確認前不要改動。」

現場建議依次確認：

1. 使用學生實際操作的電腦／iPad／手機及瀏覽器，並確認日期、時間和網絡正常。
2. 先在裝置的音訊設定連接禮堂音響，解鎖頁面後按「試聽語音」，確認音響有聲音、音量合適，並在禮堂不同位置聆聽。
3. 試一次輸入姓名和留空姓名，確認問候語、名字、語音及天氣內容合適。
4. 用實際眼動儀或開關操作按鈕，確認凝視停留／點擊能觸發報告，並確認聲音經禮堂音響播放。
5. 確認天氣日期顯示「今天」；若不是今天，頁面會提示並暫停播報，請先核對網絡和天文台資料。
6. 測試時保持裝置供電、頁面在前景，並避免螢幕自動休眠。

瀏覽器頁面不能自行選擇藍牙音響、檢查藍牙連線或調整系統／擴音器音量；這些需在裝置和音響設定中處理。不同裝置提供的粵語聲音亦可能不同。若現場試用後覺得老師不易辨認，可再考慮把「試聽語音」按鈕改名為「音響試播」或加入使用前提示。

## 資料來源

- 香港天文台即時天氣 API：`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`
- 香港天文台天氣圖示：`https://www.weather.gov.hk/images/wxicon/`
