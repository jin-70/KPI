/* 화면이나 저장소와 독립적인 계산, 입력 검사, 샘플 데이터 */
(function (root) {
  'use strict';
  const SAMPLE = [
    { month: '2026-09', department: '영업A', target: 10000000, actual: 9000000 },
    { month: '2026-09', department: '영업B', target: 8000000, actual: 8800000 },
    { month: '2026-09', department: '영업C', target: 12000000, actual: 10800000 },
    { month: '2026-10', department: '영업A', target: 10000000, actual: 11000000 },
    { month: '2026-10', department: '영업B', target: 8000000, actual: 7200000 },
    { month: '2026-10', department: '영업C', target: 12000000, actual: 12600000 }
  ];

  function amount(value) {
    if (value && typeof value === 'object') throw new Error('수식·객체 값은 사용할 수 없습니다.');
    const text = String(value ?? '').trim();
    const normalized = /^\d{1,3}(,\d{3})+$/.test(text) ? text.replaceAll(',', '') : text;
    const parsed = Number(normalized);
    if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error('금액은 0 이상의 안전한 정수여야 합니다.');
    }
    return parsed;
  }

  function validateRecord(row) {
    const month = String(row.month ?? '').trim();
    const department = String(row.department ?? '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('월은 YYYY-MM 형식이어야 합니다.');
    if (!department || [...department].length > 80) throw new Error('부서는 1~80자여야 합니다.');
    const evidence = String(row.evidence ?? '').trim();
    if ([...evidence].length > 500) throw new Error('근거는 500자 이하여야 합니다.');
    return { month, department, target: amount(row.target), actual: amount(row.actual), evidence };
  }

  function summarize(rows) {
    const target = rows.reduce((sum, row) => sum + BigInt(amount(row.target)), 0n);
    const actual = rows.reduce((sum, row) => sum + BigInt(amount(row.actual)), 0n);
    const hundredths = target === 0n ? null : (actual * 10000n + target / 2n) / target;
    let rate = '목표 미설정';
    if (hundredths !== null) {
      const fraction = String(hundredths % 100n).padStart(2, '0').replace(/0+$/, '');
      rate = String(hundredths / 100n) + (fraction ? '.' + fraction : '') + '%';
    }
    return { target: String(target), actual: String(actual), count: rows.length, rate };
  }

  root.KPICore = { SAMPLE, amount, validateRecord, summarize };
})(window);
