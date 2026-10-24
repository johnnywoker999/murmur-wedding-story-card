/**
 * 默墨文創｜婚禮商單三份表單（同一個 Apps Script 專案，各別執行）
 *
 *   1) createWeddingStoryForm    → 婚禮故事採集卡（五幕／23 題）
 *   2) createPortraitConsentForm → 肖像使用授權書（AI 生成用）
 *   3) createRevisionPolicyForm  → 修改約定確認單
 *
 * 用法：
 *   1. 開 https://script.google.com/home → 新增專案
 *   2. 把本檔全部貼進 Code.gs，覆蓋原內容，存檔
 *   3. 上方函式下拉選要建的那一份 → 按「執行」→ 授權
 *   4. 「執行記錄」會印出：填寫連結、編輯連結、回覆試算表
 *
 * 條文數字集中在下面 CONFIG，改一處就好；重複執行只會多建新表單，不會動舊的。
 * 這不是法律文件產生器：它把條文做成可線上同意、有時間戳的表單，舉證力仍弱於親簽紙本。
 */

var CONFIG = {
  studio: '默墨文創',
  contact: '（請填製作方聯絡方式：Email 或 LINE ID）',

  // 肖像授權
  publishPlatforms: ['Instagram', 'Facebook', 'YouTube', '小紅書', '官網作品集', '婚禮相關媒體／投稿'],
  materialDeleteOptions: ['交付後 30 天內', '交付後 60 天內', '交付後 90 天內'],
  takedownOptions: ['7 天內', '14 天內', '30 天內'],

  // 修改約定
  copyRevisionOptions: ['1 次', '2 次（建議）', '3 次'],
  shotRetakeOptions: ['1 次', '2 次（建議）', '3 次'],
  previewRoundOptions: ['1 輪（建議）', '2 輪'],
  extraFeeHint: '例：1,500（單次加收，未稅）'
};

var PRIVACY_NOTICE =
  '【個人資料告知】\n' +
  '蒐集者：' + CONFIG.studio + '（' + CONFIG.contact + '）\n' +
  '蒐集目的：婚禮影片製作、素材管理、雙方權利義務之履行與證明。\n' +
  '蒐集之個人資料類別：姓名、聯絡方式、婚禮相關資訊、您主動提供之照片與文字。\n' +
  '利用期間：專案期間及依法令或契約保存所需期間。\n' +
  '利用地區：台灣及您同意公開之平台所在地。\n' +
  '利用對象與方式：僅 ' + CONFIG.studio + ' 於本專案範圍內使用；除您另行同意，不提供第三人。\n' +
  '您的權利：得請求查詢、閱覽、製給複製本、補充或更正、停止蒐集處理利用或刪除（請以書面或前述聯絡方式提出）。\n' +
  '不提供之影響：若不同意提供必要資料，恕無法進行影片製作。';

/* ── 共用工具 ───────────────────────────────── */

function _newForm(title, description, collectEmail) {
  var form = FormApp.create(title);
  form.setDescription(description);
  form.setProgressBar(true);
  form.setCollectEmail(!!collectEmail);
  return form;
}

function _attachSheet(form, title) {
  var ss = SpreadsheetApp.create(title + '｜回覆');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  return ss;
}

function _report(label, form, ss) {
  var out = [
    label + '：完成，三個網址請存下來。',
    '填寫連結（發給新人）：' + form.getPublishedUrl(),
    '編輯連結（自己改題目）：' + form.getEditUrl(),
    '回覆試算表：' + ss.getUrl(),
    '表單 ID：' + form.getId()
  ].join('\n');
  Logger.log(out);
  return out;
}

function _page(form, title, help) {
  var p = form.addPageBreakItem().setTitle(title);
  if (help) p.setHelpText(help);
  return p;
}

function _choice(form, title, values, opts) {
  opts = opts || {};
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setChoiceValues(values).setRequired(!!opts.required);
  if (opts.help) item.setHelpText(opts.help);
  if (opts.other !== false) item.showOtherOption(true);
  return item;
}

function _checks(form, title, values, opts) {
  opts = opts || {};
  var item = form.addCheckboxItem();
  item.setTitle(title).setChoiceValues(values).setRequired(!!opts.required);
  if (opts.help) item.setHelpText(opts.help);
  if (opts.other) item.showOtherOption(true);
  return item;
}

