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
    return users;
};

const TaskManagement = () => {
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

        </div>
    );
};

export default TaskManagement;