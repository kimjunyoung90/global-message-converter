import React from 'react';

class TestComponent extends React.Component {
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

export default TestComponent;
