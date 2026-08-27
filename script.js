// ==========================================================
// 상태 변수
// ==========================================================
let playerMoney = 1000;
let playerInventory = [];
let eventLogsData = [];
let memorialList = [];

let isPlaying = false;
let playbackTimer = null;
let autoRoutineInterval = null;
let isAutoRoutineOn = false;

let currentQuest = null;
let worldDay = 1;
let nextEventCardDay = 0; // 3~7일 간격으로 무작위 사건 카드 발생
const maxCharacters = 6;

// 실제 시간 경과 시뮬레이션 설정 (현실 3시간 = 세계 1일, 한 번에 최대 7일치까지만 처리)
const REAL_MS_PER_SIM_DAY = 3 * 60 * 60 * 1000;
const MAX_OFFLINE_CATCHUP_DAYS = 7;

// ==========================================================
// 데이터 정의
// ==========================================================

// 아이템 DB (식량/의약/탈것/공구/특수 아이템 + 고장난 탈것)
const itemDatabase = {
  "비상식량": { emoji: "🥫", desc: "오랫동안 보관할 수 있는 통조림 식량.", type: "food", effect: 30, price: 50 },
  "정수 물병": { emoji: "💧", desc: "깨끗하게 정수된 마실 물.", type: "food", effect: 20, price: 30 },
  "휴대용 음료": { emoji: "🧃", desc: "달콤하고 갈증을 해소해주는 음료수.", type: "food", effect: 20, price: 30 },
  "그림자빵": { emoji: "🍞", desc: "말린 그림자고기, 건과일, 건견과류가 촘촘히 박힌 단빵.", type: "food", effect: 50, price: 70 },
  "그림자육포": { emoji: "🍖", desc: "그림자 고기를 얇게 저며 햇빛에 말렸다.", type: "food", effect: 45, price: 80 },
  "단백질바": { emoji: "🍫", desc: "열량이 높아 열악한 환경에서 유용하다.", type: "food", effect: 35, price: 40 },
  "주스사탕": { emoji: "🍬", desc: "둥근 사탕 가운데에 과일주스가 들어있다.", type: "food", effect: 15, price: 20 },
  "정제 소금": { emoji: "🧂", desc: "음식 맛을 내거나 염분을 보충한다.", type: "food", effect: 10, price: 25 },
  "소독액": { emoji: "🧴", desc: "상처 부위를 소독하는 용액.", type: "med", effect: 20, price: 40 },
  "응급 붕대": { emoji: "🩹", desc: "지혈과 지지 작용을 하는 지성 붕대.", type: "med", effect: 30, price: 50 },
  "응급 약품": { emoji: "💊", desc: "기본적인 생존용 의약품 키트.", type: "med", effect: 50, price: 100 },
  "정체불명의 회복제": { emoji: "🧪", desc: "알 수 없는 성분의 강력한 액체.", type: "med", effect: 75, price: 150 },
  "응급 약초 묶음": { emoji: "🌿", desc: "황야에서 자라나는 치료용 민간 약초.", type: "med", effect: 35, price: 45 },

  "자전거": { emoji: "🚲", desc: "가방 소지 시 탐험 피로도 소모가 줄어든다.", type: "vehicle", price: 300 },
  "자동차": { emoji: "🚗", desc: "가방 소지 시 탐험 피로도 소모가 크게 줄고 보상 확률이 늘어난다.", type: "vehicle", price: 800 },
  "고장난 자전거": { emoji: "🚲💥", desc: "체인이 끊기고 바퀴가 휜 자전거. [수리 공구함]으로 고칠 수 있을 듯하다.", type: "broken", price: 0, repairsTo: "자전거", repairCost: ["수리 공구함"] },
  "고장난 자동차": { emoji: "🚗💥", desc: "시동이 걸리지 않는 낡은 자동차. 공구와 부품이 다량 필요해 보인다.", type: "broken", price: 0, repairsTo: "자동차", repairCost: ["수리 공구함", "범용 부품", "범용 부품"] },

  "그림자 고기": { emoji: "🍢", desc: "그림자의 사체에서 얻은 고기. 해독 과정을 거치면 먹을 수 있다고 한다.", type: "food", effect: 40, price: 60 },
  "그림자 핵": { emoji: "🔮", desc: "그림자에게서 추출한 핵. 은은하게 빛나며 금전적 가치가 있다.", type: "special", price: 300 },

  "야전 배낭": { emoji: "🎒", desc: "더 많은 물품을 지니고 다닐 수 있는 단단한 가방.", type: "gear", price: 200 },
  "나침반": { emoji: "🧭", desc: "길을 잃지 않게 도와준다.", type: "gear", price: 120 },
  "지도": { emoji: "🗺️", desc: "주변 안전지대 및 지형이 기록되어 있다.", type: "gear", price: 100 },

  "수리 공구함": { emoji: "🧰", desc: "정밀 수리에 필요한 연장 모음.", type: "tool", price: 150 },
  "범용 부품": { emoji: "🔧", desc: "다양한 곳에 쓰이는 표준 조립 기어.", type: "tool", price: 50 },
  "잡부품 상자": { emoji: "🔩", desc: "각종 볼트와 나사가 섞여 있다.", type: "tool", price: 40 },
  "임시 수리 키트": { emoji: "🛠️", desc: "급한 대로 손질할 수 있는 연장.", type: "tool", price: 90 },
  "예비 배터리": { emoji: "🔋", desc: "전자기기를 구동하는 충전지.", type: "etc", price: 60 },
  "휴대용 조명": { emoji: "🔦", desc: "어둠 속을 밝히는 후래쉬.", type: "etc", price: 55 },
  "비상용 초": { emoji: "🕯️", desc: "은은한 빛을 내는 초.", type: "etc", price: 15 },
  "점화 도구": { emoji: "🔥", desc: "불을 붙이기 쉽다.", type: "etc", price: 30 },
  "다용도 로프": { emoji: "🪢", desc: "질긴 밧줄.", type: "etc", price: 45 },
  "보호 장갑": { emoji: "🧤", desc: "손을 보호하는 두꺼운 장갑.", type: "etc", price: 35 },
  "보호 고글": { emoji: "🥽", desc: "눈에 먼지나 산성이 들어가지 않게 막는다.", type: "etc", price: 50 },
  "방진 마스크": { emoji: "😷", desc: "황사나 유해 물질을 걸러낸다.", type: "etc", price: 40 },
  "방수 외투": { emoji: "🧥", desc: "비나 유해 액체를 튕겨낸다.", type: "etc", price: 120 },
  "다용도 장화": { emoji: "👢", desc: "진흙이나 위험 지형을 밟아도 안전하다.", type: "etc", price: 85 },
  "무전기": { emoji: "📻", desc: "멀리 떨어진 곳과 신호를 주고받는다.", type: "etc", price: 180 },
  "일기장": { emoji: "📓", desc: "개인적인 기록을 남길 수 있다.", type: "etc", price: 20 },
  "필기구": { emoji: "✏️", desc: "글씨를 쓸 수 있는 연필과 펜.", type: "etc", price: 10 },
  "위치 신호기": { emoji: "📡", desc: "자신의 좌표를 송신한다.", type: "etc", price: 220 },
  "통행 허가증": { emoji: "🪪", desc: "특정 검문소를 통과할 수 있다.", type: "etc", price: 300 },
  "만능열쇠": { emoji: "🔑", desc: "낡은 자물쇠를 열 때 쓰인다.", type: "etc", price: 150 },
  "정밀 드라이버": { emoji: "🪛", desc: "시계나 정밀 기기를 분해한다.", type: "etc", price: 65 },
  "소형 자석": { emoji: "🧲", desc: "쇠붙이를 끌어당긴다.", type: "etc", price: 25 },
  "간이 분석 키트": { emoji: "🧪", desc: "성분을 간단히 조사한다.", type: "etc", price: 110 },
  "시료 보관병": { emoji: "🧫", desc: "체액이나 시료를 담아둔다.", type: "etc", price: 45 },
  "이능력 분석 시약": { emoji: "🧬", desc: "특이 파동을 측정하는 약품.", type: "etc", price: 250 },
  "보급품 상자": { emoji: "📦", desc: "무엇이 들어있는지 모르는 밀봉 상자.", type: "etc", price: 130 },
  "정화석": { emoji: "🪨", desc: "오염을 완화해주는 신비한 돌.", type: "special", price: 200 },
  "괴물 뼈 조각": { emoji: "🦴", desc: "단단한 괴물의 유해 조각.", type: "special", price: 90 },
  "미확인 분말": { emoji: "🫙", desc: "출처를 알 수 없는 가루.", type: "special", price: 70 },
  "이능력 잔여 결정": { emoji: "💎", desc: "은은한 빛을 내뿜는 결정체.", type: "special", price: 400 },
  "보호 부적": { emoji: "🧿", desc: "액운을 막아준다고 믿어지는 부적.", type: "special", price: 80 },
  "희귀 생물의 깃털": { emoji: "🪶", desc: "매우 고가에 거래되는 깃털.", type: "special", price: 350 },
  "휴대용 소화기": { emoji: "🧯", desc: "갑작스러운 화재를 진화한다.", type: "etc", price: 95 },
  "구식 황야 통행문서": { emoji: "📜", desc: "오래된 문서이지만 유효할지도 모른다.", type: "special", price: 160 }
};

// 도시 및 마을 의뢰 템플릿
const questTemplates = [
  { title: "황야 자원 수집", desc: "야외 탐험을 진행하여 생존 물자를 확보하세요.", reward: 200, type: "adventure" },
  { title: "부품 조달 의뢰", desc: "탐험을 통해 쓸만한 부품과 공구를 모아 전달하세요.", reward: 260, type: "adventure" },
  { title: "안전지대 순찰 보고", desc: "나들이를 나가 주변 동향을 살피고 보고하세요.", reward: 150, type: "outing" },
  { title: "상점 물자 구매 대행", desc: "시가지 상점에 들러 필요한 물자를 사서 전달하세요.", reward: 180, type: "outing" },
  { title: "소식지 정독 임무", desc: "오늘의 소식을 확인하고 정보를 정리해 전달하세요.", reward: 120, type: "news" }
];

const zodiacData = {
  "양자리": { mbti: ["ESTP", "ENTJ"], food: ["육식", "간식"] },
  "황소자리": { mbti: ["ISFJ", "ISTJ"], food: ["견과", "곡물"] },
  "쌍둥이자리": { mbti: ["ENTP", "ENFP"], food: ["간식", "과일"] },
  "게자리": { mbti: ["ISFP", "ESFJ"], food: ["어식", "채식"] },
  "사자자리": { mbti: ["ESFP", "ENFJ"], food: ["육식", "과일"] },
  "처녀자리": { mbti: ["INTJ", "ISTP"], food: ["간식", "곡물", "채식"] },
  "천칭자리": { mbti: ["ENFJ", "ESFP"], food: ["과일", "간식"] },
  "전갈자리": { mbti: ["INFJ", "INTJ"], food: ["어식", "견과"] },
  "사수자리": { mbti: ["ENFP", "ENTP"], food: ["간식", "육식"] },
  "염소자리": { mbti: ["ESTJ", "ISTJ"], food: ["육식", "곡물"] },
  "물병자리": { mbti: ["INTP", "ENTP"], food: ["과일", "간식"] },
  "물고기자리": { mbti: ["INFP", "ISFP"], food: ["어식", "채식"] }
};

// 성격 일반화 문구를 뺀 출신 국가 정보 (환경/문화만 표기)
const nationData = {
  "북쪽": "설원/수렵 씨족",
  "남쪽": "해안/상업",
  "동쪽": "연금술/기술",
  "서쪽": "고원/석조"
};

