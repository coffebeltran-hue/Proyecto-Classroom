"""Read-only document checks; does not test or implement the platform."""
import json
import re
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
issues = []
documents = sorted(root.glob('*.md')) + sorted((root / 'reviews').glob('*.md'))
links = 0
for path in documents:
    content = path.read_text(encoding='utf-8')
    if len(re.findall(r'^```', content, re.M)) % 2:
        issues.append(f'{path.name}: unbalanced fences')
    for target in re.findall(r'\]\(([^)]+)\)', content):
        if re.match(r'https?://|mailto:|#', target):
            continue
        target = unquote(target.split('#')[0].strip('<>'))
        links += 1
        if not (path.parent / target).exists():
            issues.append(f'{path.name}: missing link {target}')
api = json.loads((root / 'openapi.json').read_text(encoding='utf-8'))
operations = []
def refs(value):
    if isinstance(value, dict):
        if '$ref' in value:
            ref = value['$ref']
            node = api
            try:
                for part in ref.removeprefix('#/').split('/'):
                    node = node[part.replace('~1', '/').replace('~0', '~')]
            except (KeyError, TypeError):
                issues.append(f'unresolved ref: {ref}')
        for child in value.values():
            refs(child)
    elif isinstance(value, list):
        for child in value:
            refs(child)
refs(api)
for path, item in api['paths'].items():
    for method, op in item.items():
        if method not in {'get','post','put','patch','delete','head','options'}:
            continue
        operations.append(op['operationId'])
        params = item.get('parameters', []) + op.get('parameters', [])
        resolved = [api['components']['parameters'][p['$ref'].split('/')[-1]] if '$ref' in p else p for p in params]
        declared = {p['name'] for p in resolved if p['in'] == 'path' and p.get('required')}
        if declared != set(re.findall(r'\{([^}]+)\}', path)):
            issues.append(f'{method} {path}: path parameters differ')
if len(set(operations)) != len(operations):
    issues.append('duplicate operationId')
required = ['ARCHITECTURE-SPINE.md','API.md','openapi.json','DELIVERY.md','EVIDENCE.md','REVIEW.md']
for name in required:
    if not (root / name).is_file():
        issues.append(f'missing requested artifact: {name}')
print(json.dumps({'ok': not issues, 'markdown_files_checked': len(documents), 'local_file_links_checked': links, 'paths': len(api['paths']), 'operations': len(operations), 'schemas': len(api['components']['schemas']), 'issues': issues, 'limits': 'Checks file targets, not Markdown anchors or rendered Mermaid; no runtime/integration/adversarial validation.'}, indent=2))
raise SystemExit(bool(issues))
