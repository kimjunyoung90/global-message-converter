# Global Message Converter
`global-message-converter`는 React 애플리케이션 내 하드코딩된 텍스트를 탐지하여 
글로벌 메시지 시스템(react-intl)에서 요구하는 형태로 변환하는 커맨드 라인 도구입니다. 
이 라이브러리를 사용하면 간편하게 변환이 가능합니다.
현재 한국어만 다른 언어로 변환이 가능합니다.

**[CHANGELOG](./CHANGELOG.md)**: 이곳에서 최신 업데이트 내역을 확인하세요.

#### 변환 예제(클래스형, 함수형 컴포넌트 지원)
1. JSX 내부 텍스트 변환

> **Before:**
> ```javascript
> <div>안녕하세요.</div>
> ```

> **After:**
> ```javascript
> <div><FormattedMessage id="greeting" defaultMessage="안녕하세요." /></div>
> ```


2. 일반 텍스트 변환
> **Before:**
> ```javascript
> const hi = '안녕하세요.';
> ```

> **After:**
> ```javascript
> const hi = intl.formatMessage({ id: 'new.message', defaultMessage: '안녕하세요.' });
> ```

3. 템플릿 리터럴 변환
> **Before:**
> ```javascript
> const error = `${error} 발생`;
> ```

> **After:**
> ```javascript
> const error = intl.formatMessage({ id: 'error.message' }, { error });
> ```

## 시작하기
이 라이브러리를 사용하려면 Node.js가 설치되어 있어야 합니다. 그런 다음 npm을 사용하여 라이브러리를 설치할 수 있습니다.
```bash
npm install -g global-message-converter
```
## 사용법
설치 후, 아래의 명령어를 사용하여 라이브러리를 실행할 수 있습니다.
```bash
gmc [command]
```
## 명령어
### convert
하드코딩된 텍스트를 탐지하여 글로벌 메시지 시스템이 읽을 수 있는 형태로 변환합니다.

## 사용 예시
```bash
gmc convert -t <파일 또는 폴더 경로> -m <메시지 파일 경로>
```

#### 옵션
- `-t, --target <target>`: 변환 대상이 되는 파일 또는 폴더를 입력해 주세요.
- `-m, --message <message>`: 메시지 파일 경로를 입력해 주세요.

#### 예제
하드코딩된 텍스트가 포함된 파일을 변환하려면 다음과 같이 입력합니다.
```bash
gmc convert --target ./src/components --message ./messages/messages.json
```

## 메시지 파일 형식
메시지 파일은 하드코딩된 텍스트를 변환하는데 사용하는 기준값입니다. 

텍스트와 매칭되는 메시지의 키를 탐지합니다. 매칭되는 메시지가 없는 경우 새로운 메시지를 생성하고 신규로 생성된 메시지는 파일 형태(newMessages)로 제공합니다.


JSON 또는 js 형식으로 작성되어야 하며, 각 메시지는 고유한 키와 해당 텍스트 값을 가집니다. 
아래는 메시지 파일의 예시입니다.
```json
{
    "welcome_message": "환영합니다, {username}!",
    "loading": "로딩 중입니다...",
    "error": "오류 발생: 데이터를 불러올 수 없습니다.",
    "success": "축하합니다! 모든 작업이 완료되었습니다."
}
```
js 파일의 경우 아래와 같이 중첩된 구조의 메시지 파일은 인식하지 못합니다.
```javascript
export default {
    ko: {
       "welcome_message": "환영합니다, {username}!",
       "loading": "로딩 중입니다...",
       "error": "오류 발생: 데이터를 불러올 수 없습니다.",
       "success": "축하합니다! 모든 작업이 완료되었습니다."
    },
    en: {
        ...
    }
}
```
중첩되지 않은 형태로 변환하여야 정상적인 메시지 변환이 가능합니다.
```javascript
export default {
   "welcome_message": "환영합니다, {username}!",
   "loading": "로딩 중입니다...",
   "error": "오류 발생: 데이터를 불러올 수 없습니다.",
   "success": "축하합니다! 모든 작업이 완료되었습니다."
}
```

## 기여 방법
1. [저장소](https://github.com/kimjunyoung90/global-message-converter.git)를 포크합니다.
2. 브랜치를 생성합니다.
   git checkout -b feature/기능명
3. 변경사항을 커밋하고 푸시합니다.

- **버그 제보**: 버그가 발견되면 [Issues](https://github.com/kimjunyoung90/global-message-converter/issues) 섹션에 새로운 이슈를 작성해 주세요. 문제를 명확히 설명하고 재현 방법을 포함하면 도움이 됩니다.
- **기능 요청**: 새로운 기능 제안도 언제나 환영합니다! 제안 내용을 자세히 설명해 주시면 검토에 큰 도움이 됩니다.

## 라이센스
이 프로젝트는 MIT 라이선스에 따라 배포됩니다.