---
name: murakami-project
description: "Continue, update, debug, document, test, or publish the 花花世界 interactive storybook project in this repository. Use when the user asks to continue this project, work on its Firebase room sync or manual room closure, or resume after updating VS Code."
argument-hint: "Describe the 花花世界 change or follow-up task"
user-invocable: true
---

# 花花世界專案接續 Skill

在此 repository 中協助維護繁體中文「花花世界」互動繪本，並讓 VS Code 更新或聊天紀錄遺失後仍能安全接續。

## 開始前

1. 檢查目前 repository、分支、`git status` 和最近提交；不要覆蓋使用者未提交的修改。
2. 閱讀根目錄 `README.md`、`MURAKAMI.md` 和與任務相關的程式、資料庫規則及測試紀錄。
3. 以目前檔案、Git 記錄和使用者最新確認為準；文件中的舊紀錄不可當作已部署或已測試的證據。
4. 使用繁體中文與使用者溝通；問題簡單時直接完成，不確定需求或涉及不可逆操作時先詢問。

## 專案事實

- 主要頁面為 `murakami.html`，網站使用 GitHub Pages。
- Firebase 專案為 `enhs01`；同步使用 Firebase Anonymous Authentication 和 Realtime Database。
- 房間建立者可以確認後永久刪除房間；房間資料刪除後不能由本程式復原。
- 房間沒有自動清理；不要重新加入 Cloud Functions、Cloud Scheduler、保留日數或相關帳單設定，除非使用者清楚要求並確認。
- 舊房間缺少 `ownerUid` 時，頁面結束功能無法處理，需由使用者在 Firebase Console 確認後手動刪除。
- Realtime Database 規則來源為 `database.rules.json`，Firebase CLI 設定為 `firebase.json` 和 `.firebaserc`。
- 最新已記錄 GitHub 功能提交為 `57c01f8`；仍須用 Git 確認目前分支與遠端狀態，不能假設工作目錄必定乾淨或與此提交一致。

## 修改和測試

1. 只修改滿足需求的檔案；保持單機繪本功能及房間同步行為。
2. 修改 Firebase 寫入路徑時，連同檢查 `database.rules.json` 和 `MURAKAMI.md` 規則範例，並測試建立、加入、同步及建立者結束房間。
3. 不要改為公開讀寫規則。任何資料庫規則變更都要先說明需要在 Firebase Console 發布；沒有明確要求不得代替使用者部署規則。
4. Firebase 資料刪除屬不可逆操作。刪除真實房間前須取得使用者明確確認；測試盡量使用專用測試房間。
5. 使用專案現有測試與可用的瀏覽器工具。若無法進行 Firebase 或多瀏覽器測試，清楚說明尚未驗證的部分。
6. 更新直接相關文件，尤其是 `MURAKAMI.md` 的操作、規則、安全、測試及部署說明；保持其中對手動刪除且無自動清理的描述一致。

## GitHub 與 Firebase 發布

- 使用者要求推送時，檢視差異並只提交本任務相關內容；不可帶入其他工作或秘密。
- 未獲使用者明確要求時，不要自行 commit、push 或部署。
- GitHub Pages 更新不等於 Firebase 規則已發布；分別確認並清楚回報兩者狀態。
- 任何可能啟用帳單、改變 Firebase 方案或新增雲端服務的工作，都先解釋費用風險並取得明確同意。

## 回覆完成摘要

完成後簡述改了什麼、測試結果、是否已推送 GitHub，以及 Firebase 規則是否已由使用者發布。引用 repository 檔案時使用相對 Markdown 連結。
