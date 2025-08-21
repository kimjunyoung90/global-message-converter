# Global Message Converter
`global-message-converter`는 React 애플리케이션 내 하드코딩된 텍스트를 감지하여 글로벌 메시징 시스템(react-intl)에서 요구하는 형태로 변환하는 명령줄 도구입니다. 이 라이브러리를 통해 손쉽게 텍스트를 변환할 수 있습니다.

**한국어만 변환됩니다.**  

**[변경사항](https://github.com/kimjunyoung90/global-message-converter/blob/main/CHANGELOG.md)**: 최신 업데이트 내역을 여기서 확인하세요.

#### 변환 예시 (클래스형 및 함수형 컴포넌트 지원)
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

## 시작하기
이 라이브러리를 사용하려면 Node.js가 설치되어 있어야 합니다. 그 후 npm을 사용하여 라이브러리를 설치할 수 있습니다.
```bash
npm install -g global-message-converter
```

## 사용법
설치 후 다음 명령어로 라이브러리를 실행합니다:
```bash
gmc [명령어]
```

## 명령어
### convert
하드코딩된 텍스트를 감지하여 글로벌 메시징 시스템이 읽을 수 있는 형태로 변환합니다.

## 사용 예시
```bash
gmc convert -t <파일 또는 폴더 경로> -m <메시지 파일 경로>
```

#### 옵션
- `-t, --target <target>`: 변환 대상이 되는 파일 또는 폴더를 입력합니다.
- `-m, --message <message>`: 메시지 파일 경로를 입력합니다.

#### 예제
하드코딩된 텍스트가 포함된 파일들을 변환하려면:
```bash
gmc convert --target ./src/components --message ./messages/ko.js
```

## 메시지 파일 형식
메시지 파일은 하드코딩된 텍스트를 변환하는 데 사용되는 기준입니다.

텍스트와 일치하는 메시지 키를 탐지합니다. 일치하는 메시지를 찾지 못하면 새로운 메시지가 생성되며, 새로 생성된 메시지들은 파일 형태(newMessages)로 제공됩니다.

JSON 또는 JS 형식으로 작성해야 하며, 각 메시지는 고유한 키와 해당하는 텍스트 값을 가져야 합니다.
메시지 파일 예시입니다:
```json
{
    "welcome_message": "환영합니다, {username}님!",
    "loading": "로딩 중...",
    "error": "오류: 데이터를 불러올 수 없습니다.",
    "success": "축하합니다! 모든 작업이 완료되었습니다."
}
```

JS 파일의 경우, 중첩된 메시지 구조는 인식되지 않습니다:
```javascript
export default {
    ko: {
       "welcome_message": "환영합니다, {username}님!",
       "loading": "로딩 중...",
       "error": "오류: 데이터를 불러올 수 없습니다.",
       "success": "축하합니다! 모든 작업이 완료되었습니다."
    },
    en: {
        ...
    }
}
```

올바른 메시지 변환을 위해 중첩되지 않은 형식으로 변환해야 합니다:
```javascript
export default {
   "welcome_message": "환영합니다, {username}님!",
   "loading": "로딩 중...",
   "error": "오류: 데이터를 불러올 수 없습니다.",
   "success": "축하합니다! 모든 작업이 완료되었습니다."
}
```

## 기여하는 방법
1. [저장소](https://github.com/kimjunyoung90/global-message-converter.git)를 포크합니다.
2. 브랜치를 생성합니다:
   ```bash
   git checkout -b feature/기능명
   ```
3. 변경사항을 커밋하고 푸시합니다.

- **버그 제보**: 버그가 발견되면 [Issues](https://github.com/kimjunyoung90/global-message-converter/issues) 섹션에 새로운 이슈를 생성해 주세요. 문제를 명확히 설명하고 재현 단계를 포함해 주세요.
- **기능 요청**: 새로운 기능 제안은 언제나 환영입니다! 검토에 도움이 되도록 자세한 설명을 제공해 주세요.

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.