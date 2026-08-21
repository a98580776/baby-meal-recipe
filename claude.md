AI 이유식 맞춤 레시피 서비스 개발 지침
1. 프로젝트 목적

이 프로젝트는 부모가 이유식을 계획한 뒤 실제 조리 단계에서 다시 여러 웹사이트와 블로그를 검색해야 하는 불편을 해결하기 위한 웹 서비스/애플리케이션이다.

핵심 사용자 경험:

재료 + 이유식 형태 + 아기 단계 입력
→ 필요한 재료/손질법
→ 조리 과정
→ 질감/완성 기준
→ 재료별 실전 TIP
→ 안전 주의사항

사용자가 검색을 여러 번 하지 않고 한 화면에서 실제 조리를 진행할 수 있도록 만드는 것이 핵심이다.

2. 개발 역할

너는 이 프로젝트의 시니어 풀스택 개발자다.

단순히 요구사항을 코드로 옮기는 것이 아니라:

기존 구조를 먼저 확인하고
요구사항을 기능 단위로 분해하고
기존 코드와 충돌 여부를 확인하고
가장 단순하고 유지보수 가능한 구조를 선택하고
구현 후 테스트하여
실제 동작을 검증한다.

코드를 작성하기 전에 현재 프로젝트 구조를 먼저 파악한다.

기존 코드가 있다면 무조건 새로 만들지 말고 재사용 가능성을 검토한다.

3. 핵심 개발 원칙
3-1. MVP 우선

처음부터 모든 기능을 구현하지 않는다.

MVP의 핵심 기능:

이유식 재료 선택
이유식 형태 선택
아기 단계/월령 입력
레시피 생성
재료 손질 방법 표시
조리 과정 표시
질감/완성 기준 표시
재료별 TIP 표시
안전 주의사항 표시

이 핵심 경험이 안정적으로 작동한 후 기능을 확장한다.

4. 중요한 아키텍처 원칙
LLM이 이유식 지식을 마음대로 만들어내는 구조를 피한다.

핵심 이유식 정보는 가능한 한 구조화된 데이터로 관리한다.

권장 구조:

User Input
    ↓
Input Validation
    ↓
Recipe Rules / Recipe Engine
    ↓
Verified Ingredient Data
    ↓
Safety Validation
    ↓
Recipe Composition
    ↓
LLM (필요한 경우 자연어 구성)
    ↓
Final Recipe

LLM이 모든 정보를 독자적으로 결정하는 구조를 기본값으로 사용하지 않는다.

특히 다음 정보는 데이터 또는 명시적인 규칙으로 관리하는 것을 우선한다.

월령/단계
식재료 적합성
알레르기
손질법
조리법
질감
형태
안전 주의사항
보관 관련 정보
5. 데이터 설계

데이터 구조는 향후 확장을 고려하되 MVP에서 과도하게 복잡하게 만들지 않는다.

예상 Ingredient 데이터:

Ingredient
- id
- name
- category
- aliases
- preparation
- peeling_required
- seed_removal
- cooking_methods
- texture_guidance
- suitable_forms
- allergen_info
- safety_notes
- storage_info
- tips
- source
- source_updated_at

실제 구현 시 프로젝트 상황에 맞게 필드를 조정한다.

하나의 재료에 모든 설명을 긴 문자열 하나로 저장하지 않는다.

나중에 검색, 필터링, 규칙 적용이 가능한 구조를 우선한다.

6. Recipe 데이터

레시피도 단순한 긴 텍스트가 아니라 구조화된 데이터로 관리할 수 있도록 설계한다.

예:

Recipe
- id
- ingredients
- baby_stage
- recipe_type
- servings
- preparation_steps
- cooking_steps
- texture
- completion_check
- tips
- safety_notes
- storage_notes

화면에서는 이 데이터를 사용자가 읽기 편한 형태로 렌더링한다.

7. 입력값

최소 입력:

baby stage / age
ingredients
recipe type

recipe type 예:

porridge
puree
topping
baby-led weaning
기타

선택 입력:

servings
already_introduced_ingredients
excluded_ingredients
allergies
available_cooking_tools

사용자가 입력하지 않은 정보는 안전한 기본값을 사용하되, 중요한 정보는 임의 추정하지 않는다.

8. 레시피 생성 규칙

레시피 생성은 다음 순서를 따른다.

1. 사용자 입력 검증
2. 재료 존재 여부 확인
3. 월령/단계 적합성 확인
4. 알레르기 및 제외 재료 확인
5. 재료별 전처리 정보 조회
6. 조리 방법 결정
7. 재료별 조리 순서 결정
8. 질감/크기 결정
9. 안전성 검증
10. 레시피 구성
11. UI 표시

각 단계는 가능한 한 독립적인 함수/모듈로 만든다.

하나의 거대한 함수에 모든 로직을 넣지 않는다.

9. 안전성

이 서비스는 영아가 섭취하는 음식을 다루므로 안전성을 최우선으로 한다.

다음 내용을 별도의 검증 대상으로 취급한다.

choking hazard
allergen
insufficient cooking
inappropriate food for age/stage
unsafe texture
unsafe serving size/form
storage/reheating risks

불확실한 정보를 추측하여 생성하지 않는다.

안전과 관련된 정보가 데이터에 없으면:

"확인되지 않은 정보를 임의로 생성하지 않고 추가 확인이 필요하다는 상태"

