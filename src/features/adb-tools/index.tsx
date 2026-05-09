import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useToast } from '../../shared/context/ToastContext';

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

export default function AdbTools() {
  const [filter, setFilter] = useState('');
  const { showToast } = useToast();

  const filtered = ADB_COMMANDS.filter((c) =>
    !filter || c.label.includes(filter) || c.cmd.includes(filter) || c.desc.includes(filter) || c.category.includes(filter)
  );

  const categories = [...new Set(ADB_COMMANDS.map((c) => c.category))];

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    showToast('已复制: ' + cmd);
  };

  return (
    <ToolShell title="ADB 自动化" description="常用 ADB 命令快速复制">
      <div className="tool-panel">
        <div className="panel-header">
          <input
            type="text"
            className="adb-search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索命令…"
          />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} 条命令</span>
        </div>
        <div className="adb-commands">
          {categories.map((cat) => {
            const cmds = filtered.filter((c) => c.category === cat);
            if (cmds.length === 0) return null;
            return (
              <div key={cat} className="adb-category">
                <div className="adb-category-title">{cat}</div>
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
    </ToolShell>
  );
}