const bloodTypes = ["A", "B", "O", "AB"];
const zodiacKeys = Object.keys(zodiacData);
const nationKeys = Object.keys(nationData);
const sampleNames = ["철수", "영희", "민수", "지은", "서준", "하은", "도윤", "서윤"];
const speciesList = ["인간", "괴물", "혼혈"];
const lifeStagesList = ["어린이", "청소년", "청년", "중년", "노년"];
const relationList = ["지인", "부모", "자식", "보호자와 피보호자", "형제자매", "친척", "연인", "친구", "동료", "은인", "원수", "경쟁자", "전 연인", "전 배우자"];

// 관계 지정 시 상대방에게 자동으로 부여되는 반대(상호) 관계
const relationInverseMap = {
  "지인": "지인", "부모": "자식", "자식": "부모",
  "보호자와 피보호자": "보호자와 피보호자", "형제자매": "형제자매", "친척": "친척",
  "연인": "연인", "친구": "친구", "동료": "동료", "은인": "은인",
  "원수": "원수", "경쟁자": "경쟁자", "전 연인": "전 연인", "전 배우자": "전 배우자"
};

const traitPool = [
  "생활력", "도축과 손질", "응급 처치", "폐품 감정", "약초 식별", "길 찾기", "부품 재활용",
  "먹보", "미식가", "잠의 달인", "침착함", "희망의 소리", "불길한 직감", "동물과의 교감"
];

const globalFoodList = {
  "육식": ["숯불 갈비", "통삼겹 바비큐", "한우 등심", "갈비찜", "후라이드 치킨", "제육볶음"],
  "곡물": ["설렁탕", "육개장", "칼국수", "전주 비빔밥", "된장찌개", "쌀국수"],
  "어식": ["모둠 초밥", "고등어구이", "간장게장", "낙지볶음", "연어초밥"],
  "채식": ["도토리묵 무침", "순두부 찌개", "그릭 샐러드", "마르가리타 피자"],
  "간식": ["떡볶이와 튀김", "호떡", "타코야키", "크루아상", "햄버거"],
  "과일": ["과일빙수", "매실차", "유자차", "화이트와인"]
};

const worldMediaList = [
  "초능력 사회 신문", "황야 생활백서", "영웅 길드 사보",
  "악당 협회 회보", "그림자 연구소 논문 초록",
  "아카데미 기숙사 벌점 사례집", "인간과 괴물, 모두의 생활 정보 잡지"
];

const conflictPhrases = [
  "사회 문제에 대한 의견이 달라 이야기를 나누다 다투었습니다.",
  "서로 다른 가치관을 두고 의견을 주고받았습니다.",
  "특정 사안에 대한 의견 차이를 좁히지 못했습니다.",
  "사소한 문제로 말다툼을 했습니다.",
  "서로의 행동을 두고 언쟁을 벌였습니다.",
  "서로 양보하지 않아 대화가 길어졌습니다.",
  "별것 아닌 일로 다투었습니다.",
  "대화가 원만하게 끝나지 않았습니다."
];

const peacefulPhrases = [
  "함께 맛있는 식사를 했습니다.",
  "오랜 시간 이야기를 나누었습니다.",
  "서로의 근황을 이야기했습니다.",
  "도움을 주었습니다.",
  "작은 선물을 건네며 인사를 나눴습니다.",
  "이전의 갈등에 대해 이야기를 나누었습니다.",
  "서로의 입장을 확인한 뒤 화해했습니다."
];

const relationChangePhrases = [
  "가까워졌습니다.",
  "서로에게 조금 더 친밀해졌습니다.",
  "친구가 되었습니다.",
  "경쟁 관계가 되었습니다.",
  "사이가 멀어졌습니다.",
  "한동안 서로를 피했습니다.",
  "더 이상 친구/부부/연인으로 지내지 않기로 했습니다."
];

const adventureTemplates = [
  (name, weather) => `오늘의 날씨는 ${weather}. ${name}는 구역을 탐색했다.`,
  (name) => `${name}는 폐건물 내부를 꼼꼼히 확인했다.`,
  (name) => `${name}는 통행이 끊긴 도로를 우회했다.`,
  (name) => `${name}는 버려진 야전 기지를 확인했다.`,
  (name) => `${name}는 고장난 장비에서 사용할 수 있는 부품을 분리했다.`
];

// ==========================================================
// 날짜(하루 경과) — 탐험/나들이를 직접 진행할 때마다 하루가 흐른다
// ==========================================================
function advanceDay() {
  worldDay++;
  addLog(`[날짜] ${worldDay}일째 아침이 밝았다.`);
  updateDayDisplay();
  checkEventCard();
}

// 3~7일 간격으로 무작위 사건 카드가 발생한다 (담담한 관찰형 톤 유지, 즉각적 위험은 소소하게)
function checkEventCard() {
  if (nextEventCardDay <= 0) {
    nextEventCardDay = worldDay + Math.floor(Math.random() * 5) + 3;
    return;
  }
  if (worldDay < nextEventCardDay) return;

  let chars = JSON.parse(localStorage.getItem("characters")) || [];
  if (chars.length === 0 || !chars.some(c => c.name)) {
    nextEventCardDay = worldDay + Math.floor(Math.random() * 5) + 3;
    return;
  }

  const eventCards = [
    () => {
      const pool = Object.keys(itemDatabase).filter(k => itemDatabase[k].type !== "broken" && itemDatabase[k].type !== "vehicle");
      const item = pool[Math.floor(Math.random() * pool.length)];
      playerInventory.push(item);
      return `🎴 [사건] 안전지대 입구에 낯선 보급 상자가 놓여 있었다. 안에는 <b>[${getItemDisplayString(item)}]</b>이 들어 있었다.`;
    },
    () => `🎴 [사건] 낡은 라디오에서 잡음 섞인 신호가 잠시 잡혔다가 이내 사라졌다.`,
    () => {
      const c = chars[Math.floor(Math.random() * chars.length)];
      const stats = calculateMaxStats(c);
      c.mentalNum = Math.min(stats.maxMental, (c.mentalNum || 0) + 6);
      return `🎴 [사건] ${c.name}은/는 낯선 이가 두고 간 낡은 사진 한 장을 주웠다. 누구의 것인지는 알 수 없었다. (정신력 +6)`;
    },
    () => {
      chars.forEach(c => { c.fatigueNum = Math.max(0, (c.fatigueNum || 0) - 5); });
      return `🎴 [사건] 며칠간 이어진 가뭄 끝에 단비가 내렸다. 모두가 오랜만에 편히 잠들었다. (전원 피로 -5)`;
    },
    () => {
      const c = chars[Math.floor(Math.random() * chars.length)];
      c.corruptionNum = Math.min(100, (c.corruptionNum || 0) + 4);
      return `🎴 [사건] 며칠 조용하던 그림자의 기운이 다시 짙어졌다. (오염도 +4)`;
    },
    () => {
      chars.forEach(c => {
        const stats = calculateMaxStats(c);
        c.mentalNum = Math.min(stats.maxMental, (c.mentalNum || 0) + 4);
      });
      return `🎴 [사건] 오랜만에 안전지대 사람들이 모여 조촐한 잔치를 열었다. (전원 정신력 +4)`;
    },
    () => {
      const c = chars[Math.floor(Math.random() * chars.length)];
      c.healthNum = Math.max(0, (c.healthNum || 0) - 5);
      return `🎴 [사건] ${c.name}은/는 사소한 부주의로 가벼운 찰과상을 입었다. 대단한 상처는 아니었다. (체력 -5)`;
    }
  ];

  const chosen = eventCards[Math.floor(Math.random() * eventCards.length)];
  addLog(chosen());

  localStorage.setItem("characters", JSON.stringify(chars));
  renderResidentMemos(chars);
  updateBagDisplay();

  nextEventCardDay = worldDay + Math.floor(Math.random() * 5) + 3;
}

function updateDayDisplay() {
  const el = document.getElementById("dayDisplay");
  if (el) el.textContent = worldDay + "일째";
}

// 앱을 닫아뒀던 실제 시간을 계산해, 그 사이 흘렀을 법한 며칠치를 자동으로 반영한다
function processOfflineElapsedTime() {
  const lastTimestamp = localStorage.getItem("lastActiveTimestamp");
  const now = Date.now();

  if (lastTimestamp) {
    const elapsedMs = now - parseInt(lastTimestamp);
    const elapsedDays = Math.floor(elapsedMs / REAL_MS_PER_SIM_DAY);

    if (elapsedDays > 0) {
      const cappedDays = Math.min(elapsedDays, MAX_OFFLINE_CATCHUP_DAYS);
      addLog(`[시간 경과] 자리를 비운 사이 ${elapsedDays}일이 흘렀습니다.`);

      for (let i = 0; i < cappedDays; i++) {
        generateRandomDailyEvent();
        worldDay++;
      }
      updateDayDisplay();

      if (elapsedDays > cappedDays) {
        addLog(`[시간 경과] 그보다 더 지난 기간은 별일 없이 평온하게 흘러간 것으로 처리했습니다.`);
      }
    }
  }

  localStorage.setItem("lastActiveTimestamp", now.toString());
}

// ==========================================================
// 아이템 / 가방
// ==========================================================
function getItemDisplayString(rawName) {
  if (itemDatabase[rawName]) return `${itemDatabase[rawName].emoji} ${rawName}`;
  return `📦 ${rawName}`;
}

function updateBagDisplay() {
  document.getElementById("moneyDisplay").textContent = playerMoney.toLocaleString() + " 리움";
  const invContainer = document.getElementById("inventoryList");
  if (playerInventory.length === 0) {
    invContainer.textContent = "아직 가방이 비어 있습니다.";
  } else {
    let html = "";
    playerInventory.forEach((item, index) => {
      let info = itemDatabase[item] || { desc: "설명 없음" };
      let displayName = getItemDisplayString(item);
      let isUsable = info.type === "food" || info.type === "med";
      let isBroken = info.type === "broken";
      let isSellable = !isBroken && (info.price || 0) > 0;

      html += `<div class="item-row">
        <span onclick="alert('${displayName}\\n${(info.desc || '').replace(/'/g, "")}')" style="cursor:pointer;" title="클릭하여 설명 보기">${displayName} ℹ️</span>
        <div>`;
      if (isUsable) {
        html += `<button onclick="useInventoryItem(${index})" style="padding:2px 6px; font-size:11px;">사용</button>`;
      }
      if (isBroken) {
        html += `<button onclick="repairVehicle(${index})" style="padding:2px 6px; font-size:11px; background-color:#38a169;">수리</button>`;
      }
      if (isSellable) {
        html += `<button onclick="sellItem(${index})" style="padding:2px 6px; font-size:11px; background-color:#3182ce;">판매</button>`;
      }
      html += `<button onclick="discardItem(${index})" class="danger-btn" style="padding:2px 6px; font-size:11px;">버리기</button>
        </div></div>`;
    });
    invContainer.innerHTML = html;
  }
  saveGameData();
}

function useInventoryItem(index) {
  let itemName = playerInventory[index];
  let itemInfo = itemDatabase[itemName];
  if (!itemInfo) return;

  let chars = JSON.parse(localStorage.getItem("characters")) || [];
  if (chars.length === 0) {
    alert("회복시킬 주민이 없습니다!");
    return;
  }
  let targetChar = chars[0];
  let stats = calculateMaxStats(targetChar);

  if (itemInfo.type === "food") {
    targetChar.hungerNum = Math.min(stats.maxHunger, (targetChar.hungerNum || 0) + itemInfo.effect);
    addLog(`[식사] ${targetChar.name}은/는 [${itemName}]을/를 사용해 허기를 채웠다. (+${itemInfo.effect})`);
  } else if (itemInfo.type === "med") {
    targetChar.healthNum = Math.min(stats.maxHealth, (targetChar.healthNum || 0) + itemInfo.effect);
    addLog(`[치료] ${targetChar.name}은/는 [${itemName}]을/를 사용하여 체력을 회복했다. (+${itemInfo.effect})`);
  }

  localStorage.setItem("characters", JSON.stringify(chars));
  playerInventory.splice(index, 1);
  updateBagDisplay();
  renderResidentMemos(chars);
}

