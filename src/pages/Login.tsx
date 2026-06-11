import { useState } from 'react';
import { FolderOpen, Mail, Lock } from 'lucide-react';
import { Button } from '../components/Common/Button';
import { useStore } from '../store';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login = ({ onNavigate }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { findUserByEmail, setUser } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = findUserByEmail(email);
    
    if (user && password === '123456') {
      setUser(user);
      onNavigate('/');
    } else {
      setError('邮箱或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">道路标注平台</h1>
          <p className="text-white/80 mt-2">公路数据集标注任务管理系统</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入密码"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            
            <Button type="submit" size="lg" className="w-full">
              登录
            </Button>
            
            <p className="text-center text-gray-500 text-sm mt-4">
              默认密码：123456
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
