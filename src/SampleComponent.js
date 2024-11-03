import React from 'react';

class SampleComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            message: "환영 메시지입니다.", // 하드코딩된 텍스트
            dataStatus: "로딩 중입니다...", // 하드코딩된 텍스트
        };
    }

    // 사용자 환영 메시지 생성 메서드
    generateWelcomeMessage() {
        return `환영합니다, ${this.props.username}!`;
    }

    // 오류 메시지 표시 함수
    showError() {
        console.log('오류 발생: 데이터 불러오기에 실패했습니다.');
        alert('오류 발생: 데이터를 불러올 수 없습니다.');
    }

    // 성공 메시지 표시 함수
    showSuccess() {
        alert('축하합니다! 모든 작업이 완료되었습니다.');
    }

    // 입력 필드 초기화 메서드
    resetFormFields = () => {
        this.setState({
            welcomeMessage: '입력된 정보를 초기화합니다.',
            errorMessage: '모든 필드를 정확히 입력해주세요.',
        });
    };

    render() {
        return (
            <div>
                <header>
                    <h1>우리 애플리케이션에 오신 것을 환영합니다</h1>
                    <p>모든 필요를 한 곳에서 해결할 수 있는 솔루션</p>
                </header>

                <section>
                    <h2>주요 기능</h2>
                    <ul>
                        <li>실시간 데이터 처리</li>
                        <li>사용자 친화적인 인터페이스</li>
                        <li>신뢰할 수 있고 안전함</li>
                        <li>24/7 고객 지원</li>
                    </ul>
                </section>

                <section>
                    <h2>회사 소개</h2>
                    <p>우리는 10년 이상 이 분야에서 활동하며 최고의 서비스를 제공하고 있습니다.</p>
                    <p>우리 팀은 최고의 만족도를 보장하기 위해 헌신하고 있습니다.</p>
                </section>

                <footer>
                    <button>문의하기</button>
                    <button>더 알아보기</button>
                </footer>

                <form>
                    <label>
                        이름:
                        <input type="text" placeholder="이름을 입력하세요" />
                    </label>
                    <label>
                        이메일:
                        <input type="email" placeholder="이메일을 입력하세요" />
                    </label>
                    <label>
                        메시지:
                        <textarea placeholder="메시지를 작성하세요"></textarea>
                    </label>
                    <button type="submit">제출하기</button>
                </form>
            </div>
        );
    }
}

export default SampleComponent;
