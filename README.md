# 다국어 메시지 자동 변환 프로그램
이 프로젝트는 React 애플리케이션에 하드코딩 되어 있는 TEXT를 다국어 메시지 설정파일을 참조하여 다국어 메시지로 변환해주는 cli 도구를 제공합니다.

## 시작하기

## 사용법

## 기능
1. JSX 내부에 존재하는 TEXT 변환
```javascript
render() {
  return (
    <div>안녕하세요.</div>
  )
}
```
```javascript
render() {
  return (
    <div>
      <FormattedMessage id='greeting' defaultMessage='안녕하세요.' />
    </div>
  )
}
```
2. JSX 프로퍼티 중 TEXT 변환
```javascript
<input type="text" placeholder="이름을 입력하세요" />
```
```javascript
<input  
    type="text"  
    placeholder={this.props.intl.formatMessage({  
        id: 'new.message.43',  
        defaultMessage: '이름을 입력하세요',  
    })}  
/>
```
3. 함수 내 TEXT 변환
```javascript
resetFormFields = () => {  
    this.setState({  
        welcomeMessage: '입력된 정보를 초기화합니다.',  
        errorMessage: '모든 필드를 정확히 입력해주세요.',  
    });  
};
```
```javascript
resetFormFields = () => {  
    this.setState({  
        welcomeMessage: this.props.intl.formatMessage({ id: 'new.message.34', defaultMessage: '입력된 정보를 초기화합니다.' }),  
        errorMessage: this.props.intl.formatMessage({ id: 'new.message.35', defaultMessage: '모든 필드를 정확히 입력해주세요.' }),  
    });  
};
```

## 기여 방법
1. 저장소를 포크합니다.
2. 브랜치를 생성합니다:
   git checkout -b feature/기능명
3. 변경사항을 커밋하고 푸시합니다.

## 라이센스
이 프로젝트는 MIT 라이선스에 따라 배포됩니다.