function repairVehicle(index) {
  let itemName = playerInventory[index];
  let info = itemDatabase[itemName];
  if (!info || info.type !== "broken") return;

  let tempInv = [...playerInventory];
  tempInv.splice(index, 1);

  for (let req of info.repairCost) {
    let idx = tempInv.indexOf(req);
    if (idx === -1) {
      alert(`수리에 필요한 [${req}]이(가) 부족합니다. (필요: ${info.repairCost.join(", ")})`);
      return;
    }
    tempInv.splice(idx, 1);
  }

  playerInventory = tempInv;
  playerInventory.push(info.repairsTo);
  addLog(`[수리] 고장났던 [${itemName}]을(를) 손질하여 [${info.repairsTo}](으)로 되살렸습니다!`);
  updateBagDisplay();
}

function discardItem(index) {
  let itemName = playerInventory[index];
  playerInventory.splice(index, 1);
  addLog(`[정리] 가방에서 [${itemName}]을/를 버렸습니다.`);
  updateBagDisplay();
}

function sellItem(index) {
  let itemName = playerInventory[index];
  let info = itemDatabase[itemName];
  if (!info || !info.price) return;

  let sellPrice = Math.max(1, Math.floor(info.price * 0.5));
  if (!confirm(`[${itemName}]을(를) ${sellPrice.toLocaleString()} 리움에 판매하시겠습니까?`)) return;

  playerInventory.splice(index, 1);
  playerMoney += sellPrice;
  addLog(`[판매] [${getItemDisplayString(itemName)}]을/를 판매했다. (+${sellPrice.toLocaleString()} 리움)`);
  updateBagDisplay();
}

// ==========================================================
// 화면 전환 / 로그
// ==========================================================
// 모바일 화면에서 활동/일지/가방 패널을 탭으로 전환 (PC 화면에는 영향 없음)
function switchMobileTab(tab) {
  const cols = { activity: "simColActivity", log: "simColLog", bag: "simColBag" };
  Object.keys(cols).forEach(key => {
    const el = document.getElementById(cols[key]);
    if (!el) return;
    if (key === tab) el.classList.remove("mobile-hidden");
    else el.classList.add("mobile-hidden");
  });

  const btnMap = { activity: "tabBtnActivity", log: "tabBtnLog", bag: "tabBtnBag" };
  Object.values(btnMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active-tab");
  });
  const activeBtn = document.getElementById(btnMap[tab]);
  if (activeBtn) activeBtn.classList.add("active-tab");

  // 일지 탭이 실제로 보이는 상태가 된 뒤에야 스크롤 위치가 정확히 계산된다
  if (tab === "log") renderLogView();
}

function changeView(screenName) {
  document.getElementById("mainScreen").classList.remove("active");
  document.getElementById("setupScreen").classList.remove("active");
  document.getElementById("simulationScreen").classList.remove("active");

  if (screenName === 'main') {
    document.getElementById("mainScreen").classList.add("active");
  } else if (screenName === 'setup') {
    document.getElementById("setupScreen").classList.add("active");
  } else if (screenName === 'simulation') {
    document.getElementById("simulationScreen").classList.add("active");
    saveCharacters(true);
    updateBagDisplay();
    updateQuestUI();
    updateDayDisplay();
    renderLogView(); // 화면이 보이는 상태에서 다시 계산해야 최근 기록으로 스크롤이 정상 이동함
  }
}

