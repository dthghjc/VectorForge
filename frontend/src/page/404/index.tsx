import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';

export default function NotFound() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="not-found-container">
            <div className="error-content">
                <h1 className="error-code">404</h1>
                <div className="error-message">
                    <h2>哎呀！页面走丢了</h2>
                    <p>看起来这个页面去太空旅行了...</p>
                </div>
                <div className="astronaut">
                    <div className="astronaut-body">
                        <div className="astronaut-head"></div>
                        <div className="astronaut-arms"></div>
                        <div className="astronaut-legs"></div>
                    </div>
                </div>
                <p className="redirect-message">
                    {countdown}秒后自动返回首页
                </p>
                <button 
                    className="home-button"
                    onClick={() => navigate('/')}
                >
                    立即返回首页
                </button>
            </div>
        </div>
    );
}
