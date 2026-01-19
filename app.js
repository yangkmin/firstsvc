// app.js (로컬 데이터 + Inko 이름 보정)

(() => {
  // ===== 0) Inko 준비 =====
  // CDN이 정상 로드되면 window.Inko가 존재합니다.
  const inko = (typeof Inko !== "undefined") ? new Inko() : null;

  // ===== 1) 로컬 데이터 (여기에 실제 매핑을 넣으세요) =====
  const ACCOUNTS = [
    { studentNo: "10501", name: "홍길동", googleId: "s10501@school.kr", googlePw: "pw-10501" },
    { studentNo: "10502", name: "김하늘", googleId: "s10502@school.kr", googlePw: "pw-10502" },
  ];

  // ===== 2) DOM =====
  const form = document.getElementById("searchForm");
  const studentNoInput = document.getElementById("studentNo");
  const studentNameInput = document.getElementById("studentName");

  const resetBtn = document.getElementById("resetBtn");

  const messageEl = document.getElementById("message");
  const resultArea = document.getElementById("resultArea");
  const resultIdEl = document.getElementById("resultId");
  const resultPwEl = document.getElementById("resultPw");

  const togglePwBtn = document.getElementById("togglePwBtn");
  const copyBtn = document.getElementById("copyBtn");

  // ===== 3) 상태 =====
  let lastFound = null;
  let pwHidden = true;

  // ===== 4) 유틸 =====
  const normalize = (s) => String(s ?? "").trim();
  const normalizeStudentNo = (s) => normalize(s).replace(/\D/g, ""); // 숫자만

  // ✅ 핵심: 이름 정규화(공백 제거 + 영문타이핑->한글 변환)
  function normalizeNameSmart(input) {
    const raw = normalize(input).replace(/\s+/g, "");
    if (!raw) return "";

    // 이미 한글이 포함되면 그대로(혼합 입력은 변환 안 하는 게 안전)
    if (/[가-힣]/.test(raw)) return raw;

    // Inko 없으면 그냥 반환
    if (!inko) return raw;

    // 영문 자판으로 친 한글을 변환 시도
    const converted = inko.en2ko(raw);

    // 변환 결과에 한글이 생기면 변환값 사용, 아니면 원본 유지
    return /[가-힣]/.test(converted) ? converted : raw;
  }

  const setMessage = (text, type = "error") => {
    messageEl.textContent = text;
    if (!text) {
      messageEl.style.color = "";
      return;
    }
    if (type === "ok") messageEl.style.color = "#2e7d32";
    else if (type === "info") messageEl.style.color = "#555";
    else messageEl.style.color = "#ff6b6b";
  };

  const hideResult = () => {
    resultArea.hidden = true;
    resultIdEl.textContent = "-";
    resultPwEl.textContent = "-";
    lastFound = null;
    pwHidden = true;
  };

  const maskPw = (pw) => "•".repeat(Math.max(6, String(pw).length));

  const showResult = (account) => {
    lastFound = account;
    resultArea.hidden = false;

    resultIdEl.textContent = account.googleId;
    pwHidden = true;
    resultPwEl.textContent = maskPw(account.googlePw);

    setMessage("조회되었습니다.", "ok");
  };

  const findAccount = (studentNo, name) => {
    const no = normalizeStudentNo(studentNo);
    const nm = normalizeNameSmart(name);

    return (
      ACCOUNTS.find((a) => {
        const rowNo = normalizeStudentNo(a.studentNo);
        const rowName = normalizeNameSmart(a.name);
        return rowNo === no && rowName === nm;
      }) || null
    );
  };

  // ===== 5) 이벤트: 이름 입력 보정(선택 UX) =====
  // - 학생이 ghdrlfehd 치고 포커스를 빼면 자동으로 홍길동으로 바뀜
  studentNameInput.addEventListener("blur", () => {
    const fixed = normalizeNameSmart(studentNameInput.value);
    if (fixed) studentNameInput.value = fixed;
  });

  // ===== 6) 이벤트: 검색(Submit=버튼/엔터) =====
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentNo = normalizeStudentNo(studentNoInput.value);
    const studentName = normalizeNameSmart(studentNameInput.value);

    if (!studentNo || !studentName) {
      setMessage("학번과 이름을 모두 입력해 주세요.", "error");
      hideResult();
      return;
    }

    const found = findAccount(studentNo, studentName);

    if (!found) {
      // 혹시 Inko가 로드 안 됐을 때를 안내(선택)
      if (!inko) {
        setMessage("일치하는 정보가 없습니다. (Inko 로드 확인: 스크립트 순서)", "error");
      } else {
        setMessage("일치하는 정보가 없습니다. 학번/이름을 확인해 주세요.", "error");
      }
      hideResult();
      return;
    }

    showResult(found);
  });

  // ===== 7) 이벤트: 초기화 =====
  resetBtn.addEventListener("click", () => {
    form.reset();
    setMessage("", "info");
    hideResult();
    studentNoInput.focus();
  });

  // ===== 8) 이벤트: PW 표시/숨김 =====
  togglePwBtn.addEventListener("click", () => {
    if (!lastFound) {
      setMessage("먼저 검색을 진행해 주세요.", "info");
      return;
    }

    pwHidden = !pwHidden;
    resultPwEl.textContent = pwHidden
      ? maskPw(lastFound.googlePw)
      : lastFound.googlePw;
  });

  // ===== 9) 이벤트: 복사 =====
  copyBtn.addEventListener("click", async () => {
    if (!lastFound) {
      setMessage("먼저 검색을 진행해 주세요.", "info");
      return;
    }

    const textToCopy = `Google ID: ${lastFound.googleId}\nPW: ${lastFound.googlePw}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setMessage("클립보드에 복사했어요.", "ok");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setMessage("클립보드에 복사했어요.", "ok");
      } catch {
        setMessage("복사에 실패했어요. 브라우저 권한을 확인해 주세요.", "error");
      }
    }
  });

  // ===== 10) 초기화 =====
  hideResult();
  setMessage("", "info");
})();