function _text(form, title, opts) {
  opts = opts || {};
  var item = form.addTextItem();
  item.setTitle(title).setRequired(!!opts.required);
  if (opts.help) item.setHelpText(opts.help);
  return item;
}

function _para(form, title, opts) {
  opts = opts || {};
  var item = form.addParagraphTextItem();
  item.setTitle(title).setRequired(!!opts.required);
  if (opts.help) item.setHelpText(opts.help);
  return item;
}

function _date(form, title, opts) {
  opts = opts || {};
  var item = form.addDateItem();
  item.setTitle(title).setRequired(!!opts.required);
  if (opts.help) item.setHelpText(opts.help);
  return item;
}


/* ─────────────────────────────────────────────
 * 1. 婚禮故事採集卡
 * ───────────────────────────────────────────── */
function createWeddingStoryForm() {
  var TITLE = CONFIG.studio + '｜婚禮故事採集卡';
  var form = _newForm(
    TITLE,
    '這份表單用來採集你們的真實故事，做成一支只屬於你們的婚禮影片。\n' +
    '共五幕：相識、相知、確認、相伴、承諾。大約 15 分鐘可以填完。\n\n' +
    '・只寫真實發生過的經歷。沒有、記不清或不想呈現的，選「其他」並說明。\n' +
    '・照片（兩人清晰正面合照或各自單人照、剛認識時／婚紗／試妝的照片）請透過 LINE 等方式直接傳給製作方。' +
    '自拍是廣角近距離，臉會比本人略寬，能再補一張別人拍的合照更好。\n' +
    '・不需要填手機號碼，這份表單不會公開，只有製作方看得到。\n\n' +
    PRIVACY_NOTICE,
    false
  );
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage(
    '收到了，謝謝你們。製作方會在 1–2 個工作天內整理成故事卡回傳給你們確認——' +
    '文案確認之後才會進入配音與分鏡。照片記得另外用 LINE 傳給製作方。'
  );

  _page(form, '第 0 部分 · 基本資訊', '以下皆為必填。');
  _choice(form, '1. 影片尺寸', ['寬螢幕 16:9（預設，現場大螢幕）', '直式 9:16（手機）'],
    { required: true, help: '寬螢幕用在現場大螢幕，直式用在手機觀看。' });
  _text(form, '2-1. 新郎在影片裡怎麼稱呼', { required: true, help: '例如：阿明。這是旁白會用到的名字。' });
  _text(form, '2-2. 新娘在影片裡怎麼稱呼', { required: true, help: '例如：小美。' });
  _choice(form, '4. 影片在哪個環節播放', ['儀式前暖場', '儀式中', '宴會開場'],
    { required: true, help: '決定結尾旁白怎麼收、配樂快慢：暖場留一步給儀式，儀式中直接落到誓言，宴會開場更輕快、可以帶一句給來賓。' });
  _choice(form, '5. 希望片長', ['90 秒（預設）', '180 秒'],
    { required: true, help: '先選希望的片長，五幕按故事輕重分配；具體鏡頭由後續完整旁白的實際節奏決定。' });
  _choice(form, '6. 畫風', ['寫實電影感', '水彩繪本', '紙藝摺紙', '黏土定格', '可愛 3D 動畫'],
    { required: true, help: '選了寫實電影感以外的畫風，第 6-2 題請說明兩人怎麼出現。' });
  _para(form, '6-2. 這個畫風裡，兩人怎麼出現', {
    required: false,
    help: '若第 6 題選了寫實電影感，這題可留空。\n「真人出鏡」：臉和身材按照片來，環境和質感是動畫。\n「純動畫」：兩人也畫成動畫形象。\n畫風選「其他」且是寫實的，請寫「寫實真人」。\n這一項直接決定生圖提示詞怎麼寫。'
  });

  _page(form, '第一幕 · 相識', '你們是怎麼認識的');
  _choice(form, '7. 選一個', ['校園同學', '同事', '朋友介紹', '網路認識', '旅行或活動偶遇', '青梅竹馬'], { required: true });
  _para(form, '8. 填一個：第一次見面在哪、什麼季節、誰先注意到誰？', { required: true, help: '例：大二圖書館門口的林蔭道，秋天，他先注意到她' });
  _para(form, '9. 加一個（選填）：那天有沒有一個你到現在還記得的小東西？', { required: false, help: '一本書、一杯飲料、一句話都可以。例：她抱著兩本書' });

  _page(form, '第二幕 · 相知', '是怎麼慢慢走近的');
  _choice(form, '10. 選一個', ['雨天共傘', '一起自習或加班', '一起吃飯', '深夜講電話', '一起旅行', '生病照顧', '一起煮飯'], { required: true });
  _para(form, '11. 填一個：對方做過的一件讓你心動的小事。', { required: true, help: '例：下雨天他的傘永遠偏向她，自己右肩總是濕的' });

  _page(form, '第三幕 · 確認', '怎麼在一起的，告白或求婚');
  _choice(form, '12. 選一個', ['畢業時決定一起走', '告白', '求婚', '遠距離重逢', '決定同行（搬家、換城市）'], { required: true });
  _para(form, '13. 填一個：在哪、誰開的口、說了什麼？', { required: true, help: '例：畢業那天教學樓前，他說以後的路一起走' });

  _page(form, '第四幕 · 相伴', '一起生活的日子');
  _choice(form, '14. 選一個', ['家中翻相簿', '佈置第一個家', '養寵物', '一起煮飯', '遠距離堅持', '共同事業', '一起熬過一件難事'], { required: true });
  _para(form, '15. 填一個：日常裡最「你們」的一個畫面。', { required: true, help: '例：週末傍晚窩在沙發翻老照片，笑到茶都涼了' });

  _page(form, '第五幕 · 承諾', '婚禮當天，影片怎麼收尾');
  _choice(form, '16. 婚禮在哪辦', ['戶外草坪或花園', '室內宴會廳', '中式庭院', '教堂', '海邊', '海外婚禮'],
    { required: true, help: '決定這一幕畫在什麼地方、什麼光線。' });
  _choice(form, '17. 結尾動作', ['牽手走遠', '回眸相笑', '擁抱', '交換戒指（只拍手，最穩）'], { required: true });
  _para(form, '18. 填一個：想對對方說的一句話', { required: true, help: '這句話會做成結尾旁白。例：這次，我就在你身邊' });

  _page(form, '加減項', '這裡的東西會直接變成畫面裡的物件、地點和旁白裡的一句話，是影片最像「你們」的部分。');
  _checks(form, '19. 想放進去的東西（可多選，細節請寫在「其他」）',
    ['寵物（名字寫在其他）', '一個有意義的地方', '一件有意義的物品', '一首歌', '一句你們常說的話'],
    { required: false, other: true });
  _para(form, '20. 不想出現的東西', { required: false, help: '例：不出現前任、不出現酒' });
  _para(form, '21. 五幕裡有沒有想換掉的一幕，換成什麼', { required: false, help: '例：第四幕換成和爸媽一起過年' });

  _page(form, '音樂', '只收不帶歌詞的純音樂——有歌詞會和旁白打架。');
  _choice(form, '22. 有沒有想用的純音樂', ['交給製作方客製'], {
    required: false,
    help: '有想用的話選「其他」，填 曲名／作者／連結。沒有合適的，製作方用音樂模型按影片情緒客製一首。'
  });

  _page(form, '備註');
  _para(form, '23. 注意事項、參考、想法', {
    required: true,
    help: '想要的畫面質感、參考的電影或照片、特別在意的地方、怕出錯的地方，都寫。寫得越具體，影片越像你們想的那樣。\n例：畫面想要日系電影那種朦朧、精緻的質感；旁白別太煽情；他不喜歡正面特寫'
  });

  return _report('婚禮故事採集卡', form, _attachSheet(form, TITLE));
}


