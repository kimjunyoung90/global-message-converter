# Global Message Converter

[![npm version](https://badge.fury.io/js/global-message-converter.svg)](https://badge.fury.io/js/global-message-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

React 애플리케이션의 **하드코딩된 한국어 텍스트**를 자동으로 감지하여 **react-intl** 형태로 변환하는 CLI 도구입니다.

## 주요 기능

- 🔍 **자동 감지**: 한국어 텍스트만 정확히 탐지 및 변환
- 🎛️ **스마트 변환**: String Literal, Template Literal, JSX Text 모두 지원
- 🔧 **컴포넌트 자동 처리**: 함수형/클래스형 컴포넌트 자동 감지
- 📝 **메시지 관리**: 기존 메시지와 매칭하거나 새 메시지 자동 생성
- 🎨 **JSX 속성 지원**: `label`, `placeholder`, `title`, `alt`, `aria-label` 속성 변환

## 빠른 시작

### 설치
```bash
npm install -g global-message-converter
```

### 실행
```bash
gmc convert -t ./src -m ./messages/ko.js
```

## 변환 예시

**변환 전:**
```javascript
function Welcome() {
    const message = "안녕하세요!";
    return <div>환영합니다</div>;
}
```

**변환 후:**
```javascript
import { FormattedMessage, useIntl } from "react-intl";

function Welcome() {
    const intl = useIntl();
    const message = intl.formatMessage({ id: "new.message.1", defaultMessage: "안녕하세요!" });
    return <div><FormattedMessage id="new.message.2" defaultMessage="환영합니다" /></div>;
}
```

## 사용법

### 기본 명령어
```bash
gmc convert -t <대상경로> -m <메시지파일>
```

### 옵션

| 옵션 | 설명 | 필수 |
|------|------|------|
| `-t, --target` | 변환 대상 파일 또는 폴더 경로 | ✅ |
| `-m, --message` | 기존 메시지 파일 경로 (JSON/JS) | ✅ |

### 사용 예시

```bash
# 파일 하나 변환
gmc convert -t ./src/components/Header.jsx -m ./messages/ko.js

# 폴더 전체 변환
gmc convert -t ./src/components -m ./messages/ko.js
```

## 메시지 파일 형식

### 지원 형식 (JavaScript)
```javascript
export default {
    "welcome": "환영합니다!",
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다."
}
```

### 지원 형식 (JSON)
```json
{
    "welcome": "환영합니다!",
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다."
}
```

## 변환 제외 항목

다음과 같은 경우 변환되지 않습니다:
- 한국어가 포함되지 않은 텍스트
- console 함수 호출의 인수 (`console.log("디버그")`)
- 글꼴 이름 (`"맑은 고딕"`, `"나눔고딕"` 등)
- URL, 경로, 숫자, 색상코드
- 특정 JSX 속성 (`className`, `style`, `data-*` 등)

## 시스템 요구사항

- **Node.js**: >= 14.0.0
- **지원 파일 형식**: `.js`, `.jsx`, `.ts`, `.tsx`

## 문제해결

**Q: 일부 텍스트가 변환되지 않아요**
- 한국어가 포함된 텍스트만 변환됩니다
- 지원되는 JSX 속성: `label`, `placeholder`, `title`, `alt`, `aria-label`

**Q: 변환 후 코드 스타일이 변경돼요**
- 변환 후 Prettier나 ESLint를 실행해서 일관된 포맷팅을 적용하세요

## 라이선스

MIT 라이선스

## 변경사항

[CHANGELOG.md](https://github.com/kimjunyoung90/global-message-converter/blob/main/CHANGELOG.md)