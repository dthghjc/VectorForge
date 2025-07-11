import { getAllUsers } from '../../api';
import type { UserBasic } from '../../api/auth';
import { useState, useEffect } from 'react';

const getAnnotatorUser = async () => {
    const users = await getAllUsers({
        skip: 0,
        limit: 100,
        role: "annotation",
        is_active: true
    });
    console.log("users", users);
    return users;
};

const Review1 = () => {
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const annotationUsers = await getAnnotatorUser();
                setUsers(annotationUsers);
                console.log("annotationUsers", annotationUsers);
            } catch (error) {
                console.error("获取用户失败:", error);
                setError("获取用户失败，请检查网络连接或权限");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div>
            <div>标注用户列表：</div>
            {loading && <div>加载中...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {users.length > 0 ? (
                <div>
                    {users.map(user => (
                        <div key={user.id} style={{ padding: '8px', border: '1px solid #ddd', margin: '4px 0' }}>
                            ID: {user.id} | 用户名: {user.username}
                        </div>
                    ))}
                </div>
            ) : !loading && !error && (
                <div>暂无标注用户</div>
            )}
        </div>
    );
};

export default Review1;