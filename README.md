# Global Message Converter

[![npm version](https://badge.fury.io/js/global-message-converter.svg)](https://badge.fury.io/js/global-message-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/global-message-converter.svg)](https://www.npmjs.com/package/global-message-converter)

React 애플리케이션의 **하드코딩된 한국어 텍스트**를 자동으로 감지하여 **react-intl** 형태로 변환하는 CLI 도구입니다.

## 📋 목차

- [✨ 주요 기능](#-주요-기능)
- [🎯 변환 예시](#-변환-예시)
- [⚡ 빠른 시작](#-빠른-시작)
- [🔧 사용법](#-사용법)
- [📄 메시지 파일 형식](#-메시지-파일-형식)
- [💻 시스템 요구사항](#-시스템-요구사항)
- [❓ 문제해결](#-문제해결)
- [🤝 기여하기](#-기여하기)
- [📜 라이선스](#-라이선스)
- [📝 변경사항](#-변경사항)

## ✨ 주요 기능

- 🔍 **자동 감지**: 한국어 텍스트만 정확히 탐지 및 변환
- 🎛️ **스마트 변환**: String Literal, Template Literal, JSX Text 모두 지원
- 🔧 **컴포넌트 자동 처리**: 함수형/클래스형 컴포넌트 자동 감지 및 적절한 변환
- 📝 **메시지 관리**: 기존 메시지와 매칭하거나 새 메시지 자동 생성
- 🎨 **JSX 속성 지원**: `label` 속성 선택적 변환 지원
- ⚙️ **설정 가능**: 변환 예외 패턴 및 제외 속성 커스터마이징

## 🎯 변환 예시
1. JSX 내 텍스트 변환
> **변환 전:**
> ```javascript
> <div>안녕하세요.</div>
> ```

> **변환 후:**
> ```javascript
> <div><FormattedMessage id="greeting" defaultMessage="안녕하세요." /></div>
> ```

2. 일반 텍스트 변환
> **변환 전:**
> ```javascript
> const hi = '안녕하세요.';
> ```

> **변환 후:**
> ```javascript
> const hi = intl.formatMessage({ id: 'new.message', defaultMessage: '안녕하세요.' });
> ```

3. 템플릿 리터럴 변환
> **변환 전:**
> ```javascript
> const error = `${error} 오류가 발생했습니다`;
> ```

> **변환 후:**
> ```javascript
> const error = intl.formatMessage({ id: 'error.message', defaultMessage: '{error} 오류가 발생했습니다' }, { error });
> ```

## ⚡ 빠른 시작

### 1️⃣ 설치
```bash
npm install -g global-message-converter
```

### 2️⃣ 실행
```bash
gmc convert -t ./src -m ./messages/ko.js
```

## 🔧 사용법

### 기본 명령어
```bash
gmc convert -t <대상경로> -m <메시지파일>
```

### 📋 옵션

| 옵션 | 설명 | 필수 |
|------|------|------|
| `-t, --target` | 변환 대상 파일 또는 폴더 경로 | ✅ |
| `-m, --message` | 기존 메시지 파일 경로 (JSON/JS) | ✅ |

### 💡 사용 예시

**파일 하나 변환:**
```bash
gmc convert -t ./src/components/Header.jsx -m ./messages/ko.js
```

**폴더 전체 변환:**
```bash
gmc convert -t ./src/components -m ./messages/ko.js
```

## 📄 메시지 파일 형식

### 🔍 작동 원리
1. **매칭 검색**: 기존 메시지에서 동일한 텍스트 찾기
2. **새 메시지 생성**: 매칭되지 않는 텍스트는 `new.message.{N}` 키로 생성
3. **파일 출력**: 새 메시지들은 `newMessages.json` 파일로 저장

### ✅ 지원 형식 (JSON)
```json
{
    "welcome_message": "환영합니다, {username}님!",
    "loading": "로딩 중...",
    "error": "오류: 데이터를 불러올 수 없습니다."
}
```

### ✅ 지원 형식 (JavaScript)
```javascript
export default {
   "welcome_message": "환영합니다, {username}님!",
   "loading": "로딩 중...",
   "error": "오류: 데이터를 불러올 수 없습니다."
}
```

### ❌ 지원하지 않는 형식 (중첩 객체)
```javascript
// 이런 형식은 지원하지 않습니다
export default {
    ko: {
       "welcome_message": "환영합니다!",
       // ...
    },
    en: {
       // ...
    }
}
```

## 💻 시스템 요구사항

- **Node.js**: >= 14.0.0
- **npm**: >= 6.0.0
- **지원 파일 형식**: `.js`, `.jsx`, `.ts`, `.tsx`

## ❓ 문제해결

### 🔧 일반적인 문제

**Q: "구문 분석 오류" 메시지가 나타나요**
```
A: JSX 플러그인 오류일 가능성이 있습니다. 
   파일이 유효한 JavaScript/JSX 문법인지 확인해보세요.
```

**Q: 일부 한국어 텍스트가 변환되지 않아요**
```
A: 다음과 같은 경우 변환되지 않습니다:
   - JSX 속성 중 label을 제외한 모든 속성 (className, style 등)
   - URL, 경로, 숫자, 색상코드 등의 특정 패턴
   - defaultMessage 속성값
```

**Q: 메시지 파일을 찾을 수 없다고 해요**
```
A: 메시지 파일 경로가 올바른지, 파일이 존재하는지 확인해주세요.
   상대 경로와 절대 경로 모두 사용 가능합니다.
```

### 🐛 버그 신고
문제가 지속되면 [Issues](https://github.com/kimjunyoung90/global-message-converter/issues)에 다음 정보와 함께 신고해주세요:
- OS 및 Node.js 버전
- 오류 메시지 전문
- 재현 가능한 코드 예시

## 🤝 기여하기

### 개발 프로세스
1. 저장소를 포크합니다
2. 새 브랜치를 생성합니다: `git checkout -b feature/새기능`
3. 변경사항을 커밋합니다: `git commit -am 'feat: 새기능 추가'`
4. 브랜치에 푸시합니다: `git push origin feature/새기능`
5. Pull Request를 생성합니다

### 커밋 메시지 규칙
- `feat:` - 새로운 기능
- `fix:` - 버그 수정
- `docs:` - 문서 변경
- `refactor:` - 코드 리팩토링

## 📜 라이선스

이 프로젝트는 [MIT 라이선스](https://opensource.org/licenses/MIT) 하에 배포됩니다.

## 📝 변경사항

최신 업데이트 내역은 [CHANGELOG.md](https://github.com/kimjunyoung90/global-message-converter/blob/main/CHANGELOG.md)에서 확인하실 수 있습니다.