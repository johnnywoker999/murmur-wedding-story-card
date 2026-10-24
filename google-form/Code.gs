/**
 * 默墨文創｜婚禮故事採集卡 → Google 表單
 *
 * 用法（一次性，約 2 分鐘）：
 *   1. 開 https://script.google.com/home → 新增專案
 *   2. 把這個檔案全部貼進 Code.gs，覆蓋原本內容
 *   3. 上方函式選單選 createWeddingStoryForm → 按「執行」
 *   4. 首次會要授權（用同一個 Google 帳號）→ 允許
 *   5. 下方「執行記錄」會印出三個網址：填寫連結、編輯連結、回覆試算表
 *
 * 內容與 github.com/johnnywoker999/murmur-wedding-story-card 的繁中卡一致（23 題、五幕）。
 * 重複執行會建出另一份新表單，不會覆蓋舊的。
 */
function createWeddingStoryForm() {
  var BRAND = '默墨文創';
  var TITLE = BRAND + '｜婚禮故事採集卡';

  var form = FormApp.create(TITLE);
  form.setDescription(
    '這份表單用來採集你們的真實故事，做成一支只屬於你們的婚禮影片。\n' +
    '共五幕：相識、相知、確認、相伴、承諾。大約 15 分鐘可以填完。\n\n' +
    '・只寫真實發生過的經歷。沒有、記不清或不想呈現的，選「其他」並說明。\n' +
    '・照片（兩人清晰正面合照或各自單人照、剛認識時／婚紗／試妝的照片）請透過 LINE 等方式直接傳給製作方，' +
    '自拍是廣角近距離，臉會比本人略寬，能再補一張別人拍的合照更好。\n' +
    '・不需要填手機號碼，這份表單不會公開，只有製作方看得到。'
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage(
    '收到了，謝謝你們。製作方會在 1–2 個工作天內整理成故事卡，回傳給你們確認——' +
    '文案確認之後才會進入配音與分鏡。照片記得另外用 LINE 傳給製作方。'
  );

  // ── 第 0 部分：基本資訊 ─────────────────────────────
  form.addPageBreakItem()
    .setTitle('第 0 部分 · 基本資訊')
    .setHelpText('以下皆為必填。');

  var q1 = form.addMultipleChoiceItem();
  q1.setTitle('1. 影片尺寸')
    .setHelpText('寬螢幕用在現場大螢幕，直式用在手機觀看。')
    .setChoiceValues(['寬螢幕 16:9（預設，現場大螢幕）', '直式 9:16（手機）'])
    .showOtherOption(true)
    .setRequired(true);

  form.addTextItem()
    .setTitle('2-1. 新郎在影片裡怎麼稱呼')
    .setHelpText('例如：阿明。這是旁白會用到的名字。')
    .setRequired(true);

  form.addTextItem()
    .setTitle('2-2. 新娘在影片裡怎麼稱呼')
    .setHelpText('例如：小美。')
    .setRequired(true);

  var q4 = form.addMultipleChoiceItem();
  q4.setTitle('4. 影片在哪個環節播放')
    .setHelpText('決定結尾旁白怎麼收、配樂快慢：暖場留一步給儀式，儀式中直接落到誓言，宴會開場更輕快、可以帶一句給來賓。')
    .setChoiceValues(['儀式前暖場', '儀式中', '宴會開場'])
    .showOtherOption(true)
    .setRequired(true);

  var q5 = form.addMultipleChoiceItem();
  q5.setTitle('5. 希望片長')
    .setHelpText('先選希望的片長，五幕按故事輕重分配；具體鏡頭由後續完整旁白的實際節奏決定。')
    .setChoiceValues(['90 秒（預設）', '180 秒'])
    .showOtherOption(true)
    .setRequired(true);

  var q6 = form.addMultipleChoiceItem();
  q6.setTitle('6. 畫風')
    .setHelpText('選了寫實電影感以外的畫風，第 6-2 題請說明兩人怎麼出現。')
    .setChoiceValues(['寫實電影感', '水彩繪本', '紙藝摺紙', '黏土定格', '可愛 3D 動畫'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('6-2. 這個畫風裡，兩人怎麼出現')
    .setHelpText(
      '若第 6 題選了寫實電影感，這題可留空。\n' +
      '「真人出鏡」：臉和身材按照片來，環境和質感是動畫。\n' +
      '「純動畫」：兩人也畫成動畫形象。\n' +
      '畫風選「其他」且是寫實的，請寫「寫實真人」。\n' +
      '這一項直接決定生圖提示詞怎麼寫。'
    )
    .setRequired(false);

  // ── 第一幕 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('第一幕 · 相識')
    .setHelpText('你們是怎麼認識的');

  var q7 = form.addMultipleChoiceItem();
  q7.setTitle('7. 選一個')
    .setChoiceValues(['校園同學', '同事', '朋友介紹', '網路認識', '旅行或活動偶遇', '青梅竹馬'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('8. 填一個：第一次見面在哪、什麼季節、誰先注意到誰？')
    .setHelpText('例：大二圖書館門口的林蔭道，秋天，他先注意到她')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('9. 加一個（選填）：那天有沒有一個你到現在還記得的小東西？')
    .setHelpText('一本書、一杯飲料、一句話都可以。例：她抱著兩本書')
    .setRequired(false);

  // ── 第二幕 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('第二幕 · 相知')
    .setHelpText('是怎麼慢慢走近的');

  var q10 = form.addMultipleChoiceItem();
  q10.setTitle('10. 選一個')
    .setChoiceValues(['雨天共傘', '一起自習或加班', '一起吃飯', '深夜講電話', '一起旅行', '生病照顧', '一起煮飯'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('11. 填一個：對方做過的一件讓你心動的小事。')
    .setHelpText('例：下雨天他的傘永遠偏向她，自己右肩總是濕的')
    .setRequired(true);

  // ── 第三幕 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('第三幕 · 確認')
    .setHelpText('怎麼在一起的，告白或求婚');

  var q12 = form.addMultipleChoiceItem();
  q12.setTitle('12. 選一個')
    .setChoiceValues(['畢業時決定一起走', '告白', '求婚', '遠距離重逢', '決定同行（搬家、換城市）'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('13. 填一個：在哪、誰開的口、說了什麼？')
    .setHelpText('例：畢業那天教學樓前，他說以後的路一起走')
    .setRequired(true);

  // ── 第四幕 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('第四幕 · 相伴')
    .setHelpText('一起生活的日子');

  var q14 = form.addMultipleChoiceItem();
  q14.setTitle('14. 選一個')
    .setChoiceValues(['家中翻相簿', '佈置第一個家', '養寵物', '一起煮飯', '遠距離堅持', '共同事業', '一起熬過一件難事'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('15. 填一個：日常裡最「你們」的一個畫面。')
    .setHelpText('例：週末傍晚窩在沙發翻老照片，笑到茶都涼了')
    .setRequired(true);

  // ── 第五幕 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('第五幕 · 承諾')
    .setHelpText('婚禮當天，影片怎麼收尾');

  var q16 = form.addMultipleChoiceItem();
  q16.setTitle('16. 婚禮在哪辦')
    .setHelpText('決定這一幕畫在什麼地方、什麼光線。')
    .setChoiceValues(['戶外草坪或花園', '室內宴會廳', '中式庭院', '教堂', '海邊', '海外婚禮'])
    .showOtherOption(true)
    .setRequired(true);

  var q17 = form.addMultipleChoiceItem();
  q17.setTitle('17. 結尾動作')
    .setChoiceValues(['牽手走遠', '回眸相笑', '擁抱', '交換戒指（只拍手，最穩）'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('18. 填一個：想對對方說的一句話')
    .setHelpText('這句話會做成結尾旁白。例：這次，我就在你身邊')
    .setRequired(true);

  // ── 加減項 ────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('加減項')
    .setHelpText('這裡的東西會直接變成畫面裡的物件、地點和旁白裡的一句話，是影片最像「你們」的部分。');

  var adds = form.addCheckboxItem();
  adds.setTitle('19. 想放進去的東西（可多選，選了請在「其他」寫細節）')
    .setChoiceValues(['寵物（名字寫在其他）', '一個有意義的地方', '一件有意義的物品', '一首歌', '一句你們常說的話'])
    .showOtherOption(true)
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('20. 不想出現的東西')
    .setHelpText('例：不出現前任、不出現酒')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('21. 五幕裡有沒有想換掉的一幕，換成什麼')
    .setHelpText('例：第四幕換成和爸媽一起過年')
    .setRequired(false);

  // ── 音樂 ──────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('音樂')
    .setHelpText('只收不帶歌詞的純音樂——有歌詞會和旁白打架。');

  var q22 = form.addMultipleChoiceItem();
  q22.setTitle('22. 有沒有想用的純音樂')
    .setChoiceValues(['交給製作方客製'])
    .showOtherOption(true)
    .setHelpText('有想用的話選「其他」，填 曲名／作者／連結。沒有合適的，製作方用音樂模型按影片情緒客製一首。')
    .setRequired(false);

  // ── 備註 ──────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle('備註');

  form.addParagraphTextItem()
    .setTitle('23. 注意事項、參考、想法')
    .setHelpText(
      '想要的畫面質感、參考的電影或照片、特別在意的地方、怕出錯的地方，都寫。寫得越具體，影片越像你們想的那樣。\n' +
      '例：畫面想要日系電影那種朦朧、精緻的質感；旁白別太煽情；他不喜歡正面特寫'
    )
    .setRequired(true);

  // ── 回覆試算表 ────────────────────────────────────
  var ss = SpreadsheetApp.create(TITLE + '｜回覆');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  var report = [
    '完成。三個網址請存下來：',
    '填寫連結（發給新人）：' + form.getPublishedUrl(),
    '編輯連結（自己改題目）：' + form.getEditUrl(),
    '回覆試算表：' + ss.getUrl(),
    '表單 ID：' + form.getId()
  ].join('\n');

  Logger.log(report);
  return report;
}
