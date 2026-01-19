// app.js
// ※ 주의: 이 예시는 "프론트엔드(브라우저)에서" 계정/비번을 조회하는 구조라
//        실제 배포용으로는 보안상 매우 위험합니다.
//        (다음 단계에서 서버+인증 방식으로 바꾸는 걸 추천)
//        일단 요청하신 기능 구현(검색/엔터/표시/숨김/복사/초기화)만 완성해둡니다.

(() => {
  // ===== 1) 샘플 데이터 (여기에 학생-계정 매핑을 넣으세요) =====
  // - studentNo(학번), name(이름) 기준으로 검색합니다.
  // - googleId / googlePw 값을 바꿔서 사용하세요.
  const ACCOUNTS = [
    { studentNo: "10501", name: "홍길동", googleId: "s10501@school.kr", googlePw: "pw-10501" },
    { studentNo: "10502", name: "김하늘", googleId: "s10502@school.kr", googlePw: "pw-10502" },
    // { studentNo: "....", name: "....", googleId: "....", googlePw: "...." },
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
  const normalizeName = (s) => normalize(s).replace(/\s+/g, ""); // 이름 공백 제거 정도만

  const setMessage = (text, type = "error") => {
    // type: "error" | "ok" | "info"
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
    const no = normalize(studentNo);
    const nm = normalizeName(name);

    return (
      ACCOUNTS.find(
        (a) => normalize(a.studentNo) === no && normalizeName(a.name) === nm
      ) || null
    );
  };

  // ===== 5) 이벤트: 검색(Submit) =====
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentNo = normalize(studentNoInput.value);
    const studentName = normalize(studentNameInput.value);

    // 간단 검증
    if (!studentNo || !studentName) {
      setMessage("학번과 이름을 모두 입력해 주세요.", "error");
      hideResult();
      return;
    }

    const found = findAccount(studentNo, studentName);

    if (!found) {
      setMessage("일치하는 정보가 없습니다. 학번/이름을 확인해 주세요.", "error");
      hideResult();
      return;
    }

    showResult(found);
  });

  // ===== 6) 이벤트: 초기화 =====
  resetBtn.addEventListener("click", () => {
    form.reset();
    setMessage("", "info");
    hideResult();
    studentNoInput.focus();
  });

  // ===== 7) 이벤트: PW 표시/숨김 =====
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

  // ===== 8) 이벤트: 복사 =====
  copyBtn.addEventListener("click", async () => {
    if (!lastFound) {
      setMessage("먼저 검색을 진행해 주세요.", "info");
      return;
    }

    const textToCopy = `Google ID: ${lastFound.googleId}\nPW: ${lastFound.googlePw}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setMessage("클립보드에 복사했어요.", "ok");
    } catch (err) {
      // 일부 환경(보안/권한)에서 clipboard API가 막힐 수 있어 fallback
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

  // ===== 9) 초기 화면 =====
  hideResult();
  setMessage("", "info");
})();
