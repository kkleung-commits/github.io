# 花花世界｜互動藝術繪本

可在瀏覽器操作的繁體中文互動繪本，適合課堂投影、電子白板和學生平板使用。

- **線上體驗：** https://kkleung-commits.github.io/github.io/murakami.html
- **原始檔：** [`murakami.html`](./murakami.html)
- **同步方式：** Firebase Authentication 匿名登入 + Realtime Database
- **目前狀態：** 可單機操作；多人即時同步需要網路及已設定的 Firebase 專案。

## 功能

- 8 個故事畫面，可用上一頁、下一頁和活動控制切換。
- 繁體中文故事與瀏覽器語音朗讀。
- 花瓣填色、種花活動及重新創作。
- 放大圖書，方便投影或課堂展示。
- 建立 6 位英數房間碼，讓不同裝置加入同一個房間。
- 即時同步頁碼、已填色花瓣及已種下的花。
- 教師可結束房間並立即刪除房間資料；不設定自動清理排程。
- 不連線的單機模式不需要 Firebase。

## 專案目前狀態（2026-11-06）

- GitHub repository：[`kkleung-commits/github.io`](https://github.com/kkleung-commits/github.io)，主要分支 `main`。
- 最新已推送功能版本：`57c01f8`（`feat: add manual room closure`）。
- Firebase Realtime Database 規則已由專案管理者在 Firebase Console 更新；管理者回報房間功能目前正常。
- 房間由建立者手動結束並永久刪除，不設定 Cloud Functions、Cloud Scheduler 或自動清理。
- 舊房間若缺少 `ownerUid`，需在 Firebase Console 手動確認及刪除。
- 下次接續先查看 `git status`、`git log -5 --oneline`，再依本指南確認 Firebase 規則、測試和發佈狀態。
- VS Code Copilot 專案 Skill：[`.github/skills/murakami-project/SKILL.md`](./.github/skills/murakami-project/SKILL.md)。

## 開始使用

### 體驗繪本

開啟[線上繪本](https://kkleung-commits.github.io/github.io/murakami.html)，選擇「單機使用（不連線）」即可開始。單機模式不會同步至其他裝置，也不需要登入 Firebase。

### 課堂即時同步

教師先按「建立房間」，再把畫面顯示的房間碼提供給學生。學生在另一部裝置開啟相同網頁，選擇「輸入房間碼」並按「加入」。加入後，房間成員的頁碼和創作會即時同步。

請只把房間碼分享給該課堂參與者。知道房間碼的人可以嘗試加入房間。

### 結束房間

建立房間的教師可按控制列中的「結束房間」，再確認永久刪除。其他裝置會收到房間結束／失效提示，並停止同步。房間資料刪除後不能復原。

房間不會自動清理。結束後，房間及其中的同步創作會從 Realtime Database 刪除，無法透過本程式復原；若教師忘記結束房間，資料會繼續保留，直到教師在 Firebase Console 手動刪除。

舊版建立的房間沒有建立者欄位，無法使用頁面上的結束功能；請在 Realtime Database Console 確認不再使用後手動刪除。請勿在仍有課堂使用時刪除房間。

## Firebase 專案設定

本頁已設定 Firebase Web App 的公開前端設定，Realtime Database 網址位於新加坡區域。首次部署到新網域時，仍需在 Firebase Console 確認 Authentication、資料庫規則和允許的網域。
頁面入場視窗提供「教師：查看 Firebase 設定說明」連結，方便老師直接開啟本指南。

1. 在 [Firebase Console](https://console.firebase.google.com/) 開啟此專案。
2. 在 **Build → Authentication → Sign-in method** 啟用 **Anonymous** 登入。
3. 在 **Build → Realtime Database → Rules** 貼上本指南的規則並按 **Publish**。
4. 在 Authentication 的 **Settings → Authorized domains** 確認部署網域已列入允許清單。GitHub Pages 的網域為 `kkleung-commits.github.io`。
5. 透過 HTTPS 開啟繪本，按「建立房間」測試；再用另一個瀏覽器或裝置輸入房間碼加入。

本機開發請透過 localhost（例如 VS Code 的 Live Server）開啟 `murakami.html`。直接以 `file:///` 開啟不適合測試多人連線。

### Realtime Database 規則

最新規則保存在 [`database.rules.json`](./database.rules.json)。將以下內容放在 Realtime Database 的 **Rules** 頁面並按 **Publish**；它限制房間資料讀取給房間成員，只允許房間建立者建立和刪除房間，並允許成員更新房間狀態。

```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": "auth != null && data.child('members').child(auth.uid).exists()",
        ".write": "auth != null && ((!data.exists() && newData.child('ownerUid').val() === auth.uid && newData.child('members').child(auth.uid).exists() && newData.child('state').exists()) || (data.exists() && data.child('ownerUid').val() === auth.uid && !newData.exists()))",
        "ownerUid": {
          ".validate": "newData.isString()"
        },
        "members": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid && root.child('rooms').child($room).exists()",
            ".validate": "newData.hasChild('joinedAt') && newData.child('joinedAt').isNumber()"
          }
        },
        "state": {
          ".write": "auth != null && root.child('rooms').child($room).child('members').child(auth.uid).exists()",
          ".validate": "newData.hasChild('pageIndex') && newData.child('pageIndex').isNumber() && newData.child('pageIndex').val() >= 0 && newData.child('pageIndex').val() <= 7"
        }
      }
    }
  }
}
```

不要以公開讀寫規則（例如所有使用者皆可讀寫）取代以上規則。任何改動安全規則前，都應使用兩個不同瀏覽器測試建立、加入及同步流程。

## 同步資料

資料存放在 Realtime Database 的 `rooms/{房間碼}`：

```text
rooms/
  ABC123/
    ownerUid: "Firebase 匿名使用者 UID"
    members/
      {Firebase 匿名使用者 UID}/
        joinedAt: timestamp
    state/
      pageIndex: 0-7
      petalPaints/
        0: "#ed6455"
      gardenFlowers/
        0: true
```

資料不包含學生姓名。房間只會在建立者按下「結束房間」後刪除；本專案不會部署自動清理排程或保留已結束房間的資料。若忘記結束，房間會繼續留在 Realtime Database，需到 Firebase Console 手動刪除 `rooms/{房間碼}`。

### 發佈資料庫規則

本專案只使用 Firebase Authentication 和 Realtime Database，不需部署 Cloud Functions 或 Cloud Scheduler。建立、同步及刪除房間會使用 Realtime Database；Firebase 是否收費取決於專案方案和實際用量，請在 Firebase Console 查看用量及 [Firebase 定價](https://firebase.google.com/pricing)。

在 Firebase Console 的 **Build → Realtime Database → Rules** 貼上本指南或 [`database.rules.json`](./database.rules.json) 的規則並按 **Publish**。若已安裝 Firebase CLI 並選取 `enhs01` 專案，也可在 repository 根目錄執行 `firebase deploy --only database`。發布規則後，再發佈新版 `murakami.html`。

## 安全與隱私

- Firebase Web App 設定中的 `apiKey` 是瀏覽器端識別設定，並非管理員密碼；資料存取應由 Authentication 和 Realtime Database 規則保護。
- 建立者按下「結束房間」會永久刪除整個 `rooms/{房間碼}`；本專案不會自動刪除房間。
- 不要把 Firebase Service Account 私密金鑰、管理員憑證或其他秘密放進 HTML、GitHub 或公開分享。
- 匿名登入可辨識目前瀏覽器的 Firebase 使用者，但不代表房間碼具有邀請者身份驗證。請勿在房間內同步個人或敏感資料。
- 公開 GitHub Pages 的所有訪客均可載入頁面程式。請定期檢查資料庫規則及 Firebase 用量。
- 舊版房間沒有 `ownerUid` 欄位，不支援頁面結束房間，需在 Firebase Console 手動移除。
- 同一房間多人同時操作時，最後寫入的頁碼或同一項狀態會成為目前值。

## 常見問題

### 建立房間出現 `PERMISSION_DENIED`

確認匿名登入已啟用、Realtime Database 規則已發布，並確認使用的是本指南的規則。檢查目前資料庫所在區域和 `murakami.html` 中的 `databaseURL` 相同。

### 加入房間失敗

確認房間碼為建立者提供的 6 位英數字、房間尚未被刪除，且裝置能連線至 Firebase。若部署到自訂網域，請在 Firebase Authentication 的 Authorized domains 加入該網域。

### 看得到網頁，但沒有多人同步

直接開啟 HTML 檔案、Firebase SDK 無法載入、匿名登入未啟用或資料庫規則不符，都可能造成同步失敗。使用 HTTPS 或 localhost，並查看畫面錯誤訊息及瀏覽器 Console。

## 測試清單

2026-11-06 曾以兩個瀏覽器進行 Firebase 房間測試：建立房間、使用房間碼加入及翻頁同步成功。單機互動亦測試過翻頁、花瓣填色和種花。花瓣／種花的跨裝置同步及其他裝置的存取限制仍待完整回歸測試。

- [ ] 單機模式可翻頁、朗讀、填色、種花及重新創作。
- [ ] 建立房間後顯示 6 位房間碼。
- [ ] 第二個瀏覽器可使用房間碼加入。
- [ ] 其中一個裝置翻頁，另一個裝置會更新到相同頁碼。
- [ ] 花瓣填色和種花狀態會同步到房間其他裝置。
- [ ] 未加入房間的匿名使用者不能讀取該房間狀態。
- [ ] 建立者可確認並結束房間；其他裝置會停止同步。

## 發佈更新

此 repository 使用 GitHub Pages 的 `main` branch。更新流程：

1. 編輯 `murakami.html` 或相關文件。
2. 在本機以 localhost 測試；涉及 Firebase 時，使用兩個瀏覽器確認同步。
3. 將變更提交並推送至 `main`。
4. 等待 GitHub Pages 部署完成，再開啟線上繪本驗證。

專案網址：https://github.com/kkleung-commits/github.io
