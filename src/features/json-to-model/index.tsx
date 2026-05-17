import { useState, useMemo, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type Language = 'java' | 'kotlin' | 'dart' | 'rust' | 'go' | 'swift' | 'csharp' | 'python' | 'typescript' | 'php';

interface FieldInfo {
  name: string;
  type: string;
  comment?: string;
}

interface ClassInfo {
  name: string;
  fields: FieldInfo[];
  children: ClassInfo[];
}

// ── Helpers ──

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
}

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnakeCase(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`).replace(/^_/, '');
}

function getJsonType(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

// ── Parse JSON to ClassInfo ──

function parseJsonToClassInfo(json: unknown, name: string): ClassInfo {
  const classInfo: ClassInfo = { name: capitalize(name), fields: [], children: [] };

  if (Array.isArray(json)) {
    if (json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
      return parseJsonToClassInfo(json[0], name);
    }
    return classInfo;
  }

  if (typeof json === 'object' && json !== null) {
    const obj = json as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      const fieldType = getJsonType(value);
      const fieldName = key;

      if (fieldType === 'object') {
        const childClass = parseJsonToClassInfo(value, capitalize(key));
        classInfo.children.push(childClass);
        classInfo.fields.push({ name: fieldName, type: capitalize(key) });
      } else if (fieldType === 'array') {
        const arr = value as unknown[];
        if (arr.length > 0) {
          const itemType = getJsonType(arr[0]);
          if (itemType === 'object') {
            const childClass = parseJsonToClassInfo(arr[0], capitalize(key) + 'Item');
            classInfo.children.push(childClass);
            classInfo.fields.push({ name: fieldName, type: capitalize(key) + 'Item', comment: 'array' });
          } else {
            classInfo.fields.push({ name: fieldName, type: itemType, comment: 'array' });
          }
        } else {
          classInfo.fields.push({ name: fieldName, type: 'any', comment: 'array' });
        }
      } else {
        classInfo.fields.push({ name: fieldName, type: fieldType });
      }
    }
  }

  return classInfo;
}

// ── Code Generators ──

function generateJava(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateJava(child));
    lines.push('');
  }

  lines.push(`public class ${classInfo.name} {`);

  // Fields
  for (const field of classInfo.fields) {
    const javaType = mapJavaType(field.type, field.comment === 'array');
    lines.push(`    private ${javaType} ${field.name};`);
  }

  lines.push('');

  // Default constructor
  lines.push(`    public ${classInfo.name}() {}`);

  lines.push('');

  // Getters and Setters
  for (const field of classInfo.fields) {
    const javaType = mapJavaType(field.type, field.comment === 'array');
    const capitalName = capitalize(field.name);

    lines.push(`    public ${javaType} get${capitalName}() {`);
    lines.push(`        return ${field.name};`);
    lines.push(`    }`);
    lines.push('');
    lines.push(`    public void set${capitalName}(${javaType} ${field.name}) {`);
    lines.push(`        this.${field.name} = ${field.name};`);
    lines.push(`    }`);
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

function mapJavaType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'String';
      case 'int': return 'int';
      case 'double': return 'double';
      case 'boolean': return 'boolean';
      case 'null': return 'Object';
      case 'any': return 'Object';
      default: return type;
    }
  })();
  return isArray ? `List<${base}>` : base;
}

function generateKotlin(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateKotlin(child));
    lines.push('');
  }

  lines.push(`data class ${classInfo.name}(`);

  const fieldLines = classInfo.fields.map((field, i) => {
    const kotlinType = mapKotlinType(field.type, field.comment === 'array');
    const comma = i < classInfo.fields.length - 1 ? ',' : '';
    return `    val ${field.name}: ${kotlinType}${comma}`;
  });

  lines.push(fieldLines.join('\n'));
  lines.push(')');

  return lines.join('\n');
}

function mapKotlinType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'String';
      case 'int': return 'Int';
      case 'double': return 'Double';
      case 'boolean': return 'Boolean';
      case 'null': return 'Any?';
      case 'any': return 'Any';
      default: return type;
    }
  })();
  return isArray ? `List<${base}>` : base;
}

function generateDart(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateDart(child));
    lines.push('');
  }

  lines.push(`class ${classInfo.name} {`);

  // Fields
  for (const field of classInfo.fields) {
    const dartType = mapDartType(field.type, field.comment === 'array');
    lines.push(`  ${dartType}? ${field.name};`);
  }

  lines.push('');

  // Constructor
  lines.push(`  ${classInfo.name}({`);
  for (const field of classInfo.fields) {
    lines.push(`    this.${field.name},`);
  }
  lines.push('  });');

  lines.push('');

  // fromJson
  lines.push(`  ${classInfo.name}.fromJson(Map<String, dynamic> json) {`);
  for (const field of classInfo.fields) {
    const dartType = mapDartType(field.type, field.comment === 'array');
    if (field.comment === 'array') {
      if (isPrimitiveType(field.type)) {
        lines.push(`    ${field.name} = json['${field.name}']?.cast<${mapDartType(field.type, false)}>();`);
      } else {
        lines.push(`    if (json['${field.name}'] != null) {`);
        lines.push(`      ${field.name} = <${dartType}>[];`);
        lines.push(`      json['${field.name}'].forEach((v) { ${field.name}!.add(${dartType}.fromJson(v)); });`);
        lines.push(`    }`);
      }
    } else if (isComplexType(field.type)) {
      lines.push(`    ${field.name} = json['${field.name}'] != null ? ${dartType}.fromJson(json['${field.name}']) : null;`);
    } else {
      lines.push(`    ${field.name} = json['${field.name}'];`);
    }
  }
  lines.push('  }');

  lines.push('');

  // toJson
  lines.push('  Map<String, dynamic> toJson() {');
  lines.push('    final Map<String, dynamic> data = <String, dynamic>{};');
  for (const field of classInfo.fields) {
    if (isComplexType(field.type) && field.comment !== 'array') {
      lines.push(`    if (${field.name} != null) {`);
      lines.push(`      data['${field.name}'] = ${field.name}!.toJson();`);
      lines.push(`    }`);
    } else {
      lines.push(`    data['${field.name}'] = ${field.name};`);
    }
  }
  lines.push('    return data;');
  lines.push('  }');

  lines.push('}');

  return lines.join('\n');
}

function mapDartType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'String';
      case 'int': return 'int';
      case 'double': return 'double';
      case 'boolean': return 'bool';
      case 'null': return 'dynamic';
      case 'any': return 'dynamic';
      default: return type;
    }
  })();
  return isArray ? `List<${base}>` : base;
}

function isPrimitiveType(type: string): boolean {
  return ['string', 'int', 'double', 'boolean'].includes(type);
}

function isComplexType(type: string): boolean {
  return !isPrimitiveType(type) && type !== 'null' && type !== 'any' && type !== 'dynamic';
}

function generateRust(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateRust(child));
    lines.push('');
  }

  lines.push('#[derive(Debug, Serialize, Deserialize)]');
  lines.push(`pub struct ${classInfo.name} {`);

  for (const field of classInfo.fields) {
    const rustType = mapRustType(field.type, field.comment === 'array');
    const snakeName = toSnakeCase(field.name);
    if (field.comment === 'array') {
      lines.push(`    pub ${snakeName}: ${rustType},`);
    } else {
      lines.push(`    pub ${snakeName}: ${rustType},`);
    }
  }

  lines.push('}');

  return lines.join('\n');
}

function mapRustType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'String';
      case 'int': return 'i64';
      case 'double': return 'f64';
      case 'boolean': return 'bool';
      case 'null': return 'Option<Value>';
      case 'any': return 'Value';
      default: return type;
    }
  })();
  return isArray ? `Vec<${base}>` : `Option<${base}>`;
}

function generateGo(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateGo(child));
    lines.push('');
  }

  lines.push(`type ${classInfo.name} struct {`);

  for (const field of classInfo.fields) {
    const goType = mapGoType(field.type, field.comment === 'array');
    const capitalName = capitalize(field.name);
    lines.push(`    ${capitalName} ${goType} \`json:"${field.name}"\``);
  }

  lines.push('}');

  return lines.join('\n');
}

function mapGoType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'string';
      case 'int': return 'int64';
      case 'double': return 'float64';
      case 'boolean': return 'bool';
      case 'null': return 'interface{}';
      case 'any': return 'interface{}';
      default: return type;
    }
  })();
  return isArray ? `[]${base}` : base;
}

function generateSwift(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateSwift(child));
    lines.push('');
  }

  lines.push(`struct ${classInfo.name}: Codable {`);

  for (const field of classInfo.fields) {
    const swiftType = mapSwiftType(field.type, field.comment === 'array');
    lines.push(`    let ${field.name}: ${swiftType}`);
  }

  lines.push('}');

  return lines.join('\n');
}

