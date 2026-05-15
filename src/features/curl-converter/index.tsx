import { useState, useMemo, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

interface CurlParsed {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body: string;
  cookies: { key: string; value: string }[];
  auth: { type: string; username: string; password: string } | null;
  compressed: boolean;
  insecure: boolean;
  followRedirects: boolean;
  timeout: number | null;
  proxy: string;
  queryParams: { key: string; value: string }[];
}

type Language = 'javascript' | 'python' | 'go' | 'java' | 'php' | 'csharp' | 'ruby' | 'swift' | 'kotlin' | 'rust';

// ── Parser ──

function parseCurl(curlCmd: string): CurlParsed {
  const result: CurlParsed = {
    method: 'GET',
    url: '',
    headers: [],
    body: '',
    cookies: [],
    auth: null,
    compressed: false,
    insecure: false,
    followRedirects: false,
    timeout: null,
    proxy: '',
    queryParams: [],
  };

  // Remove line continuations and normalize
  let cmd = curlCmd
    .replace(/\\\n/g, ' ')
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .trim();

  // Remove "curl" prefix
  if (cmd.startsWith('curl ')) {
    cmd = cmd.slice(5).trim();
  } else if (cmd === 'curl') {
    return result;
  }

  // Extract URL (first non-flag argument or after -X/--url)
  const urlMatch = cmd.match(/(?:^|\s)(?:--url\s+)?['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (urlMatch) {
    result.url = urlMatch[1];
  }

  // Parse method
  const methodMatch = cmd.match(/-X\s+(\w+)/);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Detect method from data
  if (cmd.includes('-d ') || cmd.includes('--data') || cmd.includes('--data-raw') ||
      cmd.includes('--data-binary') || cmd.includes('--data-urlencode')) {
    if (!methodMatch) {
      result.method = 'POST';
    }
  }

  // Parse headers
  const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = headerRegex.exec(cmd)) !== null) {
    const [key, ...valueParts] = match[1].split(':');
    if (key) {
      result.headers.push({
        key: key.trim(),
        value: valueParts.join(':').trim(),
      });
    }
  }

  // Also match --header
  const headerRegex2 = /--header\s+['"]([^'"]+)['"]/g;
  while ((match = headerRegex2.exec(cmd)) !== null) {
    const [key, ...valueParts] = match[1].split(':');
    if (key && !result.headers.some(h => h.key === key.trim())) {
      result.headers.push({
        key: key.trim(),
        value: valueParts.join(':').trim(),
      });
    }
  }

  // Parse body data
  const dataPatterns = [
    /--data-raw\s+['"](.+?)['"]/,
    /--data-binary\s+['"](.+?)['"]/,
    /--data-urlencode\s+['"](.+?)['"]/,
    /-d\s+['"](.+?)['"]/,
    /--data\s+['"](.+?)['"]/,
  ];

  for (const pattern of dataPatterns) {
    const bodyMatch = cmd.match(pattern);
    if (bodyMatch) {
      result.body = bodyMatch[1];
      break;
    }
  }

  // Parse cookies
  const cookieMatch = cmd.match(/-b\s+['"](.+?)['"]/) || cmd.match(/--cookie\s+['"](.+?)['"]/);
  if (cookieMatch) {
    const cookieStr = cookieMatch[1];
    cookieStr.split(';').forEach(c => {
      const [key, ...vals] = c.trim().split('=');
      if (key) {
        result.cookies.push({ key: key.trim(), value: vals.join('=').trim() });
      }
    });
  }

  // Parse auth
  const authMatch = cmd.match(/-u\s+['"](.+?)['"]/) || cmd.match(/--user\s+['"](.+?)['"]/);
  if (authMatch) {
    const [username, password] = authMatch[1].split(':');
    result.auth = { type: 'basic', username: username || '', password: password || '' };
  }

  // Parse bearer token
  const bearerMatch = cmd.match(/-H\s+['"]Authorization:\s*Bearer\s+(.+?)['"]/i);
  if (bearerMatch) {
    result.auth = { type: 'bearer', username: bearerMatch[1], password: '' };
  }

  // Flags
  result.compressed = cmd.includes('--compressed');
  result.insecure = cmd.includes('-k') || cmd.includes('--insecure');
  result.followRedirects = cmd.includes('-L') || cmd.includes('--location');

  // Parse timeout
  const timeoutMatch = cmd.match(/--connect-timeout\s+(\d+)/) || cmd.match(/-m\s+(\d+)/);
  if (timeoutMatch) {
    result.timeout = parseInt(timeoutMatch[1]);
  }

  // Parse proxy
  const proxyMatch = cmd.match(/-x\s+['"](.+?)['"]/) || cmd.match(/--proxy\s+['"](.+?)['"]/);
  if (proxyMatch) {
    result.proxy = proxyMatch[1];
  }

  // Parse query params from URL
  try {
    const urlObj = new URL(result.url);
    urlObj.searchParams.forEach((value, key) => {
      result.queryParams.push({ key, value });
    });
  } catch { /* invalid URL */ }

  return result;
}

// ── Code Generators ──

function generateJavaScript(parsed: CurlParsed): string {
  const lines: string[] = [];
  const indent = '  ';

  // Build options
  lines.push(`const url = '${parsed.url}';`);
  lines.push('');

  if (parsed.method !== 'GET' || parsed.body || parsed.headers.length > 0) {
    lines.push('const options = {');
    lines.push(`${indent}method: '${parsed.method}',`);

    if (parsed.headers.length > 0 || parsed.auth) {
      lines.push(`${indent}headers: {`);
      parsed.headers.forEach(h => {
        lines.push(`${indent}${indent}'${h.key}': '${h.value}',`);
      });
      if (parsed.auth?.type === 'bearer') {
        lines.push(`${indent}${indent}'Authorization': 'Bearer ${parsed.auth.username}',`);
      }
      lines.push(`${indent}},`);
    }

    if (parsed.body) {
      const isJson = parsed.headers.some(h => h.key.toLowerCase() === 'content-type' && h.value.includes('json'));
      if (isJson) {
        lines.push(`${indent}body: JSON.stringify(${parsed.body}),`);
      } else {
        lines.push(`${indent}body: '${parsed.body}',`);
      }
    }

    if (parsed.followRedirects) {
      lines.push(`${indent}redirect: 'follow',`);
    }

    lines.push('};');
    lines.push('');
  }

  lines.push('const response = await fetch(url' + (parsed.method !== 'GET' || parsed.headers.length > 0 ? ', options' : '') + ');');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

function generatePython(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('import requests');
  lines.push('');

  // Headers
  if (parsed.headers.length > 0 || parsed.auth) {
    lines.push('headers = {');
    parsed.headers.forEach(h => {
      lines.push(`    '${h.key}': '${h.value}',`);
    });
    if (parsed.auth?.type === 'bearer') {
      lines.push(`    'Authorization': 'Bearer ${parsed.auth.username}',`);
    }
    lines.push('}');
    lines.push('');
  }

  // Cookies
  if (parsed.cookies.length > 0) {
    lines.push('cookies = {');
    parsed.cookies.forEach(c => {
      lines.push(`    '${c.key}': '${c.value}',`);
    });
    lines.push('}');
    lines.push('');
  }

  // Body
  if (parsed.body) {
    const isJson = parsed.headers.some(h => h.key.toLowerCase() === 'content-type' && h.value.includes('json'));
    if (isJson) {
      lines.push(`data = ${parsed.body}`);
    } else {
      lines.push(`data = '${parsed.body}'`);
    }
    lines.push('');
  }

  // Request
  const method = parsed.method.toLowerCase();
  const args: string[] = [`'${parsed.url}'`];

  if (parsed.headers.length > 0 || parsed.auth) args.push('headers=headers');
  if (parsed.body) args.push('data=data');
  if (parsed.cookies.length > 0) args.push('cookies=cookies');
  if (parsed.insecure) args.push('verify=False');
  if (parsed.followRedirects) args.push('allow_redirects=True');
  if (parsed.timeout) args.push(`timeout=${parsed.timeout}`);
  if (parsed.proxy) args.push(`proxies={'http': '${parsed.proxy}', 'https': '${parsed.proxy}'}`);

  lines.push(`response = requests.${method}(${args.join(', ')})`);
  lines.push('');
  lines.push('print(response.status_code)');
  lines.push('print(response.json())');

  return lines.join('\n');
}

function generateGo(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('\t"fmt"');
  lines.push('\t"io"');
  lines.push('\t"net/http"');
  if (parsed.body) lines.push('\t"strings"');
  lines.push(')');
  lines.push('');
  lines.push('func main() {');

  if (parsed.body) {
    lines.push(`\tbody := strings.NewReader(\`${parsed.body}\`)`);
    lines.push('');
  }

  lines.push(`\treq, err := http.NewRequest("${parsed.method}", "${parsed.url}", ${parsed.body ? 'body' : 'nil'})`);
  lines.push('\tif err != nil {');
  lines.push('\t\tpanic(err)');
  lines.push('\t}');

  if (parsed.headers.length > 0 || parsed.auth) {
    lines.push('');
    parsed.headers.forEach(h => {
      lines.push(`\treq.Header.Set("${h.key}", "${h.value}")`);
    });
    if (parsed.auth?.type === 'bearer') {
      lines.push(`\treq.Header.Set("Authorization", "Bearer ${parsed.auth.username}")`);
    }
  }

  if (parsed.auth?.type === 'basic') {
    lines.push('');
    lines.push(`\treq.SetBasicAuth("${parsed.auth.username}", "${parsed.auth.password}")`);
  }

  lines.push('');
  lines.push('\tclient := &http.Client{}');
  lines.push('\tresp, err := client.Do(req)');
  lines.push('\tif err != nil {');
  lines.push('\t\tpanic(err)');
  lines.push('\t}');
  lines.push('\tdefer resp.Body.Close()');
  lines.push('');
  lines.push('\tbodyBytes, _ := io.ReadAll(resp.Body)');
  lines.push('\tfmt.Println(string(bodyBytes))');
  lines.push('}');

  return lines.join('\n');
}

function generateJava(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('import java.net.http.*;');
  lines.push('import java.net.URI;');
  lines.push('');
  lines.push('HttpClient client = HttpClient.newHttpClient();');
  lines.push('');

  lines.push('HttpRequest.Builder builder = HttpRequest.newBuilder()');
  lines.push(`    .uri(URI.create("${parsed.url}"))`);
  lines.push(`    .method("${parsed.method}", ${parsed.body ? `HttpRequest.BodyPublishers.ofString("${parsed.body}")` : 'HttpRequest.BodyPublishers.noBody()'});`);

  parsed.headers.forEach(h => {
    lines.push(`builder.header("${h.key}", "${h.value}");`);
  });

  if (parsed.auth?.type === 'bearer') {
    lines.push(`builder.header("Authorization", "Bearer ${parsed.auth.username}");`);
  }

  lines.push('');
  lines.push('HttpRequest request = builder.build();');
  lines.push('HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());');
  lines.push('System.out.println(response.body());');

  return lines.join('\n');
}

function generatePHP(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('<?php');
  lines.push('');
  lines.push('$ch = curl_init();');
  lines.push('');
  lines.push(`curl_setopt($ch, CURLOPT_URL, '${parsed.url}');`);
  lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
  lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${parsed.method}');`);

  if (parsed.headers.length > 0) {
    lines.push('');
    lines.push('$headers = [');
    parsed.headers.forEach(h => {
      lines.push(`    '${h.key}: ${h.value}',`);
    });
    lines.push('];');
    lines.push('curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);');
  }

  if (parsed.body) {
    lines.push('');
    lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${parsed.body}');`);
  }

  if (parsed.auth?.type === 'basic') {
    lines.push(`curl_setopt($ch, CURLOPT_USERPWD, '${parsed.auth.username}:${parsed.auth.password}');`);
  }

  if (parsed.followRedirects) {
    lines.push('curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);');
  }

  if (parsed.insecure) {
    lines.push('curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);');
  }

  lines.push('');
  lines.push('$response = curl_exec($ch);');
  lines.push('curl_close($ch);');
  lines.push('');
  lines.push('echo $response;');

  return lines.join('\n');
}

function generateCSharp(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('using System.Net.Http;');
  lines.push('using System.Text;');
  lines.push('');
  lines.push('using var client = new HttpClient();');
  lines.push('');

  if (parsed.body) {
    lines.push(`var content = new StringContent("${parsed.body}", Encoding.UTF8, "application/json");`);
    lines.push('');
  }

  const method = parsed.method.charAt(0).toUpperCase() + parsed.method.slice(1).toLowerCase();
  lines.push(`var response = await client.${method}Async("${parsed.url}"${parsed.body ? ', content' : ''});`);
  lines.push('var result = await response.Content.ReadAsStringAsync();');
  lines.push('Console.WriteLine(result);');

  return lines.join('\n');
}

function generateRuby(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('require "net/http"');
  lines.push('require "uri"');
  lines.push('');
  lines.push(`uri = URI.parse("${parsed.url}")`);
  lines.push('');

  const methodClass = parsed.method.charAt(0).toUpperCase() + parsed.method.slice(1).toLowerCase();
  lines.push(`request = Net::HTTP::${methodClass}.new(uri)`);

  parsed.headers.forEach(h => {
    lines.push(`request["${h.key}"] = "${h.value}"`);
  });

  if (parsed.auth?.type === 'bearer') {
    lines.push(`request["Authorization"] = "Bearer ${parsed.auth.username}"`);
  }

  if (parsed.body) {
    lines.push(`request.body = '${parsed.body}'`);
  }

  lines.push('');
  lines.push('response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|');
  lines.push('  http.request(request)');
  lines.push('end');
  lines.push('');
  lines.push('puts response.body');

  return lines.join('\n');
}

function generateSwift(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('import Foundation');
  lines.push('');
  lines.push('let url = URL(string: "${parsed.url}")!');
  lines.push('var request = URLRequest(url: url)');
  lines.push(`request.httpMethod = "${parsed.method}"`);

  parsed.headers.forEach(h => {
    lines.push(`request.setValue("${h.value}", forHTTPHeaderField: "${h.key}")`);
  });

  if (parsed.auth?.type === 'bearer') {
    lines.push(`request.setValue("Bearer ${parsed.auth.username}", forHTTPHeaderField: "Authorization")`);
  }

  if (parsed.body) {
    lines.push(`request.httpBody = "${parsed.body}".data(using: .utf8)`);
  }

  lines.push('');
  lines.push('let task = URLSession.shared.dataTask(with: request) { data, response, error in');
  lines.push('    if let data = data {');
  lines.push('        let json = try? JSONSerialization.jsonObject(with: data)');
  lines.push('        print(json ?? "")');
  lines.push('    }');
  lines.push('}');
  lines.push('task.resume()');

  return lines.join('\n');
}

function generateKotlin(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('import java.net.http.HttpClient');
  lines.push('import java.net.http.HttpRequest');
  lines.push('import java.net.http.HttpResponse');
  lines.push('import java.net.URI');
  lines.push('');
  lines.push('val client = HttpClient.newHttpClient()');
  lines.push('');
  lines.push('val request = HttpRequest.newBuilder()');
  lines.push(`    .uri(URI.create("${parsed.url}"))`);

  if (parsed.body) {
    lines.push(`    .method("${parsed.method}", HttpRequest.BodyPublishers.ofString("${parsed.body}"))`);
  } else {
    lines.push(`    .${parsed.method.toLowerCase()}()`);
  }

  parsed.headers.forEach(h => {
    lines.push(`    .header("${h.key}", "${h.value}")`);
  });

  if (parsed.auth?.type === 'bearer') {
    lines.push(`    .header("Authorization", "Bearer ${parsed.auth.username}")`);
  }

  lines.push('    .build()');
  lines.push('');
  lines.push('val response = client.send(request, HttpResponse.BodyHandlers.ofString())');
  lines.push('println(response.body())');

  return lines.join('\n');
}

function generateRust(parsed: CurlParsed): string {
  const lines: string[] = [];

  lines.push('use reqwest;');
  lines.push('use std::collections::HashMap;');
  lines.push('');
  lines.push('#[tokio::main]');
  lines.push('async fn main() -> Result<(), Box<dyn std::error::Error>> {');

  lines.push(`    let client = reqwest::Client::new();`);
  lines.push('');

  let requestChain = `client.${parsed.method.toLowerCase()}("${parsed.url}")`;

  parsed.headers.forEach(h => {
    requestChain += `\n        .header("${h.key}", "${h.value}")`;
  });

  if (parsed.auth?.type === 'bearer') {
    requestChain += `\n        .bearer_auth("${parsed.auth.username}")`;
  }

  if (parsed.body) {
    requestChain += `\n        .body("${parsed.body}")`;
  }

  lines.push(`    let response = ${requestChain}\n        .send()\n        .await?;`);
  lines.push('');
  lines.push('    let body = response.text().await?;');
  lines.push('    println!("{}", body);');
  lines.push('');
  lines.push('    Ok(())');
  lines.push('}');

  return lines.join('\n');
}

const GENERATORS: Record<Language, (parsed: CurlParsed) => string> = {
  javascript: generateJavaScript,
  python: generatePython,
  go: generateGo,
  java: generateJava,
  php: generatePHP,
  csharp: generateCSharp,
  ruby: generateRuby,
  swift: generateSwift,
  kotlin: generateKotlin,
  rust: generateRust,
};

const LANG_LABELS: Record<Language, { name: string; icon: string }> = {
  javascript: { name: 'JavaScript', icon: 'JS' },
  python: { name: 'Python', icon: 'PY' },
  go: { name: 'Go', icon: 'GO' },
  java: { name: 'Java', icon: 'JV' },
  php: { name: 'PHP', icon: 'PH' },
  csharp: { name: 'C#', icon: 'C#' },
  ruby: { name: 'Ruby', icon: 'RB' },
  swift: { name: 'Swift', icon: 'SW' },
  kotlin: { name: 'Kotlin', icon: 'KT' },
  rust: { name: 'Rust', icon: 'RS' },
};

// ── cURL Reference ──

const CURL_REFERENCE = {
  zh: {
    title: 'cURL 常用参数速查',
    sections: [
      {
        title: '请求方法',
        items: [
          { flag: '-X, --request', desc: '指定请求方法 (GET/POST/PUT/DELETE/PATCH)' },
          { flag: '-G, --get', desc: '将 -d 数据作为 URL 查询参数' },
        ],
      },
      {
        title: '请求头',
        items: [
          { flag: '-H, --header', desc: '添加请求头，如 -H "Content-Type: application/json"' },
          { flag: '-A, --user-agent', desc: '设置 User-Agent' },
          { flag: '-e, --referer', desc: '设置 Referer 头' },
        ],
      },
      {
        title: '请求体',
        items: [
          { flag: '-d, --data', desc: '发送 POST 数据 (默认 Content-Type: application/x-www-form-urlencoded)' },
          { flag: '--data-raw', desc: '发送原始数据，不进行 @ 处理' },
          { flag: '--data-binary', desc: '发送二进制数据' },
          { flag: '--data-urlencode', desc: '发送 URL 编码数据' },
          { flag: '-F, --form', desc: '发送 multipart/form-data (文件上传)' },
        ],
      },
      {
        title: '认证',
        items: [
          { flag: '-u, --user', desc: '用户名:密码 基本认证' },
          { flag: '-H "Authorization: Bearer TOKEN"', desc: 'Bearer Token 认证' },
        ],
      },
      {
        title: 'Cookie',
        items: [
          { flag: '-b, --cookie', desc: '发送 Cookie' },
          { flag: '-c, --cookie-jar', desc: '保存 Cookie 到文件' },
        ],
      },
      {
        title: '响应处理',
        items: [
          { flag: '-L, --location', desc: '跟随重定向' },
          { flag: '-i, --include', desc: '输出包含响应头' },
          { flag: '-s, --silent', desc: '静默模式，不显示进度' },
          { flag: '-S, --show-error', desc: '显示错误信息' },
          { flag: '-o, --output', desc: '输出到文件' },
          { flag: '-w, --write-out', desc: '完成后输出指定信息' },
        ],
      },
      {
        title: 'SSL/代理',
        items: [
          { flag: '-k, --insecure', desc: '允许不安全的 SSL 连接' },
          { flag: '--cacert', desc: '指定 CA 证书文件' },
          { flag: '-x, --proxy', desc: '使用代理' },
          { flag: '-U, --proxy-user', desc: '代理认证' },
        ],
      },
      {
        title: '其他',
        items: [
          { flag: '--compressed', desc: '请求压缩响应 (gzip/deflate)' },
          { flag: '--connect-timeout', desc: '连接超时时间 (秒)' },
          { flag: '-m, --max-time', desc: '最大传输时间 (秒)' },
          { flag: '-v, --verbose', desc: '详细输出，调试用' },
          { flag: '--trace <file>', desc: '将调试信息写入文件' },
        ],
      },
    ],
  },
  en: {
    title: 'cURL Quick Reference',
    sections: [
      {
        title: 'Request Methods',
        items: [
          { flag: '-X, --request', desc: 'Specify request method (GET/POST/PUT/DELETE/PATCH)' },
          { flag: '-G, --get', desc: 'Use -d data as URL query parameters' },
        ],
      },
      {
        title: 'Headers',
        items: [
          { flag: '-H, --header', desc: 'Add header, e.g. -H "Content-Type: application/json"' },
          { flag: '-A, --user-agent', desc: 'Set User-Agent' },
          { flag: '-e, --referer', desc: 'Set Referer header' },
        ],
      },
      {
        title: 'Request Body',
        items: [
          { flag: '-d, --data', desc: 'Send POST data (default: application/x-www-form-urlencoded)' },
          { flag: '--data-raw', desc: 'Send raw data, no @ processing' },
          { flag: '--data-binary', desc: 'Send binary data' },
          { flag: '--data-urlencode', desc: 'Send URL encoded data' },
          { flag: '-F, --form', desc: 'Send multipart/form-data (file upload)' },
        ],
      },
      {
        title: 'Authentication',
        items: [
          { flag: '-u, --user', desc: 'username:password for basic auth' },
          { flag: '-H "Authorization: Bearer TOKEN"', desc: 'Bearer Token auth' },
        ],
      },
      {
        title: 'Cookies',
        items: [
          { flag: '-b, --cookie', desc: 'Send cookies' },
          { flag: '-c, --cookie-jar', desc: 'Save cookies to file' },
        ],
      },
      {
        title: 'Response',
        items: [
          { flag: '-L, --location', desc: 'Follow redirects' },
          { flag: '-i, --include', desc: 'Include response headers in output' },
          { flag: '-s, --silent', desc: 'Silent mode, no progress' },
          { flag: '-S, --show-error', desc: 'Show error messages' },
          { flag: '-o, --output', desc: 'Write output to file' },
          { flag: '-w, --write-out', desc: 'Output info after completion' },
        ],
      },
      {
        title: 'SSL/Proxy',
        items: [
          { flag: '-k, --insecure', desc: 'Allow insecure SSL connections' },
          { flag: '--cacert', desc: 'Specify CA certificate file' },
          { flag: '-x, --proxy', desc: 'Use proxy' },
          { flag: '-U, --proxy-user', desc: 'Proxy authentication' },
        ],
      },
      {
        title: 'Other',
        items: [
          { flag: '--compressed', desc: 'Request compressed response (gzip/deflate)' },
          { flag: '--connect-timeout', desc: 'Connection timeout (seconds)' },
          { flag: '-m, --max-time', desc: 'Max transfer time (seconds)' },
          { flag: '-v, --verbose', desc: 'Verbose output for debugging' },
          { flag: '--trace <file>', desc: 'Write debug info to file' },
        ],
      },
    ],
  },
};

// ── Main Component ──

export default function CurlConverter() {
  const { lang } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('curlConverter');
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState<Language>('javascript');
  const [showRef, setShowRef] = useState(false);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return parseCurl(input);
    } catch {
      return null;
    }
  }, [input]);

  const output = useMemo(() => {
    if (!parsed) return '';
    try {
      return GENERATORS[targetLang](parsed);
    } catch {
      return lang === 'zh' ? '转换失败' : 'Conversion failed';
    }
  }, [parsed, targetLang, lang]);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [output]);

  const handleExample = useCallback(() => {
    const example = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`;
    setInput(example);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  const ref = CURL_REFERENCE[lang] || CURL_REFERENCE.en;

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="cc-layout">
        {/* Input Panel */}
        <div className="cc-panel">
          <div className="cc-panel-header">
            <span>cURL</span>
            <div className="cc-panel-actions">
              <button className="cc-action-btn" onClick={handleExample}>{ui.example || 'Example'}</button>
              <button className="cc-action-btn" onClick={handleClear}>{ui.clear || 'Clear'}</button>
            </div>
          </div>
          <textarea
            className="cc-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={ui.placeholder || "Paste cURL command here...\n\nExample:\ncurl -X POST https://api.example.com/data \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"key\": \"value\"}'"}
            spellCheck={false}
          />
          {parsed && (
            <div className="cc-parsed-info">
              <span className="cc-method">{parsed.method}</span>
              <span className="cc-url">{parsed.url}</span>
              {parsed.headers.length > 0 && <span className="cc-badge">{parsed.headers.length} headers</span>}
              {parsed.body && <span className="cc-badge">body</span>}
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="cc-panel">
          <div className="cc-panel-header">
            <div className="cc-lang-tabs">
              {(Object.entries(LANG_LABELS) as [Language, typeof LANG_LABELS[Language]][]).map(([key, val]) => (
                <button
                  key={key}
                  className={`cc-lang-tab${targetLang === key ? ' cc-lang-active' : ''}`}
                  onClick={() => setTargetLang(key)}
                >
                  {val.icon}
                </button>
              ))}
            </div>
            <div className="cc-panel-actions">
              <button className="cc-action-btn cc-copy-btn" onClick={handleCopy} disabled={!output}>
                {ui.copy || 'Copy'}
              </button>
            </div>
          </div>
          <pre className="cc-output">
            <code>{output || (ui.noOutput || 'Converted code will appear here...')}</code>
          </pre>
        </div>
      </div>

      {/* cURL Reference Toggle */}
      <button className="cc-ref-toggle" onClick={() => setShowRef(!showRef)}>
        <span className={`cc-ref-arrow${showRef ? ' cc-ref-open' : ''}`}>&#9654;</span>
        {ref.title}
      </button>

      {/* cURL Reference */}
      {showRef && (
        <div className="cc-reference">
          {ref.sections.map((section, i) => (
            <div key={i} className="cc-ref-section">
              <h4 className="cc-ref-section-title">{section.title}</h4>
              <div className="cc-ref-items">
                {section.items.map((item, j) => (
                  <div key={j} className="cc-ref-item">
                    <code className="cc-ref-flag">{item.flag}</code>
                    <span className="cc-ref-desc">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
