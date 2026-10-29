/* Supabase 접근 경계. 실제 DB 값은 config.js의 공개 URL/anon 키만 사용합니다. */
(function (root) {
  'use strict';

  function isSecretKey(value) {
    if (/^sb_secret_/i.test(value)) return true;
    const parts = value.split('.');
    if (parts.length !== 3 || typeof root.atob !== 'function') return false;
    try {
      const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(root.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  }

  function createSupabaseRepository(config) {
    const sdk = root.supabase;
    if (!sdk?.createClient) throw new Error('Supabase 라이브러리를 불러오지 못했습니다. 온라인 상태를 확인하세요.');
    if (!config || !/^https:\/\//.test(config.apiBaseUrl || '') || !config.publicClientKey || /YOUR_|REPLACE_ME/i.test(config.publicClientKey)) {
      throw new Error('config.js에 Supabase 프로젝트 URL과 공개 anon/publishable 키를 설정해야 합니다.');
    }
    if (isSecretKey(config.publicClientKey)) {
      throw new Error('service_role 또는 secret 키는 브라우저에서 사용할 수 없습니다. 공개 anon/publishable 키로 바꾸세요.');
    }
    const client = sdk.createClient(config.apiBaseUrl, config.publicClientKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    async function currentUser() {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data.user || null;
    }

    function safeWon(value, fieldName) {
      try {
        return root.KPICore.amount(String(value));
      } catch {
        throw new Error(`DB ${fieldName} 금액이 안전한 정수 범위를 벗어났습니다.`);
      }
    }

    return {
      client,
      async getUser() { return currentUser(); },
      async signIn(email, password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
      },
      async signUp(email, password) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        return data;
      },
      async signOut() {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
      async list() {
        const user = await currentUser();
        if (!user) throw new Error('로그인해야 DB 자료를 조회할 수 있습니다.');
        const { data, error } = await client.from('kpi_monthly')
          .select('id,user_id,month,department,target_won,actual_won,evidence,created_at')
          .eq('user_id', user.id)
          .order('month', { ascending: false })
          .order('department', { ascending: true });
        if (error) throw error;
        if ((data || []).some(row => row.user_id !== user.id)) throw new Error('본인 소유가 아닌 자료가 응답에 포함되어 조회를 중단했습니다.');
        return (data || []).map(row => ({
          id: row.id,
          user_id: row.user_id,
          month: String(row.month).slice(0, 7),
          department: row.department,
          target: safeWon(row.target_won, '목표'),
          actual: safeWon(row.actual_won, '실적'),
          evidence: row.evidence || ''
        }));
      },
      async add(input) {
        const user = await currentUser();
        if (!user) throw new Error('로그인해야 DB에 저장할 수 있습니다.');
        const record = root.KPICore.validateRecord(input);
        const payload = {
          user_id: user.id,
          month: `${record.month}-01`,
          department: record.department,
          target_won: record.target,
          actual_won: record.actual,
          evidence: record.evidence
        };
        const { data, error } = await client.from('kpi_monthly')
          .insert(payload)
          .select('id,user_id,month,department,target_won,actual_won,evidence,created_at')
          .single();
        if (error) throw error;
        if (!data || data.user_id !== user.id) throw new Error('저장 응답의 소유자 확인에 실패했습니다.');
        const reloaded = await this.list();
        const saved = reloaded.find(row => row.id === data.id);
        if (!saved || saved.user_id !== user.id || saved.month !== record.month || saved.department !== record.department || saved.target !== record.target || saved.actual !== record.actual || saved.evidence !== record.evidence) {
          throw new Error('저장 응답과 본인 데이터 재조회 결과가 일치하지 않습니다.');
        }
        return saved;
      }
    };
  }

  root.KPISupabaseRepository = { createSupabaseRepository };
})(window);