function mapSwiftType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'String';
      case 'int': return 'Int';
      case 'double': return 'Double';
      case 'boolean': return 'Bool';
      case 'null': return 'Any?';
      case 'any': return 'Any';
      default: return type;
    }
  })();
  return isArray ? `[${base}]` : base;
}

function generateCSharp(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateCSharp(child));
    lines.push('');
  }

  lines.push(`public class ${classInfo.name}`);
  lines.push('{');

  for (const field of classInfo.fields) {
    const csType = mapCSharpType(field.type, field.comment === 'array');
    const capitalName = capitalize(field.name);
    lines.push(`    public ${csType} ${capitalName} { get; set; }`);
  }

  lines.push('}');

  return lines.join('\n');
}

function mapCSharpType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'string';
      case 'int': return 'int';
      case 'double': return 'double';
      case 'boolean': return 'bool';
      case 'null': return 'object';
      case 'any': return 'object';
      default: return type;
    }
  })();
  return isArray ? `List<${base}>` : base;
}

function generatePython(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generatePython(child));
    lines.push('');
  }

  lines.push('@dataclass');
  lines.push(`class ${classInfo.name}:`);

  if (classInfo.fields.length === 0) {
    lines.push('    pass');
  } else {
    for (const field of classInfo.fields) {
      const pyType = mapPythonType(field.type, field.comment === 'array');
      const snakeName = toSnakeCase(field.name);
      lines.push(`    ${snakeName}: ${pyType}`);
    }
  }

  return lines.join('\n');
}

function mapPythonType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'str';
      case 'int': return 'int';
      case 'double': return 'float';
      case 'boolean': return 'bool';
      case 'null': return 'None';
      case 'any': return 'Any';
      default: return type;
    }
  })();
  return isArray ? `List[${base}]` : base;
}

function generateTypeScript(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generateTypeScript(child));
    lines.push('');
  }

  lines.push(`interface ${classInfo.name} {`);

  for (const field of classInfo.fields) {
    const tsType = mapTsType(field.type, field.comment === 'array');
    lines.push(`  ${field.name}: ${tsType};`);
  }

  lines.push('}');

  return lines.join('\n');
}

function mapTsType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'string';
      case 'int': return 'number';
      case 'double': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      case 'any': return 'any';
      default: return type;
    }
  })();
  return isArray ? `${base}[]` : base;
}

function generatePHP(classInfo: ClassInfo): string {
  const lines: string[] = [];

  for (const child of classInfo.children) {
    lines.push(generatePHP(child));
    lines.push('');
  }

  lines.push(`class ${classInfo.name}`);
  lines.push('{');

  // Properties
  for (const field of classInfo.fields) {
    const phpType = mapPhpType(field.type, field.comment === 'array');
    lines.push(`    public ${phpType} $${field.name};`);
  }

  lines.push('');

  // Constructor
  lines.push('    public function __construct(');
  const params = classInfo.fields.map((field, i) => {
    const phpType = mapPhpType(field.type, field.comment === 'array');
    const comma = i < classInfo.fields.length - 1 ? ',' : '';
    return `        ${phpType} $${field.name}${comma}`;
  });
  lines.push(params.join('\n'));
  lines.push('    ) {');
  for (const field of classInfo.fields) {
    lines.push(`        $this->${field.name} = $${field.name};`);
  }
  lines.push('    }');

  lines.push('}');

  return lines.join('\n');
}

function mapPhpType(type: string, isArray: boolean): string {
  const base = (() => {
    switch (type) {
      case 'string': return 'string';
      case 'int': return 'int';
      case 'double': return 'float';
      case 'boolean': return 'bool';
      case 'null': return 'mixed';
      case 'any': return 'mixed';
      default: return type;
    }
  })();
  return isArray ? `array` : base;
}

// ── Generator Map ──

const GENERATORS: Record<Language, (classInfo: ClassInfo) => string> = {
  java: generateJava,
  kotlin: generateKotlin,
  dart: generateDart,
  rust: generateRust,
  go: generateGo,
  swift: generateSwift,
  csharp: generateCSharp,
  python: generatePython,
  typescript: generateTypeScript,
  php: generatePHP,
};

const LANG_LABELS: Record<Language, { name: string; icon: string }> = {
  java: { name: 'Java', icon: 'JV' },
  kotlin: { name: 'Kotlin', icon: 'KT' },
  dart: { name: 'Dart', icon: 'DT' },
  rust: { name: 'Rust', icon: 'RS' },
  go: { name: 'Go', icon: 'GO' },
  swift: { name: 'Swift', icon: 'SW' },
  csharp: { name: 'C#', icon: 'C#' },
  python: { name: 'Python', icon: 'PY' },
  typescript: { name: 'TypeScript', icon: 'TS' },
  php: { name: 'PHP', icon: 'PH' },
};

// ── Sample ──

const SAMPLE = JSON.stringify({
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  active: true,
  score: 95.5,
  tags: ['developer', 'frontend'],
  address: {
    street: '中关村大街1号',
    city: '北京',
    zip: '100080',
  },
}, null, 2);

// ── Main Component ──

export default function JsonToModel() {
  const { lang } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('jsonToModel');
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState<Language>('java');
  const [rootName, setRootName] = useState('RootObject');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      const parsed = JSON.parse(input);
      const classInfo = parseJsonToClassInfo(parsed, rootName || 'RootObject');
      return GENERATORS[targetLang](classInfo);
    } catch (e) {
      return e instanceof Error ? `Error: ${e.message}` : 'JSON parse error';
    }
  }, [input, targetLang, rootName]);

  const handleExample = useCallback(() => {
    setInput(SAMPLE);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  const handleCopy = useCallback(() => {
    if (output) navigator.clipboard.writeText(output);
  }, [output]);

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="jtm-layout">
        {/* Input Panel */}
        <div className="jtm-panel">
          <div className="jtm-panel-header">
            <span>JSON</span>
            <div className="jtm-actions">
              <button className="jtm-btn" onClick={handleExample}>{ui.example || 'Example'}</button>
              <button className="jtm-btn" onClick={handleClear}>{ui.clear || 'Clear'}</button>
            </div>
          </div>
          <textarea
            className="jtm-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={ui.placeholder || 'Paste JSON here...'}
            spellCheck={false}
          />
          <div className="jtm-config">
            <label>{ui.rootName || 'Root Name'}</label>
            <input
              type="text"
              value={rootName}
              onChange={e => setRootName(e.target.value)}
              placeholder="RootObject"
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="jtm-panel">
          <div className="jtm-panel-header">
            <div className="jtm-lang-tabs">
              {(Object.entries(LANG_LABELS) as [Language, typeof LANG_LABELS[Language]][]).map(([key, val]) => (
                <button
                  key={key}
                  className={`jtm-lang-tab${targetLang === key ? ' jtm-lang-active' : ''}`}
                  onClick={() => setTargetLang(key)}
                >
                  {val.icon}
                </button>
              ))}
            </div>
            <button className="jtm-btn jtm-copy-btn" onClick={handleCopy} disabled={!output}>
              {ui.copy || 'Copy'}
            </button>
          </div>
          <pre className="jtm-output">
            <code>{output || (ui.noOutput || 'Generated code will appear here...')}</code>
          </pre>
        </div>
      </div>

      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
