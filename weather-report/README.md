# 天氣報告系統（眼動儀訓練）

供學生練習以眼動儀、觸控或開關選取按鈕，並用廣東話語音報告香港天文台天氣。

試用網址：[天氣報告系統](https://kkleung-commits.github.io/github.io/weather-report/)。

## 功能

- 高對比度大按鈕，支援凝視 1、2 或 3 秒後觸發，也可直接點擊或使用開關。
- 以簡短天氣描述播報，例如「晴天」、「部分時間有陽光」、「陰天」、「雨天」、「有驟雨」及「有霧」。
- 顯示並讀出香港天文台天氣圖示的更新時間。
- 按下報告時才讀取香港天文台最新實況資料。

建議每天早上約 8:30 使用。天氣資料不是固定 8:30 的歷史紀錄；實際情況以畫面和語音顯示的天文台更新時間為準。

## 本機測試

需要 Node.js 22 或更新版本。請在 `weather-report` 目錄執行：

```powershell
npm install
npx playwright install chromium
npm test
```

測試會使用模擬的天氣 API 回應，驗證一般播報、更新時間、凝視觸發及 API 失敗提示，不會依賴即時天氣或語音裝置。

## 發佈與測試

此頁面位於現有 GitHub Pages 網站的 `weather-report/` 子目錄，不會取代網站首頁。`../.github/workflows/weather-report-tests.yml` 會在相關檔案更新時執行 Playwright 測試；網站沿用 repository 目前的 Pages 發佈設定。

如需放回原網站，請將 `index.html` 部署或改名為原站使用的 `game16.html`。

## 天氣資料來源

- 香港天文台即時天氣資料 API：`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`
- 香港天文台天氣圖示：`https://www.weather.gov.hk/images/wxicon/`
