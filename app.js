'use strict';
(() => {
  const C = window.KPICore;
  const $ = id => document.getElementById(id);
  const sampleRows = C.SAMPLE.map((record, index) => ({ ...record, evidence: '', id: `sample-${index}` }));
  const format = value => BigInt(value).toLocaleString('ko-KR');
  let rows = sampleRows;
  let repository = null;
  let mode = 'sample';
  let busy = false;

  function setOptions(id, values) {
    const select = $(id);
    const previous = select.value;
    select.replaceChildren(new Option('전체', ''));
    [...new Set(values)].sort().forEach(value => select.add(new Option(value, value)));
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }
  function setStatus(label, detail, error = false) {
    $('mode-label').textContent = label;
    $('mode-detail').textContent = detail;
    $('mode-detail').classList.toggle('error-text', error);
  }
  function draw() {
    const visible = rows.filter(row => (!$('filter-month').value || row.month === $('filter-month').value) && (!$('filter-team').value || row.department === $('filter-team').value));
    const total = C.summarize(visible);
    $('total-target').textContent = format(total.target) + '원';
    $('total-actual').textContent = format(total.actual) + '원';
    $('total-rate').textContent = total.rate;
    $('total-count').textContent = total.count + '건';
    $('rows').replaceChildren(); $('chart').replaceChildren(); $('empty').hidden = visible.length > 0;
    for (const row of visible) {
      const summary = C.summarize([row]); const tr = document.createElement('tr');
      for (const [value, numeric] of [[row.month, false], [row.department, false], [format(row.target), true], [format(row.actual), true], [summary.rate, false], [row.evidence || '—', false]]) {
        const td = document.createElement('td'); td.textContent = value; if (numeric) td.className = 'num'; tr.append(td);
      }
      $('rows').append(tr);
    }
    for (const department of [...new Set(visible.map(row => row.department))]) {
      const summary = C.summarize(visible.filter(row => row.department === department)); const bar = document.createElement('div'); bar.className = 'barrow';
      const label = document.createElement('span'); label.textContent = department;
      const track = document.createElement('div'); track.className = 'track'; const fill = document.createElement('div'); fill.className = 'fill';
      fill.style.width = (summary.rate === '목표 미설정' ? 0 : Math.min(100, Number(summary.rate.slice(0, -1)))) + '%'; track.append(fill);
      const rate = document.createElement('span'); rate.textContent = summary.rate; bar.append(label, track, rate); $('chart').append(bar);
    }
  }
  function renderAuth() {
    const ready = Boolean(repository); $('auth-panel').hidden = !ready; $('show-entry').hidden = mode !== 'database';
    $('sign-in').hidden = mode === 'database'; $('sign-up').hidden = mode === 'database'; $('sign-out').hidden = mode !== 'database';
    for (const id of ['auth-email', 'auth-password', 'sign-in', 'sign-up', 'sign-out', 'show-entry']) $(id).disabled = busy;
  }
  async function useSample(reason = '') {
    mode = 'sample'; rows = sampleRows; $('auth-status').textContent = reason ? `DB 미연결: ${reason} 샘플 모드를 사용합니다. 샘플은 저장되지 않습니다.` : '샘플 자료는 저장되지 않습니다.';
    setStatus('샘플 모드 · DB 미연결', reason || '가상 6건입니다. 샘플 행은 DB에 자동 저장하지 않습니다.', Boolean(reason));
    setOptions('filter-month', rows.map(row => row.month)); setOptions('filter-team', rows.map(row => row.department)); $('filter-month').value = '2026-10'; $('filter-team').value = '';
    renderAuth(); draw();
  }
  async function loadOwnRows() {
    if (!repository) return useSample('Supabase 연결 설정이 없습니다.');
    busy = true; renderAuth();
    try {
      const user = await repository.getUser(); if (!user) return await useSample('로그인 전입니다.');
      rows = await repository.list(); mode = 'database';
      $('auth-status').textContent = `로그인됨 · ${user.email || '계정 확인됨'} · 본인 자료 ${rows.length}건`;
      setStatus('DB 모드 · 로그인됨', '본인 계정 자료만 조회합니다. 저장은 사용자가 입력한 행에만 수행됩니다.');
      setOptions('filter-month', rows.map(row => row.month)); setOptions('filter-team', rows.map(row => row.department)); renderAuth(); draw();
    } catch (error) { await useSample(error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.'); }
    finally { busy = false; renderAuth(); }
  }
  async function authenticate(action) {
    const email = $('auth-email').value.trim(), password = $('auth-password').value;
    if (!email || !password) { $('auth-status').textContent = '이메일과 비밀번호를 입력하세요.'; return; }
    busy = true; renderAuth();
    try {
      if (action === 'signup') {
        const result = await repository.signUp(email, password);
        if (!result.session) {
          await useSample('가입 요청을 받았습니다. 이메일 인증이 설정되어 있다면 인증을 마친 뒤 로그인하세요.');
          $('auth-status').textContent = '가입 요청 결과를 확인하세요. 이메일 인증 후 로그인할 수 있습니다.';
          return;
        }
      } else await repository.signIn(email, password);
      await loadOwnRows();
    }
    catch (error) { $('auth-status').textContent = error instanceof Error ? error.message : '인증 요청에 실패했습니다.'; }
    finally { busy = false; renderAuth(); }
  }
  setOptions('filter-month', sampleRows.map(row => row.month)); setOptions('filter-team', sampleRows.map(row => row.department)); $('filter-month').value = '2026-10';
  $('filter-month').addEventListener('change', draw); $('filter-team').addEventListener('change', draw);
  $('filter-reset').addEventListener('click', () => { $('filter-month').value = ''; $('filter-team').value = ''; draw(); });
  $('auth-form').addEventListener('submit', event => { event.preventDefault(); authenticate('signin'); });
  $('sign-up').addEventListener('click', () => authenticate('signup'));
  $('sign-out').addEventListener('click', async () => { busy = true; renderAuth(); try { await repository.signOut(); await useSample('로그아웃했습니다.'); } catch (error) { setStatus('DB 모드 · 로그아웃 오류', error.message, true); } finally { busy = false; renderAuth(); } });
  $('show-entry').addEventListener('click', () => { $('entry-form').reset(); $('entry-form').elements.month.value = $('filter-month').value || new Date().toISOString().slice(0, 7); $('entry-error').textContent = ''; $('entry-dialog').showModal(); });
  $('cancel-entry').addEventListener('click', () => $('entry-dialog').close());
  $('entry-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      const input = C.validateRecord({ month: form.get('month'), department: form.get('department'), target: form.get('target'), actual: form.get('actual'), evidence: form.get('evidence') });
      busy = true; renderAuth(); const saved = await repository.add(input); rows = await repository.list(); mode = 'database';
      setOptions('filter-month', rows.map(row => row.month)); setOptions('filter-team', rows.map(row => row.department)); $('filter-month').value = saved.month; $('filter-team').value = saved.department;
      $('entry-dialog').close(); $('auth-status').textContent = '저장 응답과 재조회에서 본인 행을 확인했습니다.';
      setStatus('DB 모드 · 저장 확인됨', '저장된 본인 행을 재조회해 입력값과 대조했습니다.'); draw();
    } catch (error) { $('entry-error').textContent = error instanceof Error ? error.message : '저장에 실패했습니다.'; }
    finally { busy = false; renderAuth(); }
  });
  draw();
  try { repository = window.KPISupabaseRepository.createSupabaseRepository(window.KPI_CONFIG); renderAuth(); loadOwnRows(); }
  catch (error) { repository = null; renderAuth(); useSample(error instanceof Error ? error.message : 'Supabase 설정을 사용할 수 없습니다.'); }
})();
