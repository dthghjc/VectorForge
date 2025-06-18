/**
 * 权限控制高阶组件
 * @param requiredPermissions - 组件所需的权限列表
 * @param userPermissions - 用户当前拥有的权限列表
 * @returns 返回一个高阶组件，该组件会根据权限控制是否渲染传入的组件
 */
function withPermissions(
  requiredPermissions: string[],
  userPermissions: string[]
): (Component: React.FC) => React.FC {
  return function (Component: React.FC) {
    return function (props: any): React.ReactElement | null {
      // 检查用户是否拥有所有必需的权限
      const hasPermission: boolean = requiredPermissions.every((item) =>
        userPermissions.includes(item)
      );
      
      // 如果没有权限，返回 null，不渲染组件
      if (!hasPermission) {
        return null;
      }
      
      // 有权限则渲染组件
      return <Component {...props} />;
    };
  };
}

export default withPermissions;