/* ─────────────────────────────────────────────
 * 2. 肖像使用授權書
 * ───────────────────────────────────────────── */
function createPortraitConsentForm() {
  var TITLE = CONFIG.studio + '｜肖像使用授權書';
  var form = _newForm(
    TITLE,
    '本表單為「肖像使用授權書」的線上同意版。按下送出即視為簽署，系統會留下送出時間與帳號紀錄。\n\n' +
    '【授權條文】\n' +
    '一、授權人同意提供本人照片，供被授權人（' + CONFIG.studio + '）使用 AI 工具生成圖片與影片，用於製作授權人的婚禮微電影。\n' +
    '二、使用範圍依第 2 部分之勾選認定。\n' +
    '三、被授權人不得將照片與生成內容用於上述範圍以外的用途，亦不得轉交第三方。\n' +
    '四、專案交付後於第 3-1 題所載天數內，被授權人刪除原始照片及未使用之生成素材（雙方另有約定者除外）。\n' +
    '五、授權人得隨時以書面撤回公開發布之授權，被授權人應於第 3-2 題所載期限內下線相關內容。\n\n' +
    PRIVACY_NOTICE,
    true
  );
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage(
    '已收到授權，謝謝你們。這份紀錄已存檔（含送出時間與帳號），需要副本請跟製作方索取。\n' +
    '照片原檔請透過 LINE 等方式傳給製作方。'
  );

  _page(form, '第 1 部分 · 雙方與專案');
  _text(form, '1-1. 授權人（新郎）姓名', { required: true });
  _text(form, '1-2. 授權人（新娘）姓名', { required: true });
  _text(form, '1-3. 聯絡方式（Email 或 LINE ID）', { required: true, help: '作為撤回授權、後續通知的送達方式。' });
  _date(form, '1-4. 婚禮日期', { required: false, help: '用於標示本授權所對應的專案。' });
  _text(form, '1-5. 專案名稱／訂單編號', { required: false, help: '例：2026-12-06 林陳婚禮。不確定可留空。' });

  _page(form, '第 2 部分 · 使用範圍（授權條文第二條）',
    '請擇一勾選。公開與否是兩件事：可以只播給你們看，不代表同意公開。');
  _choice(form, '2-1. 授權範圍', [
    '僅用於婚禮現場播放及授權人自己留存',
    '同意被授權人公開發布部分片段',
    '不同意任何公開發布'
  ], { required: true, other: false });
  _checks(form, '2-2. 若同意公開發布，可發布的平台', CONFIG.publishPlatforms, {
    required: false, other: true,
    help: '僅在第 2-1 題選「同意公開發布部分片段」時填寫；其餘情況可留空。'
  });
  _choice(form, '2-3. 公開片段是否打碼', ['不需打碼', '臉部打模糊／馬賽克', '只露局部（手、背影、側臉）', '僅本人審稿後才可發布'], {
    required: false, other: true,
    help: '「僅本人審稿後才可發布」＝每次發布前都需另行取得同意，最保守。'
  });

  _page(form, '第 3 部分 · 素材處理與撤回（授權條文第三至五條）');
  _choice(form, '3-1. 原始照片與未使用素材的刪除期限', CONFIG.materialDeleteOptions, {
    required: true, other: true,
    help: '自專案交付日起算。若作品集需要留存備份，請另以文字約定，否則依此期限刪除。'
  });
  _choice(form, '3-2. 撤回公開發布授權後的下線期限', CONFIG.takedownOptions, { required: true, other: true });
  _checks(form, '3-3. 請確認以下事項', [
    '我了解授權的素材僅用於本專案，不得轉交第三方',
    '我了解被授權人不得將照片與生成內容用於約定範圍以外的用途',
    '我了解可隨時書面撤回公開發布授權；撤回後已播放或已交付之私人副本不在此限'
  ], { required: true, other: false });

  _page(form, '第 4 部分 · 簽署',
    '輸入姓名即視為簽名。送出後不可再修改，如需更正請聯絡製作方重簽。');
  _text(form, '4-1. 授權人（新郎）簽名', { required: true, help: '請輸入本名。' });
  _text(form, '4-2. 授權人（新娘）簽名', { required: true, help: '請輸入本名。' });
  _date(form, '4-3. 簽署日期', { required: true });
  _choice(form, '4-4. 我已詳細閱讀並同意上述全部條款', ['我同意', '不同意（請勿送出，直接聯繫製作方）'], { required: true, other: false });
  _text(form, '4-5. 製作方代表簽名', { required: true, help: CONFIG.studio + ' 代表簽署，雙方各留一份。' });

  return _report('肖像使用授權書', form, _attachSheet(form, TITLE));
}


/* ─────────────────────────────────────────────
 * 3. 修改約定確認單
 * ───────────────────────────────────────────── */
function createRevisionPolicyForm() {
  var TITLE = CONFIG.studio + '｜修改約定確認單';
  var form = _newForm(
    TITLE,
    '本表單為「修改約定」的線上確認版，按下送出即視為雙方同意以下約定，系統會留下送出時間與帳號紀錄。\n\n' +
    '【約定條文】\n' +
    '一、文案階段：免費修改次數依第 2-1 題所載。新人確認文案後，才開始配音與畫面製作。\n' +
    '二、畫面階段：單個鏡頭不滿意，免費重做次數依第 2-2 題所載。\n' +
    '三、預覽階段：免費提一輪統一修改意見，請寫清楚第幾秒、哪個鏡頭。\n' +
    '四、文案確認後又要改內容，或超出上述次數的修改，每次加收金額依第 2-4 題所載。\n' +
    '五、因新人延遲提供資料或確認，交付日期順延。\n\n' +
    '先講清楚不是刁難，是讓交付日可預期：寫下來就能照著做，不會到最後一刻才爭執。\n\n' +
    PRIVACY_NOTICE,
    true
  );
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage(
    '已收到，修改約定成立，這份紀錄已存檔（含送出時間與帳號）。\n' +
    '接下來請把故事採集卡填完，我們就從文案開始。'
  );

  _page(form, '第 1 部分 · 雙方與專案');
  _text(form, '1-1. 新人姓名（新郎／新娘）', { required: true, help: '例：阿明 / 小美' });
  _text(form, '1-2. 專案名稱／訂單編號', { required: true, help: '例：2026-12-06 林陳婚禮' });
  _date(form, '1-3. 約定預計交付日', { required: false, help: '實際日期以雙方最後確認之排程為準。' });
  _text(form, '1-4. 聯絡方式（Email 或 LINE ID）', { required: true });

  _page(form, '第 2 部分 · 修改次數與費用（約定條文第一至四條）');
  _choice(form, '2-1. 文案階段免費修改次數', CONFIG.copyRevisionOptions, {
    required: true, other: false,
    help: '每次修改以「整份文案為一輪」計算。文案確認後才進配音與畫面。'
  });
  _choice(form, '2-2. 畫面階段單鏡頭免費重做次數', CONFIG.shotRetakeOptions, {
    required: true, other: false,
    help: '以單一鏡頭為單位計算；若改動鏡頭內容，視為文案變更，依第 2-4 題處理。'
  });
  _choice(form, '2-3. 預覽階段免費統一修改意見輪數', CONFIG.previewRoundOptions, {
    required: true, other: false,
    help: '一輪＝完整看完後提出的統一意見，請標明第幾秒、哪個鏡頭。零散多次提出視為多輪。'
  });
  _text(form, '2-4. 超出次數／文案確認後改內容，每次加收金額', {
    required: true,
    help: CONFIG.extraFeeHint + '。填入本次雙方議定的單次金額。'
  });
  _choice(form, '2-5. 文案確認後要求變更內容的處理方式', [
    '依 2-4 加收標準計費後執行',
    '重新報價，另立工期',
    '該項變更不做，維持已確認版本'
  ], { required: true, other: true });

  _page(form, '第 3 部分 · 時程與其他');
  _checks(form, '3-1. 請確認以下事項', [
    '我了解因我方延遲提供資料或確認，交付日期順延',
    '我了解預覽階段的意見需標明第幾秒、哪個鏡頭，否則難以執行',
    '我了解超出免費次數或文案確認後改內容，將依第 2-4 題計費'
  ], { required: true, other: false });
  _para(form, '3-2. 其他約定事項', { required: false, help: '雙方另行議定的事項寫在這裡，例如急件費、指定音樂授權費。' });

  _page(form, '第 4 部分 · 簽署', '輸入姓名即視為簽名。送出後不可再修改，如需更正請聯絡製作方重簽。');
  _text(form, '4-1. 新人（新郎）簽名', { required: true, help: '請輸入本名。' });
  _text(form, '4-2. 新人（新娘）簽名', { required: true, help: '請輸入本名。' });
  _date(form, '4-3. 簽署日期', { required: true });
  _choice(form, '4-4. 我們已閱讀並同意上述修改約定', ['我同意', '不同意（請勿送出，直接聯繫製作方）'], { required: true, other: false });
  _text(form, '4-5. 製作方代表簽名', { required: true, help: CONFIG.studio + ' 代表簽署，雙方各留一份。' });

  return _report('修改約定確認單', form, _attachSheet(form, TITLE));
}