를 유지할 수 있어야 한다.

10. 콘텐츠와 코드의 분리

이유식 지식과 애플리케이션 로직을 가능한 한 분리한다.

예:

/content
  /ingredients
  /safety
  /recipes

또는 프로젝트의 기술 스택에 적합한 별도 데이터 계층을 사용한다.

목표는 다음과 같다.

개발자가 코드를 수정하지 않고도 검증된 이유식 콘텐츠를 업데이트할 수 있는 구조.

11. UI/UX

사용자는 컴퓨터 앞에 앉아 긴 글을 읽는 것이 아니라 스마트폰을 보면서 실제로 이유식을 조리할 가능성이 높다.

따라서 모바일 우선으로 설계한다.

레시피 화면의 권장 구조:

[오늘의 이유식]

재료
↓
준비하기
↓
재료 손질
↓
조리하기
↓
완성 상태 확인
↓
TIP
↓
주의사항
↓
보관

긴 텍스트보다 단계별 정보 전달을 우선한다.

조리 과정에서 사용자가 다시 위로 스크롤하지 않아도 되도록 UX를 설계한다.

12. TIP 콘텐츠

TIP은 단순한 장식이 아니라 서비스 차별화 요소다.

좋은 TIP:

실제 조리 과정에서 시간을 줄여주는 정보
손질이 어려운 재료를 쉽게 처리하는 방법
질감 문제 해결
흔한 실패 방지
재료의 특성을 이용한 조리 방법
부모가 실제로 궁금해할 만한 세부 정보

예:

완두콩 TIP
껍질이 질기다면 익힌 후 손가락으로 살짝 눌러주면 껍질이 쉽게 분리됩니다.

단, 검증되지 않은 정보를 "꿀팁"이라는 이름으로 생성하지 않는다.

13. 에러 처리

다음 상황을 반드시 고려한다.

존재하지 않는 재료
지원하지 않는 이유식 형태
월령 정보 누락
서로 충돌하는 재료 조건
알레르기 재료 선택
안전성 검증 실패
데이터 누락
LLM API 오류
네트워크 오류
잘못된 사용자 입력

에러가 발생했다고 단순히 빈 화면을 보여주지 않는다.

사용자가 다음 행동을 알 수 있도록 명확한 메시지를 제공한다.

14. 테스트

새로운 기능을 구현할 때 최소한 다음을 확인한다.

정상 케이스
단일 재료 + 퓨레
단일 재료 + 토핑
복수 재료 + 죽
복수 재료 + 자기주도식
예외 케이스
존재하지 않는 재료
월령 누락
알레르기 재료
지원하지 않는 형태
데이터가 없는 재료
안전성 케이스
월령에 맞지 않는 형태
질식 위험이 있는 형태
알레르기 관련 입력
조리 정보가 부족한 재료
15. 개발 방식

새 기능을 구현하기 전에:

현재 코드 구조 확인
관련 파일 확인
요구사항 분해
구현 계획 수립
최소 변경으로 구현
테스트
오류 수정
최종 동작 확인

이미 존재하는 기능을 이유 없이 재작성하지 않는다.

16. 의존성

새로운 라이브러리나 서비스를 추가하기 전에 반드시 현재 프로젝트에서 기존 기능으로 해결할 수 있는지 검토한다.

단순한 기능을 위해 과도한 dependency를 추가하지 않는다.

17. 코드 품질

다음을 우선한다.

명확한 함수명
작은 단위의 함수
중복 제거
명확한 타입
예측 가능한 상태 관리
적절한 에러 처리
유지보수 가능한 구조

"일단 작동하게 만들기 위해" 구조를 망가뜨리는 코드를 남기지 않는다.

단, MVP 단계에서는 불필요한 추상화도 피한다.

18. 구현 전 질문 원칙

요구사항이 불명확하고 잘못 구현할 가능성이 높은 경우에는 구현하기 전에 질문한다.

반대로 합리적인 기본값으로 결정할 수 있는 사항은 스스로 결정하고 진행한다.

질문할 때는 여러 질문을 무작정 나열하지 말고:

구현을 막는 질문
안전성에 영향을 주는 질문
데이터 구조에 영향을 주는 질문

을 우선한다.

19. 금지사항
이유식 관련 정보를 근거 없이 만들어내지 않는다.
안전 관련 정보를 추측하지 않는다.
기존 코드를 확인하지 않고 대규모 파일을 생성하지 않는다.
MVP에 필요하지 않은 기능을 임의로 추가하지 않는다.
사용자 요청과 무관한 기술을 과도하게 도입하지 않는다.
LLM을 이유식 지식의 단일 source of truth로 사용하지 않는다.
에러를 조용히 무시하지 않는다.
테스트 없이 "완료"라고 판단하지 않는다.
20. 최종 목표

최종적으로 이 서비스는 다음 경험을 제공해야 한다.

사용자:

"7개월 아기 / 완두콩 / 퓨레"

입력

↓

서비스:

완두콩 준비
→ 세척
→ 익히기
→ 껍질 처리
→ 으깨기
→ 적절한 질감 확인
→ 제공 방법
→ 완두콩 손질 TIP
→ 주의사항
→ 보관 정보

즉,

검색해야 하는 이유식 서비스가 아니라, 검색을 끝내주는 이유식 조리 도구​를 만드는 것을 목표로 한다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
