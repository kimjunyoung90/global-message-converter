# 설정 가이드

Global Message Converter는 유연한 설정 시스템을 제공하여 변환 동작을 사용자 정의할 수 있습니다.

## 설정 파일 위치

설정 파일은 다음 순서로 자동 검색됩니다:

1. `.gmcrc.json` (프로젝트 루트)
2. `.gmc.config.json` (프로젝트 루트)
3. `gmc.config.json` (프로젝트 루트)
4. `package.json`의 `gmc` 섹션

## 기본 설정

```json
{
  "conversion": {
    "excludedPropertyNames": ["defaultMessage", "id", "fontFamily", "className", "style"],
    "includedJSXAttributes": ["label", "placeholder", "title", "alt", "aria-label"],
    "excludedPatterns": [
      "^\\s*$",
      "^[a-zA-Z0-9_-]+$",
      "^https?:\\/\\/",
      "^\\/[a-zA-Z0-9/_-]*",
      "^\\d+(\\.\\d+)?$",
      "^#[a-fA-F0-9]{3,6}$",
      "^[^\\w가-힣]+$",
      "^.*(고딕|명조|돋움|바탕|Arial|Times|Helvetica|sans-serif|serif|monospace).*$"
    ]
  },
  "files": {
    "supportedExtensions": [".js", ".jsx", ".ts", ".tsx"],
    "excludedDirectories": ["node_modules", ".git", ".next", "dist", "build", "coverage", ".nyc_output"],
    "outputFormat": "pretty"
  },
  "logging": {
    "level": "info",
    "colors": true,
    "progress": true
  },
  "output": {
    "newMessageFilePattern": "newMessages.json",
    "showStatistics": true,
    "verbose": false
  }
}
```

## 설정 섹션 설명

### conversion
변환 동작을 제어하는 설정입니다.

- **excludedPropertyNames**: 변환에서 제외할 객체 속성명
- **includedJSXAttributes**: 변환할 JSX 속성명 (화이트리스트)
- **excludedPatterns**: 변환에서 제외할 정규식 패턴

### files
파일 처리 관련 설정입니다.

- **supportedExtensions**: 지원하는 파일 확장자
- **excludedDirectories**: 제외할 디렉토리
- **outputFormat**: 출력 형식 (`pretty` 또는 `compact`)

### logging
로그 출력 설정입니다.

- **level**: 로그 레벨 (`error`, `warn`, `info`, `debug`)
- **colors**: 색상 출력 활성화
- **progress**: 진행률 표시 활성화

### output
출력 파일 관련 설정입니다.

- **newMessageFilePattern**: 새 메시지 파일명 패턴
- **showStatistics**: 통계 정보 표시
- **verbose**: 상세 출력 모드

## 설정 관리 명령어

### 설정 파일 생성
```bash
gmc config --init
```

### 현재 설정 보기
```bash
gmc config --show
```

### 설정 검증
```bash
gmc config --validate
```

## package.json 설정 예시

```json
{
  "name": "my-project",
  "gmc": {
    "conversion": {
      "includedJSXAttributes": ["label", "placeholder", "title", "tooltip"]
    },
    "logging": {
      "level": "debug"
    }
  }
}
```

## 커맨드라인 옵션 우선순위

커맨드라인 옵션이 설정 파일보다 우선순위가 높습니다:

```bash
gmc convert -t src -m messages/ko.js --verbose --no-colors
```

이 경우 `--verbose`와 `--no-colors` 옵션이 설정 파일의 로깅 설정을 오버라이드합니다.