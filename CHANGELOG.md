# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.12.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.11.0...v1.12.0) (2025-08-21)


### Features

* console 함수 호출 내 텍스트 변환 방지 기능 추가 ([ed07760](https://github.com/kimjunyoung90/global-message-converter/commit/ed077601895c57a0c262b9393c3010c8a95215f1))

## [1.11.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.10.0...v1.11.0) (2025-08-21)


### Features

* Babel Generator 코드 포맷팅 옵션 개선 ([a066c1e](https://github.com/kimjunyoung90/global-message-converter/commit/a066c1e0e6ea937eb33ffc90a650688ba313a63c))

## [1.10.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.9.0...v1.10.0) (2025-08-21)


### Features

* JSX 속성 변환 지원 확장 및 속성 제한 완화 ([4cbcdab](https://github.com/kimjunyoung90/global-message-converter/commit/4cbcdab2d639fcd0621a88d3f503cd3b9d50f76e))

## [1.9.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.8.2...v1.9.0) (2025-08-21)


### Features

* JSX placeholder 속성 변환 및 특수문자만 텍스트 제외 기능 추가 ([7d2171c](https://github.com/kimjunyoung90/global-message-converter/commit/7d2171ce778ba2c5c670dc47287b5c23ead39c97))

### [1.8.2](https://github.com/kimjunyoung90/global-message-converter/compare/v1.8.1...v1.8.2) (2025-08-21)

### [1.8.1](https://github.com/kimjunyoung90/global-message-converter/compare/v1.8.0...v1.8.1) (2025-08-21)


### Bug Fixes

* README.md CHANGELOG 링크를 GitHub 절대 URL로 수정 ([7dc6e08](https://github.com/kimjunyoung90/global-message-converter/commit/7dc6e08d15f478740062fb62c821b43ca7352b5f))

## 1.8.0 (2025-08-21)


### Features

* arrow function 내 텍스트 변환 추가 ([8047b72](https://github.com/kimjunyoung90/global-message-converter/commit/8047b726eae4bd649d667df188db75097a14352f))
* JSX label 속성 선택적 변환 기능 추가 ([631b3d7](https://github.com/kimjunyoung90/global-message-converter/commit/631b3d7852d9875918b695c77f18f41cfd592cb4))
* jsx text 한국어 이외 언어 변경 기능 추가 ([4292708](https://github.com/kimjunyoung90/global-message-converter/commit/429270874cd294ef2c9196427fbda998cef49ac3))
* 변환 로직 개선 및 README 한국어 번역 ([8c36296](https://github.com/kimjunyoung90/global-message-converter/commit/8c36296b56d720e7ce4d2f23f2f7c7b75025925c))
* 신규 생성된 메시지 메시지 파일 생성 기능 추가 ([923b333](https://github.com/kimjunyoung90/global-message-converter/commit/923b3332e8d24dd8c09f7d298392bb33a0e2632e))
* 영어 대문자로 시작하지 않는 경우 string literal 변환 제외 처리 ([5e6a56c](https://github.com/kimjunyoung90/global-message-converter/commit/5e6a56c248d78208c738b952860f61946f4cba88))
* 클래스 메서드 내 텍스트 변환 기능 추가 ([4bcf8e8](https://github.com/kimjunyoung90/global-message-converter/commit/4bcf8e8fa3815000275d88fba47737c87db7b777))
* 템플릿 리터럴 변환 기능 추가 ([d046fa5](https://github.com/kimjunyoung90/global-message-converter/commit/d046fa5a4c44b64bc7ae041aa5e13157cbc23106))
* 함수형 컴포넌트 변환 기능 추가 ([86c0d97](https://github.com/kimjunyoung90/global-message-converter/commit/86c0d97a74c8ba2c7c85648d7e28beeca589161c))


### Bug Fixes

* injectIntl import 되지 않는 버그 수정 ([60c4e1d](https://github.com/kimjunyoung90/global-message-converter/commit/60c4e1d850bb93ae793c497d1e7f1c3200fd23b5))
* StringLiteral 탐지 시 영어 대문자로 시작되는 단어만 변경되는 조건 수정 ([8caa4e2](https://github.com/kimjunyoung90/global-message-converter/commit/8caa4e2fde4203ef1468a1c2860797fb220cad56))
* templateLiteral 빈값일 때 변환되는 버그 수정 ([f5b120e](https://github.com/kimjunyoung90/global-message-converter/commit/f5b120e0ffa3689b7064cfe88031fffece88a619))
* 다수 컴포넌트 컨버팅 하는 경우 신규 생성 메시지 파일 계속 생성되는 버그 수정 ([0e6c0f1](https://github.com/kimjunyoung90/global-message-converter/commit/0e6c0f1247ea586b15d8f18c7620076bf0ad19dd))
* 코드 변환 예외 처리 로직 추가 ([2a3e680](https://github.com/kimjunyoung90/global-message-converter/commit/2a3e6806daa21d87082f6c74170e6ef7068edd91))
* 코드 변환 오류 시 변환 중단 추가 ([fecb8a7](https://github.com/kimjunyoung90/global-message-converter/commit/fecb8a773e18dd17eef5ff8da0246a8c4cc36d97))
* 코드 파싱 에러 캐치 로직 추가 ([939c772](https://github.com/kimjunyoung90/global-message-converter/commit/939c7721827023c5f31d0bb9520feff5102f45bf))
* 클래스 컴포넌트 텍스트 변환 로직 간단하게 수정 ([93433a6](https://github.com/kimjunyoung90/global-message-converter/commit/93433a65eae8f11df90ea6577c50abc6e3f0ce9c))
* 템플릿 리터럴 변경 시 query string pattern 변환 하지 않도록 예외 처리 추가 ([df4a379](https://github.com/kimjunyoung90/global-message-converter/commit/df4a379ca5959607b8f1196c38e0c771858d1faf))
* 한국어만 번역되도록 수정 ([99ca1e7](https://github.com/kimjunyoung90/global-message-converter/commit/99ca1e70a08d7ae1a0beaeee48308ebd565cc1ae))

### [1.7.4](https://github.com/kimjunyoung90/global-message-converter/compare/v1.7.3...v1.7.4) (2024-12-15)

### [1.7.3](https://github.com/kimjunyoung90/global-message-converter/compare/v1.7.2...v1.7.3) (2024-12-15)


### Bug Fixes

* StringLiteral 탐지 시 영어 대문자로 시작되는 단어만 변경되는 조건 수정 ([8caa4e2](https://github.com/kimjunyoung90/global-message-converter/commit/8caa4e2fde4203ef1468a1c2860797fb220cad56))

### [1.7.2](https://github.com/kimjunyoung90/global-message-converter/compare/v1.7.1...v1.7.2) (2024-12-03)

### [1.7.1](https://github.com/kimjunyoung90/global-message-converter/compare/v1.7.0...v1.7.1) (2024-12-03)

## [1.7.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.6.4...v1.7.0) (2024-11-30)


### Features

* jsx text 한국어 이외 언어 변경 기능 추가 ([4292708](https://github.com/kimjunyoung90/global-message-converter/commit/429270874cd294ef2c9196427fbda998cef49ac3))
* 영어 대문자로 시작하지 않는 경우 string literal 변환 제외 처리 ([5e6a56c](https://github.com/kimjunyoung90/global-message-converter/commit/5e6a56c248d78208c738b952860f61946f4cba88))

### [1.6.4](https://github.com/kimjunyoung90/global-message-converter/compare/v1.6.3...v1.6.4) (2024-11-19)


### Bug Fixes

* 템플릿 리터럴 변경 시 query string pattern 변환 하지 않도록 예외 처리 추가 ([df4a379](https://github.com/kimjunyoung90/global-message-converter/commit/df4a379ca5959607b8f1196c38e0c771858d1faf))

### [1.6.3](https://github.com/kimjunyoung90/global-message-converter/compare/v1.6.2...v1.6.3) (2024-11-16)


### Bug Fixes

* 코드 변환 오류 시 변환 중단 추가 ([fecb8a7](https://github.com/kimjunyoung90/global-message-converter/commit/fecb8a773e18dd17eef5ff8da0246a8c4cc36d97))

### [1.6.2](https://github.com/kimjunyoung90/global-message-converter/compare/v1.6.1...v1.6.2) (2024-11-16)


### Bug Fixes

* 코드 변환 예외 처리 로직 추가 ([2a3e680](https://github.com/kimjunyoung90/global-message-converter/commit/2a3e6806daa21d87082f6c74170e6ef7068edd91))

### [1.6.1](https://github.com/kimjunyoung90/global-message-converter/compare/v1.6.0...v1.6.1) (2024-11-16)


### Bug Fixes

* 코드 파싱 에러 캐치 로직 추가 ([939c772](https://github.com/kimjunyoung90/global-message-converter/commit/939c7721827023c5f31d0bb9520feff5102f45bf))

## [1.6.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.5.1...v1.6.0) (2024-11-16)


### Features

* 함수형 컴포넌트 변환 기능 추가 ([86c0d97](https://github.com/kimjunyoung90/global-message-converter/commit/86c0d97a74c8ba2c7c85648d7e28beeca589161c))


### Bug Fixes

* injectIntl import 되지 않는 버그 수정 ([60c4e1d](https://github.com/kimjunyoung90/global-message-converter/commit/60c4e1d850bb93ae793c497d1e7f1c3200fd23b5))
* templateLiteral 빈값일 때 변환되는 버그 수정 ([f5b120e](https://github.com/kimjunyoung90/global-message-converter/commit/f5b120e0ffa3689b7064cfe88031fffece88a619))
* 클래스 컴포넌트 텍스트 변환 로직 간단하게 수정 ([93433a6](https://github.com/kimjunyoung90/global-message-converter/commit/93433a65eae8f11df90ea6577c50abc6e3f0ce9c))

### [1.5.1](https://github.com/kimjunyoung90/global-message-converter/compare/v1.5.0...v1.5.1) (2024-11-14)

## [1.5.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.4.0...v1.5.0) (2024-11-10)


### Features

* 템플릿 리터럴 변환 기능 추가 ([d046fa5](https://github.com/kimjunyoung90/global-message-converter/commit/d046fa5a4c44b64bc7ae041aa5e13157cbc23106))

## [1.4.0](https://github.com/kimjunyoung90/global-message-converter/compare/v1.2.0...v1.4.0) (2024-11-10)


### Features

* arrow function 내 텍스트 변환 추가 ([8047b72](https://github.com/kimjunyoung90/global-message-converter/commit/8047b726eae4bd649d667df188db75097a14352f))

## 1.2.0 (2024-11-10)


### Features

* 클래스 메서드 내 텍스트 변환 기능 추가 ([4bcf8e8](https://github.com/kimjunyoung90/global-message-converter/commit/4bcf8e8fa3815000275d88fba47737c87db7b777))

### [1.1.3](https://github.com/kimjunyoung90/global-message-converter/compare/v1.1.1...v1.1.3) (2024-11-08)


### Bug Fixes

* 다수 컴포넌트 컨버팅 하는 경우 신규 생성 메시지 파일 계속 생성되는 버그 수정 ([1806c7d](https://github.com/kimjunyoung90/global-message-converter/commit/1806c7d5f496d02bd57ccaf698f77be1c544db76))

## 1.1.0 (2024-11-07)


### Features

* 신규 생성된 메시지 파일 생성 기능 추가
* README 파일 수정(신규 생성 파일 관련 내용 추가)

## 1.0.0 (2024-11-05)


### Features

* 최초 기능 배포
* JSX 태그 내 하드코딩 된 텍스트 react-intl 시스템이 읽을 수 있는 형태로 변환
