import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface StatusCode {
  code: number;
  phrase: string;
  description_zh: string;
  description_en: string;
  category: string;
  spec: string;
}

const CODES: StatusCode[] = [
  { code: 100, phrase: 'Continue', description_zh: '继续', description_en: 'The server has received the request headers', category: '1xx', spec: 'RFC 7231' },
  { code: 101, phrase: 'Switching Protocols', description_zh: '切换协议', description_en: 'The server is switching protocols', category: '1xx', spec: 'RFC 7231' },
  { code: 102, phrase: 'Processing', description_zh: '处理中', description_en: 'The server has received and is processing', category: '1xx', spec: 'RFC 2518' },
  { code: 103, phrase: 'Early Hints', description_zh: '早期提示', description_en: 'Used to return some response headers before final message', category: '1xx', spec: 'RFC 8297' },
  { code: 200, phrase: 'OK', description_zh: '成功', description_en: 'The request succeeded', category: '2xx', spec: 'RFC 7231' },
  { code: 201, phrase: 'Created', description_zh: '已创建', description_en: 'The request succeeded, and a new resource was created', category: '2xx', spec: 'RFC 7231' },
  { code: 202, phrase: 'Accepted', description_zh: '已接受', description_en: 'The request has been accepted for processing', category: '2xx', spec: 'RFC 7231' },
  { code: 204, phrase: 'No Content', description_zh: '无内容', description_en: 'The request succeeded, but no content is returned', category: '2xx', spec: 'RFC 7231' },
  { code: 206, phrase: 'Partial Content', description_zh: '部分内容', description_en: 'The server is delivering only part of the resource', category: '2xx', spec: 'RFC 7233' },
  { code: 301, phrase: 'Moved Permanently', description_zh: '永久重定向', description_en: 'The URL of the requested resource has been changed permanently', category: '3xx', spec: 'RFC 7231' },
  { code: 302, phrase: 'Found', description_zh: '临时重定向', description_en: 'The URI of requested resource has been changed temporarily', category: '3xx', spec: 'RFC 7231' },
  { code: 304, phrase: 'Not Modified', description_zh: '未修改', description_en: 'The resource has not been modified since the last request', category: '3xx', spec: 'RFC 7232' },
  { code: 307, phrase: 'Temporary Redirect', description_zh: '临时重定向', description_en: 'The request should be repeated with another URI', category: '3xx', spec: 'RFC 7231' },
  { code: 308, phrase: 'Permanent Redirect', description_zh: '永久重定向', description_en: 'The request and all future requests should be repeated with another URI', category: '3xx', spec: 'RFC 7538' },
  { code: 400, phrase: 'Bad Request', description_zh: '错误请求', description_en: 'The server could not understand the request', category: '4xx', spec: 'RFC 7231' },
  { code: 401, phrase: 'Unauthorized', description_zh: '未授权', description_en: 'Authentication is required and has failed', category: '4xx', spec: 'RFC 7235' },
  { code: 403, phrase: 'Forbidden', description_zh: '禁止访问', description_en: 'The server understood the request but refuses to authorize it', category: '4xx', spec: 'RFC 7231' },
  { code: 404, phrase: 'Not Found', description_zh: '未找到', description_en: 'The server cannot find the requested resource', category: '4xx', spec: 'RFC 7231' },
  { code: 405, phrase: 'Method Not Allowed', description_zh: '方法不允许', description_en: 'The request method is not supported for the requested resource', category: '4xx', spec: 'RFC 7231' },
  { code: 408, phrase: 'Request Timeout', description_zh: '请求超时', description_en: 'The server timed out waiting for the request', category: '4xx', spec: 'RFC 7231' },
  { code: 409, phrase: 'Conflict', description_zh: '冲突', description_en: 'The request conflicts with the current state of the server', category: '4xx', spec: 'RFC 7231' },
  { code: 410, phrase: 'Gone', description_zh: '已删除', description_en: 'The requested resource has been permanently deleted', category: '4xx', spec: 'RFC 7231' },
  { code: 413, phrase: 'Payload Too Large', description_zh: '请求体过大', description_en: 'The request body is larger than the server is willing to process', category: '4xx', spec: 'RFC 7231' },
  { code: 415, phrase: 'Unsupported Media Type', description_zh: '不支持的媒体类型', description_en: 'The media format is not supported by the server', category: '4xx', spec: 'RFC 7231' },
  { code: 422, phrase: 'Unprocessable Entity', description_zh: '不可处理的实体', description_en: 'The request was well-formed but could not be followed', category: '4xx', spec: 'RFC 4918' },
  { code: 429, phrase: 'Too Many Requests', description_zh: '请求过多', description_en: 'The user has sent too many requests in a given amount of time', category: '4xx', spec: 'RFC 6585' },
  { code: 500, phrase: 'Internal Server Error', description_zh: '服务器内部错误', description_en: 'The server has encountered a situation it does not know how to handle', category: '5xx', spec: 'RFC 7231' },
  { code: 501, phrase: 'Not Implemented', description_zh: '未实现', description_en: 'The request method is not supported by the server', category: '5xx', spec: 'RFC 7231' },
  { code: 502, phrase: 'Bad Gateway', description_zh: '网关错误', description_en: 'The server received an invalid response from the upstream server', category: '5xx', spec: 'RFC 7231' },
  { code: 503, phrase: 'Service Unavailable', description_zh: '服务不可用', description_en: 'The server is not ready to handle the request', category: '5xx', spec: 'RFC 7231' },
  { code: 504, phrase: 'Gateway Timeout', description_zh: '网关超时', description_en: 'The server did not get a response in time from the upstream server', category: '5xx', spec: 'RFC 7231' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '1xx': '#6b7280',
  '2xx': '#10b981',
  '3xx': '#3b82f6',
  '4xx': '#f59e0b',
  '5xx': '#ef4444',
};

export default function HttpStatus() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('httpStatus');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [copied, setCopied] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return CODES.filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false;
      if (!q) return true;
      return String(c.code).includes(q) || c.phrase.toLowerCase().includes(q) || c.description_zh.includes(q) || c.description_en.toLowerCase().includes(q);
    });
  }, [query, cat]);

  const copyCode = (code: number) => {
    navigator.clipboard.writeText(String(code));
    setCopied(code);
    setTimeout(() => setCopied(0), 1200);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="http-layout">
        <div className="http-toolbar">
          <input className="input-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.placeholder} />
          <div className="http-cats">
            {['all', '1xx', '2xx', '3xx', '4xx', '5xx'].map((c) => (
              <button key={c} className={`panel-btn panel-btn-sm${cat === c ? ' accent' : ''}`} onClick={() => setCat(c)}>{c === 'all' ? ui.all : c}</button>
            ))}
          </div>
        </div>
        <div className="http-grid">
          {filtered.map((c) => (
            <div key={c.code} className="http-card" onClick={() => copyCode(c.code)} style={{ borderLeftColor: CATEGORY_COLORS[c.category] }}>
              <div className="http-card-top">
                <span className="http-code" style={{ color: CATEGORY_COLORS[c.category] }}>{c.code}</span>
                <span className="http-phrase">{c.phrase}</span>
                {copied === c.code && <span className="http-copied">✓</span>}
              </div>
              <div className="http-desc">{lang === 'zh' ? c.description_zh : c.description_en}</div>
              <div className="http-spec">{c.spec}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="http-empty">{t('common.waiting')}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
