# 작은 발자국 · 강아지의 삶

어디서, 누구에게서 태어날지 모르는 강아지 한 마리의 일생을 따라가는 브라우저 시뮬레이션 게임입니다. 태어나고, 자라고, 사람과 다른 개를 만나고, 늙어 가는 과정을 하루 단위로 진행하며, 중요한 순간에는 플레이어가 선택합니다.

## 특징

- **12개 국가, 다양한 출발점**: 대한민국·일본·인도·미국·튀르키예·캐나다·브라질·멕시코·중국·필리핀·나이지리아·태국 중 하나에서 가정·길거리·보호시설로 시작합니다. "골고루 둘러보기"와, 출처가 붙은 나라별 개 수 추정치로 뽑는 "현실 비율" 중에서 고를 수 있습니다.
- **강아지는 모르고, 플레이어는 안다**: 서술은 강아지의 감각에 머물고, 나라와 통계 같은 정보는 따로 보여줍니다.
- **이름과 우리 집 강아지**: 태어난 환경에 따라 가족, 동네, 보호소가 부르는 이름을 붙일 수 있고, 마지막 장면에서 내 강아지와 나란히 비교합니다.
- **오늘의 강아지**: 같은 날(한국 시간) 시작하는 모두가 같은 곳, 같은 모습의 강아지로 태어납니다. 그 뒤의 삶은 각자의 선택으로 갈라집니다.
- **삶 공유 링크**: 다 산 삶을 주소 하나로 보냅니다. 받은 사람의 브라우저가 시드와 선택 기록으로 같은 삶을 다시 계산해 보여주며, 서버로는 아무것도 보내지 않습니다.
- **도감**: 끝까지 살아본 삶이 쌓여 태어난 곳, 삶의 갈래, 만난 모습을 채워 갑니다. 더 나은 삶과 못한 삶을 가리지 않습니다.
- **하루 단위 시뮬레이션**: 성장, 날씨, 일상 사건, 만남과 신뢰, 입양, 이사, 실종과 재회, 질병과 회복, 동료와 새끼까지 이어집니다.
- **재현 가능한 생애**: 시드 기반 난수를 쓰기 때문에 같은 시드와 같은 선택이면 같은 일생이 나옵니다. 저장 후 불러와도 이후 전개가 그대로 이어집니다.
- **브라우저 로컬 저장**: 진행 상황은 브라우저에만 저장되고, JSON으로 내보내고 가져올 수 있습니다.

## 실행

Node.js 22 이상이 필요합니다.

```sh
npm run build   # asset-source/에서 이미지 복원 및 검증
npm test        # 자동 테스트
npm start       # http://localhost:8000 에서 실행 (Python 3 필요)
```

`dist/` 폴더가 그대로 정적 사이트입니다. 배포할 때는 `npm run build` 후 `dist/`를 올리면 됩니다.

## 배포 (Cloudflare Workers)

공개 주소: https://dogs.getupvox0.workers.dev/

Cloudflare Worker `dogs`가 GitHub 저장소와 연결되어 있어서, `main`에 머지할 때마다 자동으로 다시 배포됩니다. 게임은 `dist/`의 정적 파일이고, `/api/*`만 `worker/`의 무지개다리 공원 API가 받습니다.

- 빌드: `npm run build` (Node 버전은 `.node-version`의 22)
- 배포: `npx wrangler deploy`, 설정은 `wrangler.jsonc` (`assets.directory = ./dist`)
- 응답 헤더(캐시, 보안): `dist/_headers`
- 공원 API: `worker/park-api.js`, 저장소는 D1 `dogs-park` (표는 첫 요청 때 자동으로 만듦)
- 다른 브랜치는 `*-dogs.getupvox0.workers.dev` 미리보기 주소로 배포됩니다.

새로 연결할 때는 Cloudflare 대시보드 → Workers & Pages → Create → Import a repository에서 이 저장소를 고르고, 빌드 명령에 `npm run build`를 넣습니다.

### 무지개다리 공원 준비 (한 번만)

1. **D1 데이터베이스**: Storage & Databases → D1 → Create, 이름 `dogs-park`. 만든 뒤 보이는 Database ID를 `wrangler.jsonc`의 `database_id`에 넣습니다.
2. **Turnstile**: Turnstile → Add widget, 도메인 `dogs.getupvox0.workers.dev`. Site Key는 `wrangler.jsonc`의 `TURNSTILE_SITE_KEY`에 넣습니다.
3. **비밀 값**: Workers → `dogs` → Settings → Variables and Secrets에 Secret으로 추가합니다.
   - `TURNSTILE_SECRET`: Turnstile의 Secret Key
   - `DEVICE_SALT`: 아무 긴 무작위 문자열 (기기 구분 값을 해시할 때 씀, 바꾸면 기존 촛불·내 기록 표시가 끊김)
   - `ADMIN_TOKEN`: 아무 긴 무작위 문자열 (숨겨진 기록 페이지 `/park-admin.html`의 비밀번호)

세 비밀 값 중 하나라도 없으면 공원은 보기만 되고 남기기는 막힙니다.

로컬에서 API까지 돌려 보려면 `.dev.vars.example`을 `.dev.vars`로 복사한 뒤 `npx wrangler dev`를 실행합니다. Cloudflare의 테스트용 Turnstile 키라 사람 확인이 항상 통과합니다.

## 폴더 구조

| 경로 | 내용 |
| --- | --- |
| `dist/` | 게임 본체 (HTML, CSS, JS 모듈, 데이터, 이미지) |
| `worker/` | Cloudflare Worker (무지개다리 공원 API) |
| `tests/` | Node 내장 테스트 러너용 테스트 |
| `scripts/` | 이미지 복원, 콘텐츠 점검, 사진 수집 스크립트 |
| `asset-source/` | 큰 이미지를 Base64 조각으로 보관 (빌드 시 `dist/assets/`로 복원) |
| `data/photo-review/` | 사진 후보 수집·검토 기록 |
| `docs/` | 버전별 개발 기록과 릴리스 문서 |

## 데이터에 대해

이 게임의 체중, 환경 비율, 사건 확률, 행동 변화, 시기는 **모두 게임용 가정**입니다. "골고루 둘러보기"에서는 나라를 균등하게 뽑습니다. "현실 비율"의 나라별 개 수는 `dist/birth-odds.js`에 출처·연도·신뢰도와 함께 적혀 있고, 출처가 없는 값은 게임용 가정으로 표시됩니다. 건강 사건 빈도는 영국 생명표(Teng et al., 2022)를 참고하지만, 원인·진료·회복 결과는 게임용 설정입니다. 실제 통계나 수의학적 예측으로 사용하지 마세요.

## 현재 한계

- 자동 테스트는 Node.js에서 로직만 검사합니다. 브라우저에서는 선택지를 직접 고르며 한 생을 끝까지 진행해 엔딩·앨범·도감까지 확인했습니다 (시간을 빠르게 돌려 진행). 여러 생애를 사람이 직접 플레이한 점검은 아직 부족합니다.
- 빌드 도구 없이 `dist/`의 JS 모듈이 곧 소스입니다. 코드 형식은 `npm run format`(Prettier)으로 맞춥니다.

## 개발 기록

버전별 변경 내역은 [docs/DEVLOG.md](docs/DEVLOG.md)를 참고하세요.

## 라이선스

코드는 [MIT 라이선스](LICENSE)입니다. `dist/assets/photos/`의 Wikimedia Commons 사진은 각자의 CC 라이선스를 따르며, 작가와 출처는 `dist/data/photo-sources.json`에 있습니다.
