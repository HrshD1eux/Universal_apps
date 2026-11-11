'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Sparkles, Terminal, ArrowRight } from 'lucide-react';
import { notifyCopied, notifyCompleted } from '@/lib/notify';

const SAMPLE_CURL = `curl 'https://api.github.com/repos/universal-apps/desktop/releases' \\
  -X POST \\
  -H 'Accept: application/vnd.github+json' \\
  -H 'Authorization: Bearer ghp_99sampleTokenSecret123' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"tag_name":"v0.1.3","target_commitish":"main","name":"v0.1.3 Release","draft":false,"prerelease":false}'`;

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: string | null;
}

function parseCurl(rawCurl: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {},
    data: null,
  };

  if (!rawCurl) return result;

  // Clean up multiline backslashes
  const cleaned = rawCurl.replace(/\\\r?\n/g, ' ').trim();

  // Extract URL: matches after curl or --url or directly quoted/bare URL
  const urlMatch = cleaned.match(/(?:curl\s+|--url\s+)(['"]?)(https?:\/\/[^\s'"]+)\1/i) 
    || cleaned.match(/['"](https?:\/\/[^\s'"]+)['"]/i)
    || cleaned.match(/(https?:\/\/[^\s'"]+)/i);

  if (urlMatch) {
    result.url = urlMatch[2] || urlMatch[1];
  }

  // Extract Method (-X POST / --request POST)
  const methodMatch = cleaned.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract Headers (-H 'Key: Value')
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = headerRegex.exec(cleaned)) !== null) {
    const colonIdx = match[1].indexOf(':');
    if (colonIdx > -1) {
      const key = match[1].substring(0, colonIdx).trim();
      const val = match[1].substring(colonIdx + 1).trim();
      result.headers[key] = val;
    }
  }

  // Extract Body Data (-d, --data, --data-raw, --data-binary)
  const dataMatch = cleaned.match(/(?:-d|--data|--data-raw|--data-binary)\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/);
  if (dataMatch) {
    let body = dataMatch[1];
    if ((body.startsWith("'") && body.endsWith("'")) || (body.startsWith('"') && body.endsWith('"'))) {
      body = body.slice(1, -1);
    }
    result.data = body;
    if (result.method === 'GET') {
      result.method = 'POST'; // Default to POST if body data is present
    }
  }

  return result;
}

export default function CurlConverter() {
  const [curlInput, setCurlInput] = useState<string>(SAMPLE_CURL);
  const [targetLang, setTargetLang] = useState<'fetch' | 'axios' | 'python' | 'node'>('fetch');

  const parsed = useMemo(() => parseCurl(curlInput), [curlInput]);

  // Code Generation
  const generatedCode = useMemo(() => {
    const { url, method, headers, data } = parsed;
    if (!url) return '// Enter a valid cURL command with a target URL.';

    if (targetLang === 'fetch') {
      const hasHeaders = Object.keys(headers).length > 0;
      const opts: string[] = [];
      opts.push(`  method: '${method}'`);

      if (hasHeaders) {
        opts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`);
      }
      if (data) {
        try {
          const parsedJson = JSON.parse(data);
          opts.push(`  body: JSON.stringify(${JSON.stringify(parsedJson, null, 4).replace(/\n/g, '\n  ')})`);
        } catch {
          opts.push(`  body: ${JSON.stringify(data)}`);
        }
      }

      return `// JavaScript / TypeScript Fetch API
const response = await fetch('${url}', {
${opts.join(',\n')}
});

const data = await response.json();
console.log(data);`;
    }

    if (targetLang === 'axios') {
      const hasHeaders = Object.keys(headers).length > 0;
      const axiosConfig: any = {
        method: method.toLowerCase(),
        url,
      };
      if (hasHeaders) axiosConfig.headers = headers;
      if (data) {
        try {
          axiosConfig.data = JSON.parse(data);
        } catch {
          axiosConfig.data = data;
        }
      }

      return `import axios from 'axios';

const response = await axios(${JSON.stringify(axiosConfig, null, 2)});
console.log(response.data);`;
    }

    if (targetLang === 'python') {
      const hasHeaders = Object.keys(headers).length > 0;
      let pyHeaders = '';
      if (hasHeaders) {
        pyHeaders = `\nheaders = ${JSON.stringify(headers, null, 4)}\n`;
      }

      let pyData = '';
      if (data) {
        try {
          const parsedJson = JSON.parse(data);
          pyData = `\npayload = ${JSON.stringify(parsedJson, null, 4)}\n`;
        } catch {
          pyData = `\npayload = ${JSON.stringify(data)}\n`;
        }
      }

      const args = [`'${url}'`];
      if (hasHeaders) args.push('headers=headers');
      if (data) args.push('json=payload');

      return `import requests
${pyHeaders}${pyData}
response = requests.${method.toLowerCase()}(
    ${args.join(',\n    ')}
)

print(response.json())`;
    }

    if (targetLang === 'node') {
      return `import { request } from 'undici';

const { statusCode, headers, body } = await request('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},
  ${data ? `body: JSON.stringify(${data}),` : ''}
});

console.log('Status:', statusCode);
console.log('Body:', await body.json());`;
    }

    return '';
  }, [parsed, targetLang]);

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    notifyCopied('Generated request code');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  cURL to Code Converter
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Convert terminal cURL commands into JavaScript Fetch, Axios, Python Requests, and Node.js
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={copyCode}
              className="bg-white text-slate-900 hover:bg-white/90 font-black shadow-lg gap-2 h-11 px-5 rounded-xl"
            >
              <Copy className="w-4 h-4" /> Copy Generated Code
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Target Language Switcher */}
          <div className="flex flex-wrap gap-2.5 pb-4 border-b">
            <Button
              variant={targetLang === 'fetch' ? 'default' : 'outline'}
              onClick={() => setTargetLang('fetch')}
              className="font-bold text-xs rounded-xl"
            >
              JavaScript / TS Fetch
            </Button>
            <Button
              variant={targetLang === 'axios' ? 'default' : 'outline'}
              onClick={() => setTargetLang('axios')}
              className="font-bold text-xs rounded-xl"
            >
              Axios (JS/TS)
            </Button>
            <Button
              variant={targetLang === 'python' ? 'default' : 'outline'}
              onClick={() => setTargetLang('python')}
              className="font-bold text-xs rounded-xl"
            >
              Python Requests
            </Button>
            <Button
              variant={targetLang === 'node' ? 'default' : 'outline'}
              onClick={() => setTargetLang('node')}
              className="font-bold text-xs rounded-xl"
            >
              Node.js Undici
            </Button>

            <Button
              variant="secondary"
              onClick={() => setCurlInput(SAMPLE_CURL)}
              className="ml-auto text-xs font-bold"
            >
              Load Sample cURL
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Input cURL */}
            <div className="lg:col-span-6 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" /> Paste Raw cURL Command
              </label>
              <Textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                rows={16}
                className="font-mono text-[11px] leading-relaxed resize-none rounded-xl"
                placeholder="curl -X POST https://api.example.com ..."
              />
            </div>

            {/* Right: Output Code */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                <span>Output Code ({targetLang.toUpperCase()})</span>
                <span className="font-mono text-primary font-bold">{parsed.method} {parsed.url ? '✓' : ''}</span>
              </div>
              <pre className="p-5 rounded-xl bg-slate-950 text-slate-50 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 min-h-[350px]">
                {generatedCode}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
