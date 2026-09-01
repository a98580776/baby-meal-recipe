-- APPLIED 2026-09-01
-- ingredient_tips: 재료별 실전 TIP 콘텐츠. 신규 테이블(이 프로젝트 최초 — schema-freeze.md §3
-- 절차 및 docs/claude-desktop-handoff/2026-09-01-ingredient-tips-schema-design.md §3 검토를
-- 거쳐 승인됨을 전제). 기존 14개 테이블/6개 enum/컬럼/FK/제약은 전혀 변경하지 않는 순수
-- additive 변경. 스키마만 포함하며 파일럿 재료 TIP 데이터 INSERT는 포함하지 않는다(후속 작업).

create table ingredient_tips (
  id text primary key,
  ingredient_id text not null references ingredients (id),
  category text not null,
  body_ko text not null,
  sort_order integer not null default 0,
  status verification_status not null default 'NEEDS_REVIEW',
  evidence_id text references evidence (id),
  source_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_tips_basis_required
    check (evidence_id is not null or source_note is not null)
);

create index ingredient_tips_ingredient_id_idx on ingredient_tips (ingredient_id);

create trigger ingredient_tips_set_updated_at
  before update on ingredient_tips
  for each row execute function set_updated_at();

-- RLS: 0002_rls_public_read.sql과 동일한 공개 read 정책(공유 참조 데이터, 사용자 소유 아님).
alter table ingredient_tips enable row level security;
create policy "public read ingredient_tips" on ingredient_tips for select using (true);
