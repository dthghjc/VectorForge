import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../../store/login/authSlice';
import { Button, Form, Input } from 'antd';
import "./index.scss"

function Login() {
    const [form]=Form.useForm()
    const [loading,setLoading]=useState<boolean>(false)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin(){
        form.validateFields().then(async (res)=>{
            setLoading(true)
            
        })
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h1>登录</h1>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">用户名</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.loginButton}>
                        登录
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login