function addLog(message) {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${message}`;
  eventLogsData.push(logMsg);
  if (eventLogsData.length > 150) eventLogsData.shift();

  renderLogView();
  saveGameData();
}

// 검색창에 입력된 이름/키워드로 로그를 필터링해서 보여준다 (비어있으면 전체 표시)
function renderLogView() {
  const logSection = document.getElementById("eventLog");
  if (!logSection) return;
  const filterInput = document.getElementById("logFilterInput");
  const keyword = filterInput ? filterInput.value.trim() : "";

  let lines = eventLogsData;
  if (keyword) lines = eventLogsData.filter(line => line.includes(keyword));

  if (lines.length > 0) {
    logSection.innerHTML = lines.join("<br>");
  } else {
    logSection.innerHTML = keyword ? `"${keyword}"에 대한 기록이 없습니다.` : "";
  }
  logSection.scrollTop = logSection.scrollHeight;
}

function clearEventLogs() {
  if (!confirm("생존 일지(로그) 기록을 모두 초기화하시겠습니까?")) return;
  eventLogsData = [];
  document.getElementById("eventLog").innerHTML = "[시스템] 일지 기록이 초기화되었습니다.<br>";
  saveGameData();
}

document.addEventListener('click', function(e) {
  const starCount = 3;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.textContent = '⭐';
    star.style.left = e.clientX + 'px';
    star.style.top = e.clientY + 'px';

    const dx = (Math.random() - 0.5) * 60;
    const dy = (Math.random() - 0.5) * 60 - 15;
    star.style.setProperty('--dx', dx + 'px');
    star.style.setProperty('--dy', dy + 'px');

    document.body.appendChild(star);
    setTimeout(() => star.remove(), 700);
  }
});

// ==========================================================
// 날씨
// ==========================================================
function getRandomWeather() {
  const rand = Math.random() * 100;
  if (rand < 50) {
    const suns = [
      { text: "맑음", emoji: "☀️", type: "sunny" },
      { text: "쾌청한 날씨", emoji: "🌤️", type: "sunny" }
    ];
    return suns[Math.floor(Math.random() * suns.length)];
  } else if (rand < 80) {
    const rains = [
      { text: "비", emoji: "🌧️", type: "rain" },
      { text: "눈", emoji: "❄️", type: "snow" }
    ];
    return rains[Math.floor(Math.random() * rains.length)];
  } else {
    const specials = [
      { text: "산성비가 내리는 황야", emoji: "🧪", type: "special" },
      { text: "짙은 황사", emoji: "😷", type: "special" },
      { text: "짙은 안개", emoji: "🌫️", type: "special" },
      { text: "건조한 강풍", emoji: "💨", type: "special" },
      { text: "모래폭풍", emoji: "🌪️", type: "special" }
    ];
    return specials[Math.floor(Math.random() * specials.length)];
  }
}

// ==========================================================
// 캐릭터 스탯 / 생존 보조 로직
// ==========================================================
function calculateMaxStats(charData) {
  let maxH = 150, maxM = 150, maxF = 150, maxHu = 150;

  if (charData.bloodType === "O") { maxH += 20; maxHu += 30; }
  if (charData.bloodType === "A") { maxM += 30; }
  if (charData.bloodType === "B") { maxF += 20; }
  if (charData.nation === "북쪽") { maxH += 20; }
  if (charData.nation === "동쪽") { maxM += 20; }

  return { maxHealth: maxH, maxMental: maxM, maxFatigue: maxF, maxHunger: maxHu };
}

function checkCharacterPriority(char) {
  if (char.hungerNum < 30) {
    let foodIdx = playerInventory.findIndex(i => itemDatabase[i] && itemDatabase[i].type === "food");
    if (foodIdx !== -1) {
      let foodName = playerInventory[foodIdx];
      let effect = itemDatabase[foodName].effect || 30;
      let stats = calculateMaxStats(char);
      char.hungerNum = Math.min(stats.maxHunger, char.hungerNum + effect);
      playerInventory.splice(foodIdx, 1);
      addLog(`[자동 생존] ${char.name}은/는 허기가 심해 자동으로 [${foodName}]을/를 소모했다. (허기 +${effect})`);
      updateBagDisplay();
      return true;
    }
  }
  return false;
}

// ==========================================================
// 그림자 오염도 (최소 버전: 즉사 없음, 디버프만, 정신력이 완충 역할)
// ==========================================================

// 탐험 중 그림자에 노출되어 오염도가 조금씩 쌓일 수 있다 (위험한 날씨일수록 확률 상승)
function applyShadowExposure(char, weatherType) {
  char.corruptionNum = char.corruptionNum || 0;
  const chance = weatherType === "special" ? 0.25 : 0.08;
  if (Math.random() >= chance) return "";

  const amount = Math.floor(Math.random() * 6) + 3; // 3~8
  char.corruptionNum = Math.min(100, char.corruptionNum + amount);
  return ` 어딘가에서 옅은 그림자의 흔적이 스치듯 느껴졌다. (오염도 +${amount})`;
}

// 오염도가 쌓인 상태에서 정신력이 낮으면 가끔 소소한 디버프가 발생한다 (정신력이 높으면 거의 영향 없음)
function applyShadowInfluence(char) {
  const corruption = char.corruptionNum || 0;
  if (corruption < 30) return "";

  const stats = calculateMaxStats(char);
  const mentalRatio = (char.mentalNum || 0) / stats.maxMental;
  if (mentalRatio >= 0.5) return ""; // 정신력이 절반 이상이면 완충되어 영향이 거의 없음

  const triggerChance = corruption >= 60 ? 0.35 : 0.15;
  if (Math.random() >= triggerChance) return "";

  const amount = corruption >= 60 ? (Math.floor(Math.random() * 5) + 5) : (Math.floor(Math.random() * 3) + 2);
  char.fatigueNum = Math.min(stats.maxFatigue, (char.fatigueNum || 0) + amount);
  return ` 이유 모를 불안이 스며들어 마음이 무거웠다. (피로 +${amount})`;
}

// 그림자와의 조우 (전투 없는 판정형): 낮은 확률로 발생, 이미 만든 행운 판정을 재사용해 회피/직면을 가른다
function attemptShadowEncounter(char, fortune) {
  if (Math.random() >= 0.04) return "";

  const traits = char.traits || "";
  let gain = Math.floor(Math.random() * 5) + 5;
  if (traits.includes("불길한 직감")) gain = Math.max(1, Math.round(gain / 2));
  char.corruptionNum = Math.min(100, (char.corruptionNum || 0) + gain);

  let msg = "";
  if (fortune.tier === "불운") {
    msg = ` 그림자와 마주쳐 다급히 몸을 피했다.`;
  } else {
    msg = traits.includes("불길한 직감")
      ? ` 불길한 기운을 미리 느끼고 그림자를 마주치기 전에 피했다.`
      : ` 그림자와 마주쳤으나 침착하게 피해 지나쳤다.`;

    const coreChance = 0.3;
    const meatChance = traits.includes("도축과 손질") ? 0.35 : 0.15;
    if (fortune.tier === "행운" && Math.random() < coreChance) {
      playerInventory.push("그림자 핵");
      msg += ` 그 자리에 남은 <b>[그림자 핵]</b>을 조심스레 회수했다.`;
    } else if (Math.random() < meatChance) {
      playerInventory.push("그림자 고기");
      msg += ` 흔적으로 남은 <b>[그림자 고기]</b>를 챙겼다.`;
    }
  }
  return msg;
}

// 상호 연인으로 지정된 성인 커플만 대상으로 하는 저출산 이벤트 (3% 확률)
function attemptCoupleBirth(chars) {
  if (chars.length >= maxCharacters) return null;

  const stageOk = c => c.lifeStage !== "어린이" && c.lifeStage !== "청소년" && c.lifeStage !== "노년";
  let couples = [];
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      let a = chars[i], b = chars[j];
      if (a.relation === "연인" && b.relation === "연인" &&
          a.targetName === b.name && b.targetName === a.name &&
          stageOk(a) && stageOk(b)) {
        couples.push([a, b]);
      }
    }
  }
  if (couples.length === 0) return null;
  if (Math.random() >= 0.03) return null;

  const [p1, p2] = couples[Math.floor(Math.random() * couples.length)];
  if (p1.maxChildren === undefined) {
    const cap = Math.floor(Math.random() * 3) + 1;
    p1.maxChildren = cap; p2.maxChildren = cap;
    p1.childCount = 0; p2.childCount = 0;
  }
  if ((p1.childCount || 0) >= p1.maxChildren) return null;

  const babyZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
  const babyData = zodiacData[babyZodiac];
  const babyName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

  const babyBase = {
    name: babyName,
    bloodType: p1.bloodType,
    zodiac: babyZodiac,
    mbti: babyData.mbti[Math.floor(Math.random() * babyData.mbti.length)],
    foodPref: babyData.food[Math.floor(Math.random() * babyData.food.length)],
    nation: p1.nation,
    species: p1.species,
    lifeStage: "어린이",
    relation: "지인"
  };
  const babyStats = calculateMaxStats(babyBase);

  const babyFull = {
    ...babyBase,
    charId: generateCharId(),
    power: 20, agility: 20, intel: 20, luck: 50,
    traits: "",
    healthNum: babyStats.maxHealth,
    mentalNum: babyStats.maxMental,
    fatigueNum: 0,
    hungerNum: babyStats.maxHunger,
    corruptionNum: 0
  };
  chars.push(babyFull);

  p1.childCount = (p1.childCount || 0) + 1;
  p2.childCount = p1.childCount;
  addLog(`[탄생] ${p1.name}과 ${p2.name} 사이에서 새로운 아이 [${babyName}]가 태어났습니다! (이 커플의 자녀 ${p1.childCount}/${p1.maxChildren}명)`);

  // 주민 등록실에도 카드로 반영해두어야 다음 저장 시 아이가 사라지지 않는다
  addCharacter(babyFull);
  return babyName;
}

// 행운 능력치를 살짝 반영한 1d20 주사위 판정 (효과는 소소하게 유지)
function rollFortune(character) {
  const diceRoll = Math.floor(Math.random() * 20) + 1;
  const luckBonus = Math.floor((character.luck || 50) / 20);
  const total = diceRoll + luckBonus;

  if (total >= 18) return { tier: "행운", total };
  if (total <= 4) return { tier: "불운", total };
  return { tier: "보통", total };
}

// ==========================================================
// 야외 탐험 (직접 클릭 시 하루 경과)
// ==========================================================
function triggerAdventure() {
  let chars = JSON.parse(localStorage.getItem("characters")) || [];
  if (chars.length === 0 || !chars.some(c => c.name)) {
    alert("등록된 주민이 없습니다. 주민 등록실에서 주민을 등록해주세요!");
    return;
  }

  advanceDay(); // 로그 순서상 날짜 경과를 행동 결과보다 먼저 기록

  const activeRes = chars[Math.floor(Math.random() * chars.length)];
  checkCharacterPriority(activeRes);

  let stats = calculateMaxStats(activeRes);
  let fatigueMult = 1.0;
  if (playerInventory.includes("자동차")) fatigueMult = 0.4;
  else if (playerInventory.includes("자전거")) fatigueMult = 0.7;

  let fatigueAdd = Math.round(15 * fatigueMult);
  activeRes.fatigueNum = Math.min(stats.maxFatigue, (activeRes.fatigueNum || 0) + fatigueAdd);
  activeRes.hungerNum = Math.max(0, (activeRes.hungerNum || stats.maxHunger) - 10);

  const weatherObj = getRandomWeather();
  const weather = weatherObj.text;
  const randomTemplate = adventureTemplates[Math.floor(Math.random() * adventureTemplates.length)];
  let logText = randomTemplate.length === 2 ? randomTemplate(activeRes.name, weather) : randomTemplate(activeRes.name);

  document.getElementById("adventureResult").textContent = `${activeRes.name} 탐험 완료!`;

  const fortune = rollFortune(activeRes);
  let fortuneMsg = "";
  let rewardChance = 0.6;
  if (fortune.tier === "행운") {
    rewardChance = 1.0;
    activeRes.fatigueNum = Math.max(0, activeRes.fatigueNum - Math.round(fatigueAdd * 0.3));
    fortuneMsg = " 왠지 오늘따라 운이 좋았다.";
  } else if (fortune.tier === "불운") {
    rewardChance = 0.3;
    activeRes.fatigueNum = Math.min(stats.maxFatigue, activeRes.fatigueNum + Math.round(fatigueAdd * 0.3));
    fortuneMsg = " 오늘따라 유독 되는 일이 없었다.";
    // 보호 부적을 지니고 있으면 불운의 여파를 조금 완화해준다
    if (playerInventory.includes("보호 부적")) {
      activeRes.fatigueNum = Math.max(0, activeRes.fatigueNum - Math.round(fatigueAdd * 0.15));
      fortuneMsg += " 그래도 지니고 있던 부적 덕분인지 큰 화는 면했다.";
    }
  }

  // 소지품 중 나침반/지도가 탐험 결과에 살짝 관여한다
  let itemMsg = "";
  if (playerInventory.includes("나침반")) {
    activeRes.fatigueNum = Math.max(0, activeRes.fatigueNum - 2);
    itemMsg += " 나침반 덕분에 길을 헤매지 않았다.";
  }
  if (playerInventory.includes("지도")) {
    rewardChance = Math.min(1, rewardChance + 0.15);
    itemMsg += " 지참한 지도 덕분에 놓칠 뻔한 것을 발견했다.";
  }

  // 특성이 탐험 결과에 살짝 관여한다
  const advTraits = activeRes.traits || "";
  let traitMsg = "";
  if (advTraits.includes("길 찾기")) {
    activeRes.fatigueNum = Math.max(0, activeRes.fatigueNum - 3);
    traitMsg += " 길눈이 밝아 지름길로 다녀왔다.";
  }
  if (advTraits.includes("동물과의 교감")) {
    activeRes.fatigueNum = Math.max(0, activeRes.fatigueNum - 2);
    traitMsg += " 낯선 동물이 은근슬쩍 길을 알려주는 듯했다.";
  }
  if (advTraits.includes("응급 처치")) {
    activeRes.healthNum = Math.min(stats.maxHealth, (activeRes.healthNum || 0) + 3);
    traitMsg += " 능숙하게 스스로를 돌보았다.";
  }
  if (advTraits.includes("폐품 감정") || advTraits.includes("부품 재활용") || advTraits.includes("약초 식별")) {
    rewardChance = Math.min(1, rewardChance + 0.1);
  }

  let bonusMsg = "";
  const brokenRoll = Math.random();
  if (brokenRoll < 0.015) {
    playerInventory.push("고장난 자동차");
    bonusMsg = ` 게다가 수풀 속에 처박힌 <b>[고장난 자동차]</b>를 발견했다!`;
  } else if (brokenRoll < 0.05) {
    playerInventory.push("고장난 자전거");
    bonusMsg = ` 게다가 녹슨 <b>[고장난 자전거]</b>를 발견했다!`;
  }

  const shadowMsg = applyShadowExposure(activeRes, weatherObj.type);
  const encounterMsg = attemptShadowEncounter(activeRes, fortune);

  addLog(`[탐험] ${logText}${fortuneMsg}${itemMsg}${traitMsg}${bonusMsg}${shadowMsg}${encounterMsg}`);

  if (Math.random() < rewardChance) {
    let pool = Object.keys(itemDatabase).filter(k => itemDatabase[k].type !== "broken" && itemDatabase[k].type !== "vehicle" && itemDatabase[k].type !== "special");
    const reward = pool[Math.floor(Math.random() * pool.length)];
    playerInventory.push(reward);
    addLog(`[획득] 탐험 도중 가방에 <b>[${getItemDisplayString(reward)}]</b>을/를 추가했습니다.`);
  }
  updateBagDisplay();

  attemptCoupleBirth(chars);
  checkQuestProgress("adventure");
  localStorage.setItem("characters", JSON.stringify(chars));
  renderResidentMemos(chars);
}

// ==========================================================
// 나들이 (날씨 + 외식 + 상점 방문, 결과 확인 시 하루 경과)
// ==========================================================
let currentOutingData = null;

function triggerOutingStep1() {
  const emojiBox = document.getElementById("outingEmoji");
  const resultBox = document.getElementById("outingResult");
  const btn = document.getElementById("outingBtn");
  let chars = JSON.parse(localStorage.getItem("characters")) || [];

  if (chars.length === 0 || !chars.some(c => c.name)) {
    alert("등록된 주민이 없습니다. 주민 등록실에서 주민을 등록해주세요!");
    return;
  }

  let characterNames = chars.map(c => c.name).filter(n => n);
  const activeName = characterNames[Math.floor(Math.random() * characterNames.length)];

  const weather = getRandomWeather();
  emojiBox.textContent = weather.emoji;
  resultBox.innerHTML = `<b>[날씨: ${weather.text}]</b><br>${activeName} 나들이 준비 중`;

  currentOutingData = { activeName, weather };
  btn.textContent = "결과 확인";
  btn.onclick = triggerOutingStep2;
}

function triggerOutingStep2() {
  const emojiBox = document.getElementById("outingEmoji");
  const resultBox = document.getElementById("outingResult");
  const btn = document.getElementById("outingBtn");
  let chars = JSON.parse(localStorage.getItem("characters")) || [];

  advanceDay(); // 로그 순서상 날짜 경과를 행동 결과보다 먼저 기록

  const { activeName, weather } = currentOutingData;
  let activeRes = chars.find(c => c.name === activeName) || chars[0];
  if (activeRes) checkCharacterPriority(activeRes);

  if (weather.type === "special") {
    emojiBox.textContent = weather.emoji;
    const specialSentences = [
      "날씨가 궂어 오늘은 안전지대 광장 안에서 조용히 시간을 보냈다.",
      "위험한 날씨를 피해 폐허 안에서 휴식을 취했다.",
      "바깥 날씨가 나빠 오늘은 임시 거처 밖으로 나가지 않았다."
    ];
    const selectedSentence = specialSentences[Math.floor(Math.random() * specialSentences.length)];
    resultBox.textContent = `${activeName}: ${selectedSentence}`;
    addLog(`[나들이] ${activeName}: ${selectedSentence}`);
  } else if (weather.type === "rain" || weather.type === "snow") {
    emojiBox.textContent = weather.emoji;
    let rainFatigueRelief = 0;
    if (activeRes) {
      activeRes.fatigueNum = Math.max(0, (activeRes.fatigueNum || 0) - 3);
      rainFatigueRelief = 3;
    }
    resultBox.textContent = `${activeName}은/는 우비와 장화를 신고 산책을 즐겼다.`;
    addLog(`[나들이] ${activeName}은/는 우비와 장화를 신고 산책을 즐겼다. (피로 -${rainFatigueRelief})`);
  } else {
    const roll = Math.random();
    if (roll < 0.35) {
      let allKeys = Object.keys(itemDatabase).filter(k => itemDatabase[k].type !== "broken");
      let shopItems = [];
      while (shopItems.length < 4 && shopItems.length < allKeys.length) {
        let k = allKeys[Math.floor(Math.random() * allKeys.length)];
        if (!shopItems.includes(k)) shopItems.push(k);
      }
      emojiBox.textContent = "🏬";
      resultBox.textContent = `${activeName} 상점 방문`;

      if (activeRes && activeRes.nation === "남쪽") {
        addLog(`[상점] 남쪽 출신 ${activeName}은/는 상인에게 능청스러운 웃음을 지으며 덤을 요구했다.`);
      } else if (activeRes && activeRes.nation === "동쪽") {
        addLog(`[상점] 동쪽 출신 ${activeName}은/는 물건의 가성비를 꼼꼼히 따져보았다.`);
      } else {
        addLog(`[상점] ${activeName}이/가 시가지 상점에 들렀다.`);
      }
      openShopModal("🏬 시가지 상점", shopItems);
      checkQuestProgress("outing");
    } else if (roll < 0.65) {
      let availableFoodPool = [];
      chars.forEach(c => {
        for (let cat in globalFoodList) {
          if (c.foodPref && c.foodPref.includes(cat)) {
            availableFoodPool = availableFoodPool.concat(globalFoodList[cat]);
          }
        }
      });
      if (availableFoodPool.length === 0) {
        for (let cat in globalFoodList) availableFoodPool = availableFoodPool.concat(globalFoodList[cat]);
      }

      const selectedMenu = availableFoodPool[Math.floor(Math.random() * availableFoodPool.length)];
      const price = Math.floor(Math.random() * 81) + 40;

      if (playerMoney >= price) {
        playerMoney -= price;
        emojiBox.textContent = "🍽️";

        let foodGain = 45;
        let traitDineMsg = "";
        if (activeRes) {
          let stats = calculateMaxStats(activeRes);
          const dineTraits = activeRes.traits || "";
          if (dineTraits.includes("먹보") || dineTraits.includes("미식가")) {
            foodGain += 10;
            traitDineMsg = " 유독 맛있게 먹어치웠다.";
          }
          activeRes.hungerNum = Math.min(stats.maxHunger, (activeRes.hungerNum || 0) + foodGain);
        }

        resultBox.textContent = `${activeName}은/는 ${selectedMenu}을/를 먹고 허기를 채웠다. (-${price} 리움)`;
        addLog(`[외식] ${activeName}은/는 식당에서 [${selectedMenu}]을/를 먹고 ${price} 리움을 지불했다.${traitDineMsg} (허기 +${foodGain})`);
      } else {
        emojiBox.textContent = "💸";
        resultBox.textContent = `${activeName}은/는 소지금이 부족해 외식을 포기했다.`;
        addLog(`[외식 실패] 잔액이 부족하여 외식을 즐기지 못했습니다.`);
      }
      checkQuestProgress("outing");
      updateBagDisplay();
    } else {
      emojiBox.textContent = "🚶";
      resultBox.textContent = `${activeName}은/는 안전지대 주변을 산책했다.`;

      let fatigueRelief = 0;
      if (activeRes) {
        activeRes.fatigueNum = Math.max(0, (activeRes.fatigueNum || 0) - 7);
        fatigueRelief = 7;
      }
      addLog(`[나들이] ${activeName}은/는 맑은 날씨 속에서 평화로운 산책을 즐겼다. (피로 -${fatigueRelief})`);
      checkQuestProgress("outing");
    }
  }

  attemptCoupleBirth(chars);

  if (activeRes) {
    localStorage.setItem("characters", JSON.stringify(chars));
    renderResidentMemos(chars);
  }

  btn.textContent = "나들이 준비";
  btn.onclick = triggerOutingStep1;
}

// ==========================================================
// 상점 모달
// ==========================================================
let currentShopStock = {};

function openShopModal(title, itemsList) {
  document.getElementById("shopTitle").textContent = title;
  currentShopStock = {};
  itemsList.forEach(itemName => {
    currentShopStock[itemName] = Math.floor(Math.random() * 3) + 1; // 방문마다 1~3개 한정 재고
  });
  renderShopGrid();
  document.getElementById("shopModal").classList.add("active");
}

function renderShopGrid() {
  const grid = document.getElementById("shopGrid");
  grid.innerHTML = "";

  Object.keys(currentShopStock).forEach(itemName => {
    let data = itemDatabase[itemName] || { emoji: "📦", price: 50, desc: "" };
    let stock = currentShopStock[itemName];
    let btn = document.createElement("button");
    btn.className = "shop-item-btn";

    if (stock <= 0) {
      btn.disabled = true;
      btn.style.opacity = "0.4";
      btn.innerHTML = `<span style="font-size:22px;">${data.emoji}</span>
        <b>${itemName}</b>
        <span style="color:#e53e3e; font-size:10px;">품절</span>`;
    } else {
      btn.innerHTML = `<span style="font-size:22px;">${data.emoji}</span>
        <b>${itemName}</b>
        <span style="color:#3182ce; font-size:10px;">${data.price.toLocaleString()} 리움 (재고 ${stock})</span>`;
      btn.onclick = () => buyShopItem(itemName, data.price);
    }
    grid.appendChild(btn);
  });
}

function buyShopItem(itemName, price) {
  if ((currentShopStock[itemName] || 0) <= 0) return;
  if (playerMoney < price) {
    alert("리움이 부족합니다!");
    return;
  }
  if (!confirm(`[${itemName}]을(를) ${price.toLocaleString()} 리움에 구매하시겠습니까?`)) return;
  playerMoney -= price;
  playerInventory.push(itemName);
  currentShopStock[itemName]--;
  addLog(`[구매] [${getItemDisplayString(itemName)}]을/를 구매했다. (-${price.toLocaleString()} 리움)`);
  updateBagDisplay();
  renderShopGrid();
}

function closeShopModal() {
  document.getElementById("shopModal").classList.remove("active");
}

// ==========================================================
// 오늘의 소식
// ==========================================================
function triggerQuickNews() {
  const resultBox = document.getElementById("newsResult");
  let chars = JSON.parse(localStorage.getItem("characters")) || [];
  if (chars.length === 0 || !chars.some(c => c.name)) {
    alert("등록된 주민이 없습니다!");
    return;
  }

  const activeRes = chars[Math.floor(Math.random() * chars.length)];
  checkCharacterPriority(activeRes);

  const selectedMedia = worldMediaList[Math.floor(Math.random() * worldMediaList.length)];
  let stats = calculateMaxStats(activeRes);

  let fatigueChange = 0;
  let effectText = "";
  if ((activeRes.intel || 50) >= 60) {
    fatigueChange = -15;
    effectText = `읽기를 좋아하여 글을 정독하니 피로가 풀렸다. (피로 -15)`;
  } else {
    fatigueChange = +15;
    effectText = `글자가 눈에 잘 들어오지 않아 오히려 머리가 지끈거린다. (피로 +15)`;
  }
  activeRes.fatigueNum = Math.max(0, Math.min(stats.maxFatigue, (activeRes.fatigueNum || 0) + fatigueChange));

  let traitNewsMsg = "";
  if ((activeRes.traits || "").includes("희망의 소리")) {
    activeRes.mentalNum = Math.min(stats.maxMental, (activeRes.mentalNum || 0) + 4);
    traitNewsMsg = " 힘이 되는 소식을 마음에 담아두었다. (정신력 +4)";
  }

  let socialLog = "";
  if (chars.length >= 2 && Math.random() < 0.7) {
    let idx1 = Math.floor(Math.random() * chars.length);
    let idx2;
    do { idx2 = Math.floor(Math.random() * chars.length); } while (idx2 === idx1);

    let c1 = chars[idx1];
    let c2 = chars[idx2];

    let isDifferentSpecies = c1.species !== c2.species;
    let eventChance = isDifferentSpecies ? 0.4 : 0.8;

    if (Math.random() < eventChance) {
      let isConflict = Math.random() < 0.45;
      if (isConflict) {
        let confPhrase = conflictPhrases[Math.floor(Math.random() * conflictPhrases.length)];
        socialLog = `<br>💬 [관계] ${c1.name}과/와 ${c2.name}: ${confPhrase}`;
      } else {
        let peacePhrase = peacefulPhrases[Math.floor(Math.random() * peacefulPhrases.length)];
        let changePhrase = relationChangePhrases[Math.floor(Math.random() * relationChangePhrases.length)];
        socialLog = `<br>🤝 [관계] ${c1.name}과/와 ${c2.name}: ${peacePhrase} 두 사람은 ${changePhrase}`;
      }
    }
  }

  attemptCoupleBirth(chars);
  checkQuestProgress("news");
  localStorage.setItem("characters", JSON.stringify(chars));
  renderResidentMemos(chars);

  resultBox.textContent = `${activeRes.name}은/는 ${selectedMedia}을/를 읽었다.`;
  addLog(`[소식] ${activeRes.name}은/는 [${selectedMedia}]을/를 펼쳐들었다. (${effectText})${traitNewsMsg}${socialLog}`);
}

// ==========================================================
// 일상 이벤트 자동 생성 (재생/자동 행동 공용, 하루를 진행시키지는 않음)
// ==========================================================
// 상호 지명된 관계일 때만 관계 상호작용 멘트 후보를 만든다 (지명 대상이 없으면 빈 배열)
function getRelationshipEventCandidates(c1, chars) {
  if (!c1.targetName) return [];
  const partner = chars.find(c => c.name === c1.targetName);
  if (!partner) return [];

  const rel = c1.relation;
  let lines = [];

  if (rel === "부모" || rel === "자식") {
    const parent = rel === "부모" ? c1 : partner;
    const child = rel === "부모" ? partner : c1;
    lines = [
      `[관계] ${parent.name}은/는 잠 못 드는 ${child.name}을/를 위해 나즈막히 자장가를 흥얼거렸다.`,
      `[관계] ${parent.name}은/는 ${child.name}에게 오늘 있었던 일을 조곤조곤 물었다.`,
      `[관계] ${child.name}은/는 서투르게 만든 것을 ${parent.name}에게 건네며 멋쩍게 웃었다.`
    ];
  } else if (rel === "연인") {
    lines = [
      `[관계] ${c1.name}과 ${partner.name}는 나란히 앉아 노을을 바라보았다.`,
      `[관계] ${c1.name}은/는 ${partner.name}를 위해 작은 선물을 몰래 준비했다.`,
      `[관계] ${c1.name}과 ${partner.name}는 서로의 하루 이야기를 나누며 웃었다.`
    ];
  } else if (rel === "친구") {
    lines = [
      `[관계] ${c1.name}과 ${partner.name}는 실없는 농담을 주고받으며 시간을 보냈다.`,
      `[관계] ${c1.name}은/는 ${partner.name}에게 사소한 고민을 털어놓았다.`
    ];
  } else if (rel === "형제자매") {
    lines = [
      `[관계] ${c1.name}과 ${partner.name}는 어릴 적 이야기를 하며 한참을 웃었다.`,
      `[관계] ${c1.name}은/는 ${partner.name}의 물건을 몰래 빌렸다가 들켜 한소리 들었다.`
    ];
  } else if (rel === "보호자와 피보호자") {
    lines = [
      `[관계] ${c1.name}은/는 ${partner.name}가 다치지 않았는지 꼼꼼히 살폈다.`,
      `[관계] ${c1.name}과 ${partner.name}는 나란히 앉아 잠시 아무 말 없이 시간을 보냈다.`
    ];
  } else if (rel === "원수" || rel === "경쟁자") {
    lines = [`[관계] ${c1.name}과 ${partner.name}는 마주치자마자 날선 말을 주고받았다.`];
  } else {
    return [];
  }

  const isNegative = (rel === "원수" || rel === "경쟁자");
  const amount = isNegative ? -3 : 3;
  const chosenText = lines[Math.floor(Math.random() * lines.length)];

  return [{ text: chosenText, stat: "mentalNum", amount, partner, partnerStat: "mentalNum", partnerAmount: amount }];
}

// 특성이 많은 주민일수록 일상 이벤트에 조금 더 자주 등장한다 (소소한 가중치)
function pickWeightedCharacter(chars) {
  let weighted = chars.map(c => ({
    c,
    weight: 1 + ((c.traits ? c.traits.split(",").length : 0) * 0.3)
  }));
  let totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * totalWeight;
  for (let w of weighted) {
    if (r < w.weight) return w.c;
    r -= w.weight;
  }
  return chars[0];
}

function generateRandomDailyEvent() {
  let chars = JSON.parse(localStorage.getItem("characters")) || [];
  if (chars.length === 0) return;

  let c1 = pickWeightedCharacter(chars);

  // 일상 이벤트는 소소하게나마 체력/정신력/피로를 회복시켜준다 (탐험·나들이의 소모를 상쇄하는 창구)
  let events = [
    { text: `[일상] ${c1.name}은/는 장비를 정비하며 시간을 보냈다.`, stat: "fatigueNum", amount: -3 },
    { text: `[일상] ${c1.name}은/는 황야의 날씨를 확인했다.`, stat: "fatigueNum", amount: -2 },
    { text: `[일상] ${c1.name}은/는 마법 등기소에 들러 누군가에게 보낼 편지를 부쳤다.`, stat: "mentalNum", amount: 3 },
    { text: `[일상] ${c1.name}은/는 우체부에게 먼 안전지대에서 온 편지를 받았다.`, stat: "mentalNum", amount: 4 }
  ];

  if (c1.nation === "동쪽") {
    const eastEvents = [
      { text: `[일상] 동쪽 출신 ${c1.name}은/는 다른 지역의 도구를 보고 효율이 아쉽다며 혀를 찼다.`, stat: "mentalNum", amount: -2 },
      { text: `[일상] 동쪽 출신 ${c1.name}은/는 낡은 장치를 분해해 쓸만한 부품을 골라냈다.`, stat: "mentalNum", amount: 3 },
      { text: `[일상] 동쪽 출신 ${c1.name}은/는 새로운 개조 아이디어를 골똘히 구상하느라 잠을 설쳤다.`, stat: "fatigueNum", amount: 2 }
    ];
    events.push(eastEvents[Math.floor(Math.random() * eastEvents.length)]);
  } else if (c1.nation === "북쪽") {
    const northEvents = [
      { text: `[일상] 북쪽 출신 ${c1.name}은/는 시끌벅적한 자리를 뒤로하고 조용히 자리를 피했다.`, stat: "fatigueNum", amount: -3 },
      { text: `[일상] 북쪽 출신 ${c1.name}은/는 눈 쌓인 지붕을 말없이 손보았다.`, stat: "fatigueNum", amount: -2 },
      { text: `[일상] 북쪽 출신 ${c1.name}은/는 아무 말 없이 사냥 도구를 손질했다.`, stat: "fatigueNum", amount: -3 }
    ];
    events.push(northEvents[Math.floor(Math.random() * northEvents.length)]);
  } else if (c1.nation === "서쪽") {
    const westEvents = [
      { text: `[일상] 서쪽 출신 ${c1.name}은/는 도움을 받기보다 고장 난 구형 도구를 직접 두드려 고쳤다.`, stat: "mentalNum", amount: 3 },
      { text: `[일상] 서쪽 출신 ${c1.name}은/는 혼자 묵묵히 밭일 비슷한 일을 했다.`, stat: "fatigueNum", amount: -3 },
      { text: `[일상] 서쪽 출신 ${c1.name}은/는 낡은 담벼락을 손수 보수했다.`, stat: "fatigueNum", amount: -2 }
    ];
    events.push(westEvents[Math.floor(Math.random() * westEvents.length)]);
  } else if (c1.nation === "남쪽") {
    const southEvents = [
      { text: `[일상] 남쪽 출신 ${c1.name}은/는 지나가는 이웃에게 붙임성 좋게 말을 걸었다.`, stat: "mentalNum", amount: 3 },
      { text: `[일상] 남쪽 출신 ${c1.name}은/는 지나가는 상인과 흥정하듯 농담을 주고받았다.`, stat: "mentalNum", amount: 4 },
      { text: `[일상] 남쪽 출신 ${c1.name}은/는 볕 좋은 곳에 나와 한참을 노래를 흥얼거렸다.`, stat: "mentalNum", amount: 3 }
    ];
    events.push(southEvents[Math.floor(Math.random() * southEvents.length)]);
  }

  // 종족별 일상 이벤트
  if (c1.species === "인간") {
    events.push({ text: `[일상] ${c1.name}은/는 오래된 사진 한 장을 꺼내 보며 옛 생각에 잠겼다.`, stat: "mentalNum", amount: 3 });
  } else if (c1.species === "괴물") {
    events.push({ text: `[일상] ${c1.name}은/는 밤이 되자 한결 편안한 얼굴이 되었다.`, stat: "mentalNum", amount: 4 });
  } else if (c1.species === "혼혈") {
    events.push({ text: `[일상] ${c1.name}은/는 인간과 괴물, 양쪽의 방식을 오가며 하루를 보냈다.`, stat: "mentalNum", amount: 2 });
  }

  // 특성에 따라 어울리는 일상 이벤트가 조금 더 자주 뽑히도록 후보를 추가한다
  const traits = c1.traits || "";
  if (traits.includes("잠의 달인")) {
    events.push({ text: `[일상] ${c1.name}은/는 늘어지게 낮잠을 잤다.`, stat: "fatigueNum", amount: -6 });
  }
  if (traits.includes("먹보") || traits.includes("미식가")) {
    events.push({ text: `[일상] ${c1.name}은/는 아껴뒀던 간식을 몰래 꺼내 먹었다.`, stat: "mentalNum", amount: 4 });
  }
  if (traits.includes("침착함")) {
    events.push({ text: `[일상] ${c1.name}은/는 조용히 눈을 감고 명상하듯 시간을 보냈다.`, stat: "mentalNum", amount: 5 });
  }
  if (traits.includes("생활력") || traits.includes("부품 재활용") || traits.includes("폐품 감정")) {
    events.push({ text: `[일상] ${c1.name}은/는 자잘한 살림살이를 손보며 하루를 보냈다.`, stat: "fatigueNum", amount: -4 });
  }

  // 상호 지명된 관계가 있으면 관계 상호작용 멘트도 후보에 섞는다
  events = events.concat(getRelationshipEventCandidates(c1, chars));

  let chosen = events[Math.floor(Math.random() * events.length)];

  let stats = calculateMaxStats(c1);
  let statLabel = "";
  if (chosen.stat === "fatigueNum") {
    c1.fatigueNum = Math.max(0, Math.min(stats.maxFatigue, (c1.fatigueNum || 0) + chosen.amount));
    statLabel = ` (피로 ${chosen.amount > 0 ? "+" : ""}${chosen.amount})`;
  } else if (chosen.stat === "mentalNum") {
    c1.mentalNum = Math.max(0, Math.min(stats.maxMental, (c1.mentalNum || 0) + chosen.amount));
    statLabel = ` (정신력 ${chosen.amount > 0 ? "+" : ""}${chosen.amount})`;
  }

  // 관계 상호작용 이벤트는 상대방에게도 같은 효과를 적용한다
  if (chosen.partner && chosen.partnerStat) {
    let pStats = calculateMaxStats(chosen.partner);
    if (chosen.partnerStat === "fatigueNum") {
      chosen.partner.fatigueNum = Math.max(0, Math.min(pStats.maxFatigue, (chosen.partner.fatigueNum || 0) + chosen.partnerAmount));
    } else if (chosen.partnerStat === "mentalNum") {
      chosen.partner.mentalNum = Math.max(0, Math.min(pStats.maxMental, (chosen.partner.mentalNum || 0) + chosen.partnerAmount));
    }
  }

  const shadowMsg = applyShadowInfluence(c1);

  addLog(chosen.text + statLabel + shadowMsg);
  attemptCoupleBirth(chars);
  localStorage.setItem("characters", JSON.stringify(chars));
  renderResidentMemos(chars);
}

// ==========================================================
// 생존 일지 재생 / 자동 행동 루틴
// 관찰형 시뮬레이션에 맞게 속도를 크게 늦춤 (하루 진행은 탐험/나들이 직접 클릭 시에만)
// ==========================================================
function startPlayback() {
  if (isPlaying) return;
  isPlaying = true;
  document.getElementById("playbackStatus").textContent = "상태: 재생 중 (일상이 천천히 흐르는 중)";
  playbackTimer = setInterval(() => {
    generateRandomDailyEvent();
  }, 60000); // 1분마다 소소한 일상 이벤트
}

function pausePlayback() {
  isPlaying = false;
  clearInterval(playbackTimer);
  document.getElementById("playbackStatus").textContent = "상태: 일시정지됨";
}

function toggleAutoRoutine() {
  const btn = document.getElementById("autoToggleBtn");
  if (isAutoRoutineOn) {
    clearInterval(autoRoutineInterval);
    isAutoRoutineOn = false;
    btn.textContent = "🤖 자동 행동: OFF";
    btn.classList.remove("active");
  } else {
    isAutoRoutineOn = true;
    btn.textContent = "🤖 자동 행동: ON";
    btn.classList.add("active");

    autoRoutineInterval = setInterval(() => {
      let chars = JSON.parse(localStorage.getItem("characters")) || [];
      if (chars.length === 0) return;
      let limit = parseInt(document.getElementById("autoFatigueLimit").value) || 100;
      let target = chars[Math.floor(Math.random() * chars.length)];
      let stats = calculateMaxStats(target);

      if ((target.fatigueNum || 0) >= limit) {
        target.fatigueNum = Math.max(0, target.fatigueNum - 30);
        target.mentalNum = Math.min(stats.maxMental, (target.mentalNum || 0) + 10);
        addLog(`[휴식] ${target.name}은/는 피로도가 높아 휴식을 취했다.`);
        localStorage.setItem("characters", JSON.stringify(chars));
        renderResidentMemos(chars);
      } else {
        generateRandomDailyEvent();
      }
    }, 45000); // 45초마다 한 번, 관찰형 속도로 완화 (하루는 진행시키지 않음)
  }
}

// ==========================================================
// 도시 및 마을 의뢰
// ==========================================================
function handleQuestAction() {
  if (!currentQuest) {
    currentQuest = { ...questTemplates[Math.floor(Math.random() * questTemplates.length)], status: "accepted" };
    addLog(`[의뢰] [${currentQuest.title}] 수락. (${currentQuest.desc})`);
  } else if (currentQuest.status === "completed") {
    playerMoney += currentQuest.reward;
    addLog(`[보상] 의뢰 [${currentQuest.title}] 완수 보상 ${currentQuest.reward.toLocaleString()} 리움을 수령했다.`);
    currentQuest = null;
    updateBagDisplay();
  }
  updateQuestUI();
}

function checkQuestProgress(type) {
  if (currentQuest && currentQuest.status === "accepted" && currentQuest.type === type) {
    currentQuest.status = "completed";
    addLog(`[의뢰] [${currentQuest.title}] 목표를 달성했습니다. 게시판에서 보상을 수령하세요.`);
    updateQuestUI();
  }
}

function updateQuestUI() {
  const t = document.getElementById("questTitle");
  const d = document.getElementById("questDesc");
  const b = document.getElementById("questBtn");
  if (!currentQuest) {
    t.textContent = "[의뢰 없음]";
    d.textContent = "게시판을 확인해 새 의뢰를 받아보세요.";
    b.textContent = "의뢰 게시판 확인";
  } else if (currentQuest.status === "accepted") {
    t.textContent = `📌 ${currentQuest.title}`;
    d.textContent = currentQuest.desc;
    b.textContent = "진행 중...";
  } else if (currentQuest.status === "completed") {
    t.textContent = `✅ 완료 가능`;
    d.textContent = `보상: ${currentQuest.reward.toLocaleString()} 리움`;
    b.textContent = "보상 수령";
  }
}

// ==========================================================
// 주민 등록 / 카드 로직
// ==========================================================
function refreshTargetOptions(cardElement, selectedName) {
  const targetSelect = cardElement.querySelector(".targetSelect");
  if (!targetSelect) return;
  const allChars = JSON.parse(localStorage.getItem("characters")) || [];
  const currentNameInCard = cardElement.querySelector(".characterNameInput").value;
  let options = `<option value="">(비어 있음)</option>`;
  allChars.forEach(c => {
    if (c.name && c.name !== currentNameInCard) {
      options += `<option value="${c.name}">${c.name}</option>`;
    }
  });
  targetSelect.innerHTML = options;
  if (selectedName) targetSelect.value = selectedName;
}

function refreshAllTargetOptions() {
  document.querySelectorAll(".character-card").forEach(card => {
    const current = card.querySelector(".targetSelect") ? card.querySelector(".targetSelect").value : "";
    refreshTargetOptions(card, current);
  });
}

function setupCardEvents(cardElement, savedData = null) {
  const nameInput = cardElement.querySelector(".characterNameInput");

  if (savedData) {
    if (savedData.bloodType) {
      cardElement.dataset.bloodType = savedData.bloodType;
      cardElement.querySelector(".bloodResult").textContent = "혈액형은 " + savedData.bloodType + "형입니다.";
    }
    if (savedData.zodiac) {
      applyZodiacData(cardElement, savedData.zodiac, savedData.mbti, savedData.foodPref);
    }
    if (savedData.nation) cardElement.querySelector(".nationSelect").value = savedData.nation;
    if (savedData.species) cardElement.querySelector(".speciesSelect").value = savedData.species;
    if (savedData.lifeStage) cardElement.querySelector(".lifeStageSelect").value = savedData.lifeStage;
    if (savedData.relation) cardElement.querySelector(".relationSelect").value = savedData.relation;
  }

  const bloodButtons = cardElement.querySelectorAll(".bloodButton");
  const bloodResult = cardElement.querySelector(".bloodResult");
  bloodButtons.forEach(function(button) {
    button.onclick = function() {
      const bText = button.dataset.blood;
      cardElement.dataset.bloodType = bText;
      bloodResult.textContent = "혈액형은 " + bText + "형입니다.";
    };
  });

  const zodiacButtons = cardElement.querySelectorAll(".zodiacButton");
  zodiacButtons.forEach(function(button) {
    button.onclick = function() {
      applyZodiacData(cardElement, button.dataset.zodiac);
    };
  });

  refreshTargetOptions(cardElement, savedData ? savedData.targetName : null);
  nameInput.oninput = function() {
    refreshTargetOptions(cardElement, cardElement.querySelector(".targetSelect").value);
  };
}

function applyZodiacData(cardElement, zodiac, fixedMbti, fixedFoodPref) {
  const data = zodiacData[zodiac];
  const mbti = fixedMbti || data.mbti[Math.floor(Math.random() * data.mbti.length)];
  const foodPref = fixedFoodPref || data.food[Math.floor(Math.random() * data.food.length)];

  cardElement.dataset.zodiac = zodiac;
  cardElement.dataset.mbti = mbti;
  cardElement.dataset.foodPref = foodPref;

  cardElement.querySelector(".zodiacResult").textContent = "별자리는 " + zodiac + "입니다.";
  cardElement.querySelector(".mbtiResult").textContent = "성향은 " + mbti + "입니다.";
  cardElement.querySelector(".foodPrefResult").textContent = "선호하는 식성은 " + foodPref + "입니다.";
}

function updateCardTitlesAndCount() {
  const cards = document.querySelectorAll(".character-card");
  cards.forEach(function(card, index) {
    card.querySelector("h2").textContent = "주민 " + (index + 1);
  });
  document.getElementById("characterCount").textContent = "현재 주민: " + cards.length + " / " + maxCharacters;
}

function buildCardMarkup(savedData) {
  return `
    <button class='delete-btn' onclick='removeCharacter(this)'>✕</button>
    <h2>주민</h2>
    <p>이름을 입력해주세요.</p>
    <input type='text' class='characterNameInput' placeholder='이름' value='${savedData ? (savedData.name || "") : ""}'>

    <p style="margin-top:10px;">출신 국가</p>
    <select class='nationSelect'>
      <option value="북쪽">북쪽 (설원/수렵)</option>
      <option value="남쪽">남쪽 (해안/상업)</option>
      <option value="동쪽">동쪽 (연금술/기술)</option>
      <option value="서쪽">서쪽 (고원/석조)</option>
    </select>

    <p>혈액형을 골라주세요.</p>
    <button type="button" class='bloodButton' data-blood='A'>A형</button>
    <button type="button" class='bloodButton' data-blood='B'>B형</button>
    <button type="button" class='bloodButton' data-blood='O'>O형</button>
    <button type="button" class='bloodButton' data-blood='AB'>AB형</button>
    <p class='bloodResult'></p>

    <p>별자리</p>
    ${zodiacKeys.map(z => `<button type="button" class='zodiacButton' data-zodiac='${z}'>${z}</button>`).join("")}
    <p class='zodiacResult'></p>
    <p class='mbtiResult'></p>
    <p class='foodPrefResult'></p>

    <p style="margin-top:10px;">종족</p>
    <select class='speciesSelect'>
      <option value="인간">인간</option>
      <option value="괴물">괴물</option>
      <option value="혼혈">혼혈</option>
    </select>

    <p style="margin-top:10px;">연령대</p>
    <select class='lifeStageSelect'>
      <option value="어린이">어린이</option>
      <option value="청소년">청소년</option>
      <option value="청년">청년</option>
      <option value="중년">중년</option>
      <option value="노년">노년</option>
    </select>

    <p style="margin-top:10px;">상대 관계 선택</p>
    <select class='relationSelect'>
      <option value="지인">지인</option>
      <option value="부모">부모</option>
      <option value="자식">자식</option>
      <option value="보호자와 피보호자">보호자와 피보호자</option>
      <option value="형제자매">형제자매</option>
      <option value="친척">친척</option>
      <option value="연인">연인</option>
      <option value="친구">친구</option>
      <option value="동료">동료</option>
      <option value="은인">은인</option>
      <option value="원수">원수</option>
      <option value="경쟁자">경쟁자</option>
      <option value="전 연인">전 연인</option>
      <option value="전 배우자">전 배우자</option>
    </select>

    <p style="margin-top:10px;">관계 지명 대상</p>
    <select class='targetSelect'><option value="">(비어 있음)</option></select>
  `;
}

// 이름/혈액형/별자리가 바뀌어도 같은 주민임을 안정적으로 식별하기 위한 고유 ID
function generateCharId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function addCharacter(savedData = null) {
  const container = document.getElementById("characterContainer");
  const currentCards = container.querySelectorAll(".character-card");

  if (!savedData && currentCards.length >= maxCharacters) {
    alert("주민은 최대 " + maxCharacters + "명까지 만들 수 있습니다.");
    return;
  }

  const newCard = document.createElement("div");
  newCard.className = "character-card";
  newCard.innerHTML = buildCardMarkup(savedData);
  newCard.dataset.charId = (savedData && savedData.charId) ? savedData.charId : generateCharId();

  container.appendChild(newCard);
  setupCardEvents(newCard, savedData);
  updateCardTitlesAndCount();
  refreshAllTargetOptions();
}

function removeCharacter(button) {
  const card = button.parentElement;
  const nameInput = card.querySelector(".characterNameInput").value;
  if (nameInput) {
    if (confirm(`[${nameInput}] 주민을 영구 퇴장(사망 처리)시키고 추모 공간에 기록하시겠습니까?`)) {
      memorialList.push({ name: nameInput, date: new Date().toLocaleDateString() });
      renderMemorials();
    }
  }
  card.remove();
  updateCardTitlesAndCount();
  saveCharacters();
  refreshAllTargetOptions();
}

function resetCharacters() {
  if (!confirm("⚠️ 이 버튼은 주민뿐 아니라 소지금·아이템·생존 일지·추모 기록·의뢰까지 모든 저장 데이터를 전부 초기화합니다. 정말로 전체 데이터를 초기화하시겠습니까?")) return;
  localStorage.clear();
  location.reload();
}

// 이름도 혈액형도 아직 정해지지 않은 "완전히 빈" 카드만 찾는다 (조금이라도 입력된 카드는 절대 건드리지 않음)
function findEmptyCard() {
  const cards = document.querySelectorAll(".character-card");
  for (let card of cards) {
    const nameVal = card.querySelector(".characterNameInput").value.trim();
    if (!nameVal && !card.dataset.bloodType) return card;
  }
  return null;
}

function randomizeNewCharacter() {
  const container = document.getElementById("characterContainer");
  const emptyCard = findEmptyCard();
  const currentCards = container.querySelectorAll(".character-card");

  if (!emptyCard && currentCards.length >= maxCharacters) {
    alert("주민은 최대 " + maxCharacters + "명까지 만들 수 있습니다.");
    return;
  }

  const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + Math.floor(Math.random() * 90 + 10);
  const randomBlood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
  const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
  const randomNation = nationKeys[Math.floor(Math.random() * nationKeys.length)];
  const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
  const randomStage = lifeStagesList[Math.floor(Math.random() * lifeStagesList.length)];
  const randomRelation = relationList[Math.floor(Math.random() * relationList.length)];

  const savedData = {
    name: randomName,
    bloodType: randomBlood,
    zodiac: randomZodiac,
    nation: randomNation,
    species: randomSpecies,
    lifeStage: randomStage,
    relation: randomRelation
  };

  if (emptyCard) {
    // 빈 카드를 그대로 재사용해서 채운다 (새 카드를 만들지 않음)
    emptyCard.innerHTML = buildCardMarkup(savedData);
    emptyCard.dataset.charId = generateCharId();
    setupCardEvents(emptyCard, savedData);
    updateCardTitlesAndCount();
    refreshAllTargetOptions();
  } else {
    addCharacter(savedData);
  }

  addLog(`[주민 등록] 무작위 주민 [${randomName}](${randomSpecies}, ${randomStage}, ${randomNation})이/가 새로 등록되었습니다.`);
  saveCharacters();
}

// 관계 지명 상호 동기화: A→B 지정 시 B도 자동으로 A를 같은(반대) 관계로 지정
// 주민이 1명뿐이면 관계/지명은 항상 공란으로 강제
function syncMutualRelations(characters) {
  characters.forEach(c => {
    if (c.targetName) {
      const target = characters.find(t => t.name === c.targetName);
      if (!target) {
        // 지명 대상이 존재하지 않으면(퇴장 등) 관계를 정리
        c.targetName = "";
        c.relation = "지인";
      } else {
        const inv = relationInverseMap[c.relation] || c.relation;
        target.targetName = c.name;
        target.relation = inv;
      }
    } else {
      // 지명 대상이 없으면 관계도 항상 지인으로 통일 (대상 없이 관계만 남는 것을 방지)
      c.relation = "지인";
    }
  });
}

function saveCharacters(isSilent = false) {
  const characters = [];
  let existingChars = JSON.parse(localStorage.getItem("characters")) || [];

  document.querySelectorAll(".character-card").forEach(function(card) {
    const name = card.querySelector(".characterNameInput").value;
    const nation = card.querySelector(".nationSelect").value;
    const species = card.querySelector(".speciesSelect").value;
    const lifeStage = card.querySelector(".lifeStageSelect").value;
    const relation = card.querySelector(".relationSelect").value;
    const targetName = card.querySelector(".targetSelect") ? card.querySelector(".targetSelect").value : "";

    const bloodType = card.dataset.bloodType || "";
    const zodiac = card.dataset.zodiac || "";
    const mbti = card.dataset.mbti || "";
    const foodPref = card.dataset.foodPref || "";
    const charId = card.dataset.charId || generateCharId();
    card.dataset.charId = charId;

    // 고유 ID로 우선 식별하고, ID가 없던 예전 저장 데이터는 이름+혈액형+별자리로 한 번만 매칭
    let found = existingChars.find(c => c.charId === charId) ||
                existingChars.find(c => !c.charId && c.name === name && c.bloodType === bloodType && c.zodiac === zodiac);

    let basePower, baseAgility, baseIntel, baseLuck, assignedTraits;
    let healthNum, mentalNum, fatigueNum, hungerNum, corruptionNum, maxChildren, childCount;

    const baseInfo = { charId, name, bloodType, zodiac, mbti, foodPref, nation, species, lifeStage, relation, targetName };
    const stats = calculateMaxStats(baseInfo);

    if (found) {
      basePower = found.power ?? 50;
      baseAgility = found.agility ?? 50;
      baseIntel = found.intel ?? 50;
      baseLuck = found.luck ?? 50;
      assignedTraits = found.traits || "";
      healthNum = found.healthNum ?? stats.maxHealth;
      mentalNum = found.mentalNum ?? stats.maxMental;
      fatigueNum = found.fatigueNum ?? 50;
      hungerNum = found.hungerNum ?? stats.maxHunger;
      corruptionNum = found.corruptionNum ?? 0;
      maxChildren = found.maxChildren;
      childCount = found.childCount;
    } else {
      basePower = 50 + (bloodType === "O" ? 15 : 0) + (zodiac.includes("사자") ? 10 : 0);
      baseAgility = 50 + (bloodType === "B" ? 15 : 0) + (zodiac.includes("쌍둥이") ? 10 : 0);
      baseIntel = 50 + (bloodType === "AB" ? 15 : 0) + (zodiac.includes("처녀") ? 10 : 0);
      baseLuck = 50 + (bloodType === "A" ? 15 : 0) + (zodiac.includes("물고기") ? 10 : 0);

      let poolCopy = [...traitPool];
      let count = Math.floor(Math.random() * 3) + 1;
      let tempTraits = [];
      for (let i = 0; i < count; i++) {
        if (poolCopy.length > 0) {
          let randIdx = Math.floor(Math.random() * poolCopy.length);
          tempTraits.push(poolCopy.splice(randIdx, 1)[0]);
        }
      }
      assignedTraits = tempTraits.join(", ");
      healthNum = stats.maxHealth;
      mentalNum = stats.maxMental;
      fatigueNum = 50;
      hungerNum = stats.maxHunger;
      corruptionNum = 0;
    }

    characters.push({
      ...baseInfo,
      power: basePower, agility: baseAgility, intel: baseIntel, luck: baseLuck,
      traits: assignedTraits,
      healthNum, mentalNum, fatigueNum, hungerNum, corruptionNum,
      maxChildren, childCount
    });
  });

  syncMutualRelations(characters);

  localStorage.setItem("characters", JSON.stringify(characters));
  renderResidentMemos(characters);
  refreshAllTargetOptions();

  if (!isSilent) {
    addLog("생존 주민 명부가 갱신되었습니다.");
    alert("저장 완료!");
  }
  saveGameData();
}

function renderResidentMemos(characters) {
  const memoContainer = document.getElementById("residentMemoContainer");
  if (!characters || characters.length === 0 || !characters.some(c => c.name)) {
    memoContainer.innerHTML = "<p>등록된 주민 정보가 없습니다.</p>";
    return;
  }

  let memoHTML = "";
  characters.forEach(function(char) {
    if (!char.name) return;
    const stats = calculateMaxStats(char);

    const power = char.power ?? 50;
    const agility = char.agility ?? 50;
    const intel = char.intel ?? 50;
    const luck = char.luck ?? 50;
    const healthNum = char.healthNum ?? stats.maxHealth;
    const mentalNum = char.mentalNum ?? stats.maxMental;
    const fatigueNum = char.fatigueNum ?? 0;
    const hungerNum = char.hungerNum ?? stats.maxHunger;
    const corruptionNum = char.corruptionNum ?? 0;

    let hPct = (healthNum / stats.maxHealth) * 100;
    let mPct = (mentalNum / stats.maxMental) * 100;
    let fPct = (fatigueNum / stats.maxFatigue) * 100;
    let huPct = (hungerNum / stats.maxHunger) * 100;
    let coPct = corruptionNum; // 오염도는 0~100 고정 범위

    let stageWarning = "";
    if ((char.lifeStage === "어린이" || char.lifeStage === "청소년") && char.relation === "연인") {
      stageWarning = "<br><span style='color:red; font-weight:bold;'>⚠️ 제약: 어린이/청소년은 연인 관계 불가!</span>";
    } else if (char.lifeStage === "노년" && char.relation === "연인") {
      stageWarning = "<br><span style='color:red; font-weight:bold;'>⚠️ 제약: 노년 연인 관계 불가!</span>";
    }

    let relText = char.targetName ? `<b>${char.targetName}</b>의 ${char.relation || '지인'}` : (char.relation && char.relation !== "지인" ? char.relation : "");
    let childText = (char.maxChildren) ? `<p style="font-size:11px; color:#7b68ee;">👶 자녀 ${char.childCount || 0} / ${char.maxChildren}명</p>` : "";

    const infoLine = [char.species || '인간', char.lifeStage || '청년', char.bloodType ? char.bloodType + "형" : null, char.zodiac || null, char.mbti || null]
      .filter(Boolean).join(" / ");

    memoHTML += `
      <div class="resident-memo">
        <h3>📌 ${char.name}</h3>
        <p><b>정보:</b> ${infoLine}</p>
        <p><b>출신:</b> ${char.nation || "미상"}${nationData[char.nation] ? " (" + nationData[char.nation] + ")" : ""}</p>
        <p><b>관계:</b> <span style="color:#2b6cb0; font-weight:bold;">${relText || "(없음)"}</span>${stageWarning}</p>
        <p><b>선호 식성:</b> ${char.foodPref || "미선택"}</p>
        <p><b>생존 특성:</b> <span style="color: #d97706; font-weight: bold;">${char.traits || "없음"}</span></p>
        ${childText}
        <hr style="margin: 5px 0; border-color: #f0e6d2;">
        <p style="font-size: 12px;"><b>능력치:</b> 힘 ${power} | 민첩 ${agility} | 지능 ${intel} | 행운 ${luck}</p>

        <div class="stat-bar-container">
          <span>체력 (${healthNum}/${stats.maxHealth})</span>
          <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${hPct}%; background: #e53e3e;"></div></div>
        </div>
        <div class="stat-bar-container">
          <span>정신력 (${mentalNum}/${stats.maxMental})</span>
          <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${mPct}%; background: #3182ce;"></div></div>
        </div>
        <div class="stat-bar-container">
          <span>피로도 (${fatigueNum}/${stats.maxFatigue})</span>
          <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${fPct}%; background: #d69e2e;"></div></div>
        </div>
        <div class="stat-bar-container">
          <span>허기 (${hungerNum}/${stats.maxHunger})</span>
          <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${huPct}%; background: #38a169;"></div></div>
        </div>
        <div class="stat-bar-container" style="margin-top:8px;">
          <span>🌑 그림자 오염도 (${corruptionNum}/100)</span>
          <div class="stat-bar-bg" style="background:#2d2438; border:1px solid #4a1942;"><div class="stat-bar-fill" style="width: ${coPct}%; background: linear-gradient(90deg, #6b46c1, #1a1025);"></div></div>
        </div>
      </div>
    `;
  });
  memoContainer.innerHTML = memoHTML;
}

// ==========================================================
// 추모 공간
// ==========================================================
function renderMemorials() {
  const memorialContainer = document.getElementById("memorialContainer");
  if (memorialList.length === 0) {
    memorialContainer.innerHTML = "<p style='font-size: 13px;'>아직 추모할 인물이 없습니다.</p>";
    return;
  }

  let html = "";
  memorialList.forEach((m, idx) => {
    html += `<div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 13px; border: 1px solid #cbd5e0;">
      <span>🪦 <b>${m.name}</b> (퇴장일: ${m.date})</span>
      <button onclick="tributeMemorial(${idx})" style="padding: 4px 8px; font-size: 12px; background: #38a169;">🌸 헌화하기</button>
    </div>`;
  });
  memorialContainer.innerHTML = html;
  localStorage.setItem("memorialList", JSON.stringify(memorialList));
}

function tributeMemorial(idx) {
  let deceased = memorialList[idx];
  let chars = JSON.parse(localStorage.getItem("characters")) || [];

  if (chars.length > 0) {
    let activeRes = chars[Math.floor(Math.random() * chars.length)];
    let stats = calculateMaxStats(activeRes);
    activeRes.mentalNum = Math.min(stats.maxMental, (activeRes.mentalNum || 0) + 10);
    localStorage.setItem("characters", JSON.stringify(chars));
    renderResidentMemos(chars);
    addLog(`[추모] ${activeRes.name}은/는 고인(${deceased.name})의 묘비에 꽃을 바치며 옛일을 회상했다. (정신력 +10)`);
    alert(`${activeRes.name}이/가 ${deceased.name}의 묘비에 헌화했습니다. (정신력 +10)`);
  } else {
    addLog(`[추모] 누군가 고인(${deceased.name})의 묘비에 꽃을 바치며 옛일을 회상했다.`);
    alert("헌화 완료!");
  }
}

// ==========================================================
// 저장 / 불러오기
// ==========================================================
function saveGameData() {
  localStorage.setItem("playerMoney", playerMoney);
  localStorage.setItem("playerInventory", JSON.stringify(playerInventory));
  localStorage.setItem("eventLogsData", JSON.stringify(eventLogsData));
  localStorage.setItem("memorialList", JSON.stringify(memorialList));
  localStorage.setItem("currentQuest", JSON.stringify(currentQuest));
  localStorage.setItem("worldDay", worldDay);
  localStorage.setItem("nextEventCardDay", nextEventCardDay);
  localStorage.setItem("lastActiveTimestamp", Date.now().toString());
}

// ==========================================================
// 백업 내보내기 / 불러오기
// ==========================================================
function exportGameData() {
  const data = {
    characters: JSON.parse(localStorage.getItem("characters")) || [],
    playerMoney, playerInventory, eventLogsData, memorialList, currentQuest, worldDay, nextEventCardDay,
    lastActiveTimestamp: localStorage.getItem("lastActiveTimestamp")
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `황야의_저녁_백업_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog("[백업] 세계 데이터를 파일로 내보냈습니다.");
}

