import { useState, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useToast } from '../../shared/context/ToastContext';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface AdbCmd {
  category: string;
  label: string;
  cmd: string;
  desc: string;
}

const ADB_COMMANDS: AdbCmd[] = [
  // Device
  { category: '设备', label: '查看设备', cmd: 'adb devices', desc: '列出已连接的设备' },
  { category: '设备', label: '设备型号', cmd: 'adb shell getprop ro.product.model', desc: '获取设备型号' },
  { category: '设备', label: 'Android 版本', cmd: 'adb shell getprop ro.build.version.release', desc: '获取 Android 版本' },
  { category: '设备', label: '屏幕分辨率', cmd: 'adb shell wm size', desc: '获取屏幕分辨率' },
  { category: '设备', label: '电池信息', cmd: 'adb shell dumpsys battery', desc: '查看电池状态' },
  { category: '设备', label: 'IP 地址', cmd: 'adb shell ip addr show wlan0', desc: '获取 WiFi IP 地址' },

  // App
  { category: '应用', label: '已安装应用', cmd: 'adb shell pm list packages', desc: '列出所有已安装包名' },
  { category: '应用', label: '第三方应用', cmd: 'adb shell pm list packages -3', desc: '列出第三方应用' },
  { category: '应用', label: '当前 Activity', cmd: 'adb shell dumpsys activity activities | grep mResumedActivity', desc: '获取当前前台 Activity' },
  { category: '应用', label: '安装 APK', cmd: 'adb install ', desc: '安装 APK 文件（后接文件路径）' },
  { category: '应用', label: '卸载应用', cmd: 'adb uninstall ', desc: '卸载应用（后接包名）' },
  { category: '应用', label: '清除数据', cmd: 'adb shell pm clear ', desc: '清除应用数据（后接包名）' },
  { category: '应用', label: '强制停止', cmd: 'adb shell am force-stop ', desc: '强制停止应用（后接包名）' },

  // Screen
  { category: '屏幕', label: '截图', cmd: 'adb shell screencap -p /sdcard/screenshot.png', desc: '截取屏幕' },
  { category: '屏幕', label: '拉取截图', cmd: 'adb pull /sdcard/screenshot.png', desc: '将截图拉取到本地' },
  { category: '屏幕', label: '录屏', cmd: 'adb shell screenrecord /sdcard/record.mp4', desc: '开始录屏（Ctrl+C 停止）' },
  { category: '屏幕', label: '点亮屏幕', cmd: 'adb shell input keyevent KEYCODE_WAKEUP', desc: '唤醒屏幕' },

  // File
  { category: '文件', label: '推送文件', cmd: 'adb push ', desc: '推送文件到设备（后接 本地路径 /sdcard/）' },
  { category: '文件', label: '拉取文件', cmd: 'adb pull ', desc: '从设备拉取文件（后接 /sdcard/路径）' },
  { category: '文件', label: 'Shell', cmd: 'adb shell', desc: '进入设备 shell' },

  // Input
  { category: '输入', label: '返回键', cmd: 'adb shell input keyevent KEYCODE_BACK', desc: '模拟返回键' },
  { category: '输入', label: 'Home 键', cmd: 'adb shell input keyevent KEYCODE_HOME', desc: '模拟 Home 键' },
  { category: '输入', label: '点击', cmd: 'adb shell input tap ', desc: '模拟点击（后接 x y 坐标）' },
  { category: '输入', label: '滑动', cmd: 'adb shell input swipe ', desc: '模拟滑动（后接 x1 y1 x2 y2）' },
  { category: '输入', label: '输入文本', cmd: 'adb shell input text ', desc: '输入文本（后接内容）' },

  // Log
  { category: '日志', label: '查看日志', cmd: 'adb logcat', desc: '实时查看设备日志' },
  { category: '日志', label: '清除日志', cmd: 'adb logcat -c', desc: '清除日志缓冲区' },
  { category: '日志', label: '过滤日志', cmd: 'adb logcat -s ', desc: '按 tag 过滤日志（后接 TAG）' },
];

