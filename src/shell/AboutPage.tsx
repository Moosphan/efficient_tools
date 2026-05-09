import { tools } from '../registry';
import { useI18n, toolI18n } from '../shared/context/I18nContext';

export function AboutPage() {
  const { lang, t } = useI18n();
  const available = tools.filter((tool) => tool.status === '可用');
  const inDev = tools.filter((tool) => tool.status === '开发中');

  return (
    <>
      <div className="about-header">
        <h1>{t('about.title')}</h1>
        <p>{t('about.desc')}</p>
      </div>
      <div className="about-grid">
        <div className="about-card">
          <h3>{t('about.principles')}</h3>
          <ul>
            <li>{lang === 'zh' ? '极简界面，零学习成本' : 'Minimal UI, zero learning curve'}</li>
            <li>{lang === 'zh' ? '客户端运行，数据不出浏览器' : 'Client-side only, data never leaves browser'}</li>
            <li>{lang === 'zh' ? '键盘优先，支持快捷键' : 'Keyboard-first with shortcuts'}</li>
            <li>{lang === 'zh' ? '即用即走，无需注册' : 'Use and go, no registration'}</li>
          </ul>
        </div>
        <div className="about-card">
          <h3>{t('about.tech')}</h3>
          <ul>
            <li>React + TypeScript + Vite</li>
            <li>{lang === 'zh' ? '零服务端依赖' : 'Zero server dependencies'}</li>
            <li>CSS OKLch {lang === 'zh' ? '色彩系统' : 'Color System'}</li>
            <li>{lang === 'zh' ? '响应式布局' : 'Responsive layout'}</li>
          </ul>
        </div>
        <div className="about-card">
          <h3>{t('about.tools')}</h3>
          <ul>
            {available.map((tool) => (
              <li key={tool.id}>{toolI18n[tool.id]?.name[lang] || tool.name} — {t('status.available')}</li>
            ))}
            {inDev.map((tool) => (
              <li key={tool.id}>{toolI18n[tool.id]?.name[lang] || tool.name} — {t('status.developing')}</li>
            ))}
          </ul>
        </div>
        <div className="about-card">
          <h3>{t('about.privacy')}</h3>
          <p>{t('about.privacy.desc')}</p>
        </div>
      </div>
    </>
  );
}
