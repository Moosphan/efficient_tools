import { tools } from '../registry';

export function AboutPage() {
  const available = tools.filter((t) => t.status === '可用');
  const inDev = tools.filter((t) => t.status === '开发中');

  return (
    <>
      <div className="about-header">
        <h1>关于 Efficient Tools</h1>
        <p>面向开发者的一站式效率工具集合，所有工具均在浏览器端运行，无需后端服务。</p>
      </div>
      <div className="about-grid">
        <div className="about-card">
          <h3>设计原则</h3>
          <ul>
            <li>极简界面，零学习成本</li>
            <li>客户端运行，数据不出浏览器</li>
            <li>键盘优先，支持快捷键</li>
            <li>即用即走，无需注册</li>
          </ul>
        </div>
        <div className="about-card">
          <h3>技术栈</h3>
          <ul>
            <li>React + TypeScript + Vite</li>
            <li>零服务端依赖</li>
            <li>CSS OKLch 色彩系统</li>
            <li>响应式布局</li>
          </ul>
        </div>
        <div className="about-card">
          <h3>工具列表</h3>
          <ul>
            {available.map((t) => (
              <li key={t.id}>{t.name} — 可用</li>
            ))}
            {inDev.map((t) => (
              <li key={t.id}>{t.name} — 开发中</li>
            ))}
          </ul>
        </div>
        <div className="about-card">
          <h3>隐私声明</h3>
          <p>所有数据处理在浏览器本地完成，不上传任何输入至服务器。</p>
        </div>
      </div>
    </>
  );
}