function importGameData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm("불러온 백업 파일로 현재 세계를 덮어씁니다. 계속할까요?")) return;

      localStorage.setItem("characters", JSON.stringify(data.characters || []));
      localStorage.setItem("playerMoney", data.playerMoney ?? 1000);
      localStorage.setItem("playerInventory", JSON.stringify(data.playerInventory || []));
      localStorage.setItem("eventLogsData", JSON.stringify(data.eventLogsData || []));
      localStorage.setItem("memorialList", JSON.stringify(data.memorialList || []));
      localStorage.setItem("currentQuest", JSON.stringify(data.currentQuest || null));
      localStorage.setItem("worldDay", data.worldDay || 1);
      localStorage.setItem("nextEventCardDay", data.nextEventCardDay || 0);
      if (data.lastActiveTimestamp) localStorage.setItem("lastActiveTimestamp", data.lastActiveTimestamp);

      alert("불러오기 완료! 페이지를 새로고침합니다.");
      location.reload();
    } catch (err) {
      alert("파일을 읽는 중 오류가 발생했습니다. 올바른 백업 파일(.json)인지 확인해주세요.");
    }
  };
  reader.readAsText(file);
}

function loadGameData() {
  const savedMoney = localStorage.getItem("playerMoney");
  if (savedMoney !== null) playerMoney = parseInt(savedMoney);

  const savedInv = localStorage.getItem("playerInventory");
  if (savedInv) playerInventory = JSON.parse(savedInv);

  const savedDay = localStorage.getItem("worldDay");
  if (savedDay !== null) worldDay = parseInt(savedDay);
  updateDayDisplay();

  const savedNextEvent = localStorage.getItem("nextEventCardDay");
  nextEventCardDay = savedNextEvent !== null ? parseInt(savedNextEvent) : 0;

  const savedLogs = localStorage.getItem("eventLogsData");
  if (savedLogs) {
    eventLogsData = JSON.parse(savedLogs);
    renderLogView();
  }

  // saveCharacters(true)/saveGameData()가 lastActiveTimestamp를 "지금"으로 덮어쓰기 전에
  // 반드시 먼저 지난 시간을 계산해야 한다 (순서가 바뀌면 경과 시간이 항상 0으로 계산됨)
  processOfflineElapsedTime();

  const savedMemorials = localStorage.getItem("memorialList");
  if (savedMemorials) {
    memorialList = JSON.parse(savedMemorials);
    renderMemorials();
  }

  const savedQuest = localStorage.getItem("currentQuest");
  if (savedQuest) currentQuest = JSON.parse(savedQuest);
  updateQuestUI();

  const savedCharacters = JSON.parse(localStorage.getItem("characters"));
  const container = document.getElementById("characterContainer");
  container.innerHTML = "";

  if (!savedCharacters || savedCharacters.length === 0) {
    addCharacter();
  } else {
    savedCharacters.forEach(function(characterData) {
      addCharacter(characterData);
    });
  }

  updateCardTitlesAndCount();
  saveCharacters(true); // 능력치/스탯 기본값을 즉시 계산해 undefined 표시를 방지 (이 시점에 lastActiveTimestamp가 "지금"으로 갱신됨)
  updateBagDisplay();
}

document.addEventListener("DOMContentLoaded", function() {
  loadGameData();
});