/** English labels/descriptions for ADB commands when lang === 'en' */
const EN_COMMANDS: Record<string, { label: string; desc: string }> = {
  '查看设备': { label: 'List Devices', desc: 'List connected devices' },
  '设备型号': { label: 'Device Model', desc: 'Get device model' },
  'Android 版本': { label: 'Android Version', desc: 'Get Android version' },
  '屏幕分辨率': { label: 'Screen Resolution', desc: 'Get screen resolution' },
  '电池信息': { label: 'Battery Info', desc: 'View battery status' },
  'IP 地址': { label: 'IP Address', desc: 'Get WiFi IP address' },
  '已安装应用': { label: 'Installed Apps', desc: 'List all installed packages' },
  '第三方应用': { label: 'Third-party Apps', desc: 'List third-party apps' },
  '当前 Activity': { label: 'Current Activity', desc: 'Get current foreground Activity' },
  '安装 APK': { label: 'Install APK', desc: 'Install APK file (append file path)' },
  '卸载应用': { label: 'Uninstall App', desc: 'Uninstall app (append package name)' },
  '清除数据': { label: 'Clear Data', desc: 'Clear app data (append package name)' },
  '强制停止': { label: 'Force Stop', desc: 'Force stop app (append package name)' },
  '截图': { label: 'Screenshot', desc: 'Capture screen' },
  '拉取截图': { label: 'Pull Screenshot', desc: 'Pull screenshot to local' },
  '录屏': { label: 'Record Screen', desc: 'Start recording (Ctrl+C to stop)' },
  '点亮屏幕': { label: 'Wake Screen', desc: 'Wake up screen' },
  '推送文件': { label: 'Push File', desc: 'Push file to device (append local path /sdcard/)' },
  '拉取文件': { label: 'Pull File', desc: 'Pull file from device (append /sdcard/path)' },
  'Shell': { label: 'Shell', desc: 'Enter device shell' },
  '返回键': { label: 'Back Key', desc: 'Simulate back key' },
  'Home 键': { label: 'Home Key', desc: 'Simulate home key' },
  '点击': { label: 'Tap', desc: 'Simulate tap (append x y coordinates)' },
  '滑动': { label: 'Swipe', desc: 'Simulate swipe (append x1 y1 x2 y2)' },
  '输入文本': { label: 'Input Text', desc: 'Input text (append content)' },
  '查看日志': { label: 'View Logs', desc: 'View device logs in real-time' },
  '清除日志': { label: 'Clear Logs', desc: 'Clear log buffer' },
  '过滤日志': { label: 'Filter Logs', desc: 'Filter logs by tag (append TAG)' },
};

/** Map Chinese category names to ui.xxx keys */
const CATEGORY_UI_MAP: Record<string, string> = {
  '设备': 'deviceMgmt',
  '应用': 'appMgmt',
  '屏幕': 'screen',
  '文件': 'file',
  '输入': 'debug',
  '日志': 'debug',
};

export default function AdbTools() {
  const { t, lang } = useI18n();
  const { name, desc, ui, help } = useToolI18n('adb');
  const [filter, setFilter] = useState('');
  const { showToast } = useToast();

  const commands = useMemo(() => {
    if (lang === 'zh') return ADB_COMMANDS;
    return ADB_COMMANDS.map((c) => {
      const en = EN_COMMANDS[c.label];
      return en ? { ...c, label: en.label, desc: en.desc } : c;
    });
  }, [lang]);

  const categories = useMemo(
    () => [...new Set(commands.map((c) => c.category))],
    [commands],
  );

  const filtered = commands.filter(
    (c) =>
      !filter ||
      c.label.toLowerCase().includes(filter.toLowerCase()) ||
      c.cmd.toLowerCase().includes(filter.toLowerCase()) ||
      c.desc.toLowerCase().includes(filter.toLowerCase()) ||
      c.category.toLowerCase().includes(filter.toLowerCase()),
  );

  const getCategoryLabel = (cat: string) => {
    if (lang === 'en') {
      const uiKey = CATEGORY_UI_MAP[cat];
      return uiKey ? ui[uiKey] ?? cat : cat;
    }
    return cat;
  };

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    showToast((ui.copy ?? '已复制') + ': ' + cmd);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-panel">
        <div className="panel-header">
          <input
            type="text"
            className="adb-search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={ui.search ?? '搜索命令…'}
          />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {filtered.length} {ui.command ?? '条命令'}
          </span>
        </div>
        <div className="adb-commands">
          {categories.map((cat) => {
            const cmds = filtered.filter((c) => c.category === cat);
            if (cmds.length === 0) return null;
            return (
              <div key={cat} className="adb-category">
                <div className="adb-category-title">{getCategoryLabel(cat)}</div>
                {cmds.map((c, i) => (
                  <div key={i} className="adb-cmd-item" onClick={() => copyCmd(c.cmd)}>
                    <div className="adb-cmd-info">
                      <span className="adb-cmd-label">{c.label}</span>
                      <span className="adb-cmd-desc">{c.desc}</span>
                    </div>
                    <code className="adb-cmd-text">{c.cmd}</code>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
