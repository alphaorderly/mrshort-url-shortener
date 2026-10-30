(function () {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  } catch (_) {
    // 저장소를 쓸 수 없으면 시스템 설정을 따른다.
  }
})();
