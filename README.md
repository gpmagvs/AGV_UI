# AGV_UI（車載系統前端）

本專案為 **GPMVehicleControlSystem 車載/派車系統**的前端 UI（Vue 3）。主要透過：

- **REST API**（`src/api/*.js`）取得/操作車輛與系統功能
- **SignalR**（`src/AGVDataFetchWorker.js`）接收即時狀態與事件
- **ROS Bridge**（`src/api/WebRos.js` + `roslib`）取得/發布 ROS 資料（如 `/module_information`、`/cmd_vel`）

> 重要：本 README 以目前程式碼為準（`master`），不描述不存在的功能/選單。

## 目錄

- [快速開始](#快速開始)
- [技術棧與版本](#技術棧與版本)
- [指令與流程](#指令與流程)
- [目錄結構](#目錄結構)
- [架構總覽](#架構總覽)
  - [入口與全域依賴](#入口與全域依賴)
  - [路由與頁面](#路由與頁面)
  - [狀態管理（Vuex）](#狀態管理vuex)
  - [即時資料（SignalR / FrontendHub）](#即時資料signalr--frontendhub)
  - [ROS Bridge（roslib）](#ros-bridgeroslib)
  - [WebSocket 系統訊息](#websocket-系統訊息)
  - [REST API 模組](#rest-api-模組)
- [專案慣例與設計模式](#專案慣例與設計模式)
- [功能地圖（按檔案/資料夾）](#功能地圖按檔案資料夾)
- [擴充指南](#擴充指南)
- [建置與部署](#建置與部署)
- [相關專案](#相關專案)
- [常見問題與排錯](#常見問題與排錯)

## 快速開始

### 1) 安裝依賴

```bash
npm install
```

若你在公司網路/私有 registry 下遇到 SSL 問題，可視情況（自行評估風險）：

```bash
npm config set ssl-strict=false
```

### 2) 設定後端位址（開發模式）

開發模式下，後端位址由 `src/gpm_param.js` 決定：

- **`backend_host`**：SignalR 與 REST API 的 base URL
- **`ros_bridge_url`**：由 `backend_host` 推導為 ws/wss 並固定成 `:9090`

> 目前 `src/gpm_param.js` 在 `import.meta.env.DEV` 分支內有多組 `return`（僅第一個 return 會生效）。請依要連線的機台/IP 修改第一個 return。

### 3) 啟動開發伺服器

```bash
npm run dev
```

預設使用 `8080`（見 `vite.config.js`）。

## 技術棧與版本

以 `package.json` 為準（僅列出核心）：

| 類別 | 套件 | 版本 |
|---|---|---|
| Framework | `vue` | `^3.2.13` |
| Bundler | `vite` | `^5.0.0` |
| Router | `vue-router` | `^4.0.3` |
| State | `vuex` | `^4.0.0` |
| Realtime | `@microsoft/signalr` | `^8.0.0` |
| HTTP | `axios` | `^0.27.2` |
| UI | `element-plus` | `^2.2.28` |
| UI | `bootstrap` / `bootstrap-vue-3` | `^5.2.0` / `^0.2.12` |
| i18n | `vue-i18n` | `^9.2.2` |
| Charts | `apexcharts` / `vue3-apexcharts` / `chart.js` | `^3.42.0` / `^1.4.4` / `^3.8.0` |
| Map | `ol`（OpenLayers） | `^7.3.0` |
| 3D | `three` | `^0.175.0` |
| ROS | `roslib` | `^1.3.0` |

## 指令與流程

### 常用指令（`package.json` scripts）

```bash
# 開發
npm run dev

# 建置（Vite）
npm run build

# 本機預覽 build 成品
npm run preview

# 發佈流程：standard-version 版本號 + build
npm run pub
```

## 目錄結構

```text
.
├─ src/
│  ├─ main.js                      # Vue 入口（掛載 router/store/i18n/axios）
│  ├─ App.vue                      # 根組件；啟動即時資料抓取（AGVDataFetchWorker.Start）
│  ├─ router/
│  │  └─ index.js                   # 路由（含 /v2 與 /tsmc）
│  ├─ store/
│  │  ├─ index.js                   # 多個 Vuex store 實例（AGVStatusStore...）
│  │  └─ ros_store.js               # ROS_STORE（鍵盤控制/ModuleInformation）
│  ├─ api/
│  │  ├─ VMSAPI.js                  # 車輛/系統操作 API（REST）
│  │  ├─ UserAPI.js                 # 登入
│  │  ├─ MapAPI.js                  # 地圖下載/存檔/路徑規劃（REST）
│  │  ├─ WebRos.js                  # ROS Bridge（roslib）連線/重連與 topic publish/subscribe
│  │  └─ ...                        # 其他 API（SaftyPLC、VMS、WebSocket helper...）
│  ├─ ViewModels/                   # DTO/狀態模型（與後端欄位名需對齊）
│  ├─ views/                        # 頁面級 view（Home、Admin、TSMC...）
│  ├─ components/                   # 可重用元件（含 Version2、E84、SaftyPLC、VMSTask...）
│  ├─ locales/                      # i18n（zh-TW / en-US）
│  ├─ AGVDataFetchWorker.js          # SignalR 連線與事件處理（FrontendHub）
│  ├─ system_message_fetch.js        # WebSocket 系統訊息（ws/Sys_Messages）
│  ├─ gpm_param.js                  # 後端 host / ROS bridge URL 推導
│  └─ idling_detector.js            # 閒置登出（10 分鐘）
└─ vite.config.js                   # dev port / build outDir（預設輸出到後端 wwwroot）
```

## 架構總覽

### 入口與全域依賴

`src/main.js` 負責建立 app 並掛載：

- `router`：`src/router/index.js`
- `store`：`src/store/index.js` 裡的 `store`（注意：此專案同時存在多個 store 實例，見下節）
- `i18n`：預設 locale 為 `zh-TW`，fallback `en-US`
- `axios`：掛到 `app.config.globalProperties.$axios`（實體定義在 `src/axios.js`，baseURL 由 `src/gpm_param.js` 決定）

### 路由與頁面

路由定義在 `src/router/index.js`，重點路徑如下（以檔名/資料夾推定功能範圍）：

| Path | 主要 component/view |
|---|---|
| `/` | `src/views/HomeView.vue`（含子路由：overview / io / alarm / controller） |
| `/v2` | `src/views/Version2/HomeView.vue`（新版框架；子路由同樣包含 overview / IOTable / Alarm / controller / rd_test） |
| `/admin` | `src/views/Admin.vue`（管理頁） |
| `/rd_test` | `src/views/RDTestView.vue` |
| `/idle` | `src/views/IdleView.vue` |
| `/playground` | `src/views/Playground.vue` |
| `/alarmTableEdit` | `src/views/AlarmTableEditView.vue` |
| `/tsmc` | `src/views/TSMC/TsmcHmiView.vue` |

### 狀態管理（Vuex）

本專案在 `src/store/index.js` 中 **建立並匯出多個 `createStore()` 實例**（而非單一 store + modules 的典型結構）。常見的 store 包含：

- `UIStore`：UI 版本、Tab、連線狀態（ROS/WAGO/VMS）等
- `AGVStatusStore`：車輛狀態（`VMSData`）、感測/告警、任務/模式等
- `SystemSettingsStore`：系統參數（由後端下載/儲存）
- `DIOStore`：I/O 狀態
- `SaftyPLCStore`：Safety PLC 狀態
- `SystemMsgStore`：系統訊息與磁碟狀態
- `RDTestDataStore`：RD 測試相關資料
- `CamStore`：影像串流資料（H264）
- `map_store`：地圖資料
- 另有 `ROS_STORE`：位於 `src/store/ros_store.js`

> 開發提醒：元件多以「直接 import 對應 store 實例」方式使用（`UIStore.commit(...)`）。擴充時要確定你使用的是正確的 store 實例（不要誤用 `useStore()` 取到的注入 store）。

### 即時資料（SignalR / FrontendHub）

`src/AGVDataFetchWorker.js` 負責建立 SignalR 連線並處理事件；在 `src/App.vue` 的 `created()` 生命週期會呼叫 `Start()` 啟動。

- **連線目標**：`${param.backend_host}/FrontendHub`
- **重連策略**：`.withAutomaticReconnect([0, 1000, 2000, 3000])` + `onclose` 後自行 `setTimeout(StartHubConnection, 1000)`
- **頁面隱藏節流**：頁面隱藏超過 10 秒會 `stop()` 斷線；回到可見會自動重連（避免背景分頁占用資源）
- **資料落點**：根據 hub event，commit 到對應 store，並透過 `mitt` event bus（`src/event-bus.js`）向 UI 廣播

常見事件（以目前程式碼為準）：

- **狀態/資料**：`ReceiveData` → `AGVStatusStore` / `UIStore` / `RDTestDataStore`
- **I/O**：`DIOStatus` → `DIOStore`
- **Safety PLC**：`SaftyPLCStatus` → `SaftyPLCStore`
- **模組資訊**：`ModuleInformation` → `ROS_STORE`
- **系統設定變更**：`ParameterChanged` → `SystemSettingsStore` + bus emit
- **訊息/告警**：`VehicleError`、`DiskUsageError`、`BackendExceptionMessage`、`DebugMessage`、`Notification` 等 → bus emit
- **其他**：`DiskStatus`（更新 `SystemMsgStore`）、`CurrentRobotSpeedCommand`（更新 `AGVStatusStore`）、`maintain-mode-status` 等

### ROS Bridge（roslib）

`src/api/WebRos.js` 透過 `roslib` 連線到 `param.ros_bridge_url`（由 `backend_host` 推導）。

- **ROS1/ROS2 相容**：啟動時呼叫 `SystemAPI.GetROS_VERSION()` 判斷 message type（例如 `/cmd_vel` 使用 `geometry_msgs/Twist` 或 `geometry_msgs/msg/Twist`）
- **重連機制**：指數退避（base 1s，上限 15s）+ 定期健康檢查（5s）+ 分頁回到可見時主動觸發重連
- **資料同步**：
  - `/module_information` subscribe → `ROS_STORE.commit('update_module_info', ...)`
  - 鍵盤控制 publish `/cmd_vel`（需 `SystemSettingsStore.getters.Settings?.WebKeyboardMoveControl` 允許）

### WebSocket 系統訊息

`src/system_message_fetch.js` 會建立 `ws/Sys_Messages` 的 WebSocket 連線，收到訊息後：

- `JSON.parse(ev.data)` 並逐筆 `bus.emit('system_msg_updated', sysmessage)`

### REST API 模組

REST API 通常透過 `src/axios.js` 的 `axios.create({ baseURL: param.backend_host })` 呼叫，集中在 `src/api/*.js`：

- `VMSAPI.js`：車輛/任務/系統操作（大量 `api/VMS/*`、`api/System/*` 路徑）
- `MapAPI.js`：地圖資料下載、保存、tag/station 資料、路徑規劃
- `UserAPI.js`：登入（`api/User/Login`）與 localStorage
- 其他：Safety PLC、通知/音效、上傳、測試等（依 `src/api/` 內容擴充）

## 專案慣例與設計模式

- **DTO / ViewModel**：`src/ViewModels/` 以 class 表示後端資料結構（例如 `BatteryStatus.BatteryLevel`）。
  - 擴充/修改欄位時，請特別注意 **欄位名稱大小寫與後端序列化一致**（前後端需 lockstep）。
- **事件總線（mitt）**：`src/event-bus.js` 提供跨層級通知（SignalR/WS/元件間）。
- **多 store 實例**：此專案不是「單 store + modules」典型做法，而是以多個 `createStore()` 分域管理；擴充時請保持一致或先規劃重構策略。
- **版本號注入**：`vite.config.js` 會將 `package.json` 的 `version` 注入到 `import.meta.env.VITE_PACKAGE_VERSION`；UI 亦可能在 `UIStore` 內保留 UI 版本字串作 fallback。

## 功能地圖（按檔案/資料夾）

以下僅依檔案/資料夾命名歸類（避免臆測 UI 選單）：

- **主畫面/狀態總覽**：`src/views/HomeView.vue`、`src/components/AGVStatusOverview.vue`、`src/components/MainContent/*`
- **Version2 UI 框架**：`src/views/Version2/HomeView.vue`、`src/components/Version2/*`
- **控制/操作**：`src/components/Controller/*`、`src/components/Operator/*`、`src/components/Admin/*`
- **電池/充電**：`src/components/Battery/*`、`src/ViewModels/BatteryStatus.js`
- **E84 / 設備握手**：`src/components/E84/*`、`src/components/EQHandshakeConfiguration.vue`
- **Safety PLC**：`src/components/SaftyPLC/*`
- **任務/地圖/VMS**：`src/components/VMSTask/*`、`src/api/MapAPI.js`
- **TSMC HMI**：`src/views/TSMC/TsmcHmiView.vue`
- **相機/串流**：`src/Camera/*`（包含 `CamStreamWorker.js` 與相關顯示元件）
- **3D Model**：`src/components/3DModel/*`

## 擴充指南

### 新增頁面（View）與路由

1. 建立 view：`src/views/MyNewView.vue`
2. 在 `src/router/index.js` 加入 route（或掛到既有 children）
3. 若需保留狀態/快取，確認是否適合被 `App.vue` 的 `<keep-alive>` 包住（目前是對 router-view 的 component 做 keep-alive）

### 新增/擴充分域狀態（Vuex store）

本專案大量採用「新建 store 實例並 export」：

- 在 `src/store/index.js` 新增 `export const MyStore = createStore({...})`
- 在使用處 `import { MyStore } from '@/store'` 後 `MyStore.commit(...)` / `MyStore.dispatch(...)`

若你想讓元件使用 `useStore()`（Vuex injection），則需把該 store 也 `app.use(...)` 或改回單一 store + modules 的結構（屬於結構性調整，請先評估影響範圍）。

### 新增 SignalR 事件處理（FrontendHub）

1. 在 `src/AGVDataFetchWorker.js` 的 `StartHubConnection()` 內新增：
   - `HubConnection.on('YourEventName', (payload) => { ... })`
2. 依資料落點：
   - **要影響 UI 狀態**：commit 到對應 store（例如 `AGVStatusStore` / `UIStore`）
   - **要通知彈窗/提示**：透過 `bus.emit(...)`
3. 請與後端保持 lockstep：
   - event 名稱、payload 形狀、欄位大小寫（尤其 ViewModels class 內的欄位）

> 額外建議：目前前端使用 SignalR 預設協定（JSON）。若後端改為 MessagePack，需前端同步引入對應 protocol 並使用 `withHubProtocol(...)`（這不是目前程式碼既有功能）。

### 新增 REST API

1. 在 `src/api/` 新增或擴充 API 檔案（多數 pattern 為 `import axios_entity from '@/axios'`）
2. 將呼叫封裝成 `async function` 或 `export var XxxAPI = { ... }`
3. 在元件中直接 import 使用

## 建置與部署

- **build 輸出位置**：`vite.config.js` 的 `build.outDir` 預設為：
  - `../GPMVehicleControlSystem/GPMVehicleControlSystem/wwwroot`
  - 這表示本專案常見的整合方式是「前端 build 直接輸出到後端專案的靜態檔目錄」
- **資產命名**：build 會使用 `[hash]`（避免瀏覽器快取造成更新不生效）
- **要改成獨立部署**：請調整 `vite.config.js` 的 `build.outDir`，並確認後端反向代理/靜態檔路徑設定

## 相關專案

- `GPMVehicleControlSystem`（後端，包含 `FrontendHub` 與 REST API）

## 常見問題與排錯

### SignalR 連不上 / 無資料

- 確認 `src/gpm_param.js` 的 `backend_host` 是否指到正確機台（開發模式）
- 確認後端有啟動並暴露 `FrontendHub`：`${backend_host}/FrontendHub`
- 若分頁切到背景超過 10 秒，本專案會主動斷線並在回到前景後重連（見 `src/AGVDataFetchWorker.js`）

### REST API 回應失敗

`src/axios.js` 會在 response error 時提示 `請求 /{config.url}回應失敗`。請檢查：

- `backend_host`（同上）
- 後端 API 路徑是否變更（例如 `api/System/*`、`api/VMS/*`）
- CORS / 反向代理設定（若在跨網域開發）

### ROS Bridge 連不上

- `ros_bridge_url` 由 `backend_host` 推導並固定改成 `:9090`（ws/wss）。請確認 rosbridge 實際埠號/協定一致
- `src/api/WebRos.js` 有自動重連與定期健康檢查；可從 console log 判斷重連原因與次數

### 10 分鐘無操作自動登出/重整

`src/idling_detector.js` 在頁面可見時累積 600 秒無輸入會：

- `UserStore.dispatch('Logout')`
- `location.reload()`

若你在長時間監看畫面，請將此行為納入測試/驗證考量。

### 相機串流無畫面

`src/Camera/CamStreamWorker.js` 目前使用硬編碼連線：

- `http://192.168.0.105:5000/VideoStream`

若串流服務位址不同，需要調整此 URL（或改成由設定/參數注入）。

