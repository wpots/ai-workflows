#!/usr/bin/env python3
"""Read-only metadata and default-branch CI inventory via existing glab auth."""
import argparse
import base64
import concurrent.futures
import csv
import datetime as dt
import json
from pathlib import Path
import re
import subprocess
import urllib.parse


def api(endpoint, optional=False):
    result = subprocess.run(['glab', 'api', endpoint], capture_output=True, text=True, timeout=90)
    if result.returncode:
        if optional and ('404' in result.stderr or '404' in result.stdout):
            return None
        # Do not persist stderr/traces: those can contain sensitive API material.
        raise RuntimeError('GitLab GET failed: ' + endpoint.split('?')[0])
    return json.loads(result.stdout)


def pages(endpoint):
    result = []
    for page in range(1, 1000):
        sep = '&' if '?' in endpoint else '?'
        rows = api(f'{endpoint}{sep}per_page=100&page={page}')
        result.extend(rows)
        if len(rows) < 100:
            return result
    raise RuntimeError('Pagination limit reached')


def file_at(project_id, path, sha):
    encoded = urllib.parse.quote(path, safe='')
    response = api(f'projects/{project_id}/repository/files/{encoded}?ref={sha}', optional=True)
    if response is None:
        return None
    return base64.b64decode(response['content']).decode('utf-8')


def inspect(project):
    row = {key: project.get(key) for key in ['id', 'path_with_namespace', 'web_url', 'archived', 'default_branch']}
    row['errors'] = []
    row['ci_files_read'] = []
    row['ci_refs'] = []
    row['ci_resolution'] = 'unknown'
    branch = project.get('default_branch')
    if not branch:
        row['errors'].append('No default branch')
        return row
    try:
        commit = api(f"projects/{project['id']}/repository/branches/{urllib.parse.quote(branch, safe='')}")['commit']
        row.update(sha=commit['id'], committed_at=commit['committed_date'])
        unresolved = []
        visited = set()
        def walk(path, depth=0):
            if path in visited:
                return
            if depth > 8 or len(visited) >= 30:
                unresolved.append('Local include traversal limit')
                return
            visited.add(path)
            content = file_at(project['id'], path, row['sha'])
            if content is None:
                if path != '.gitlab-ci.yml':
                    unresolved.append('Missing local include: ' + path)
                return
            row['ci_files_read'].append(path)
            # This is a bounded static extractor, NOT a YAML/merged-config evaluator.
            for match in re.finditer(r'(?m)^\s*-?\s*project:\s*[\'\"]?greenberrynl/config/ci[\'\"]?\s*$', content):
                block = content[match.end():]
                boundary = re.search(r'(?m)^\s*-\s*(?:project|local|remote|component|template):', block)
                if boundary:
                    block = block[:boundary.start()]
                ref = re.search(r'(?m)^\s*ref:\s*[\'\"]?([^\s\'\"#]+)', block)
                if ref:
                    row['ci_refs'].append(ref.group(1))
                else:
                    unresolved.append('Shared CI include has no explicit ref')
            for match in re.finditer(r'(?m)^\s*-?\s*local:\s*[\'\"]?([^\s\'\"#]+)', content):
                path_value = match.group(1).lstrip('/')
                if any(char in path_value for char in '$*?['):
                    unresolved.append('Dynamic local include: ' + path_value)
                else:
                    walk(path_value, depth + 1)
            if re.search(r'(?m)^\s*-?\s*(remote|component):', content):
                unresolved.append('External/component include not resolved')
            if re.search(r'(?m)^\s*-?\s*(project|local):\s*[^\n]*\$', content):
                unresolved.append('Variable include not resolved')
        walk('.gitlab-ci.yml')
        row['ci_refs'] = sorted(set(row['ci_refs']))
        row['ci_unresolved'] = unresolved
        row['ci_resolution'] = 'partial' if unresolved else 'static'
        content = file_at(project['id'], 'package.json', row['sha'])
        if content:
            package = json.loads(content)
            row['package_manager'] = package.get('packageManager')
            row['node_engines'] = package.get('engines', {}).get('node')
            row['framework_ranges'] = {name: version for section in ['dependencies', 'devDependencies'] for name, version in package.get(section, {}).items() if name in ['next', 'react', 'payload', 'tailwindcss']}
    except (RuntimeError, KeyError, ValueError, subprocess.TimeoutExpired) as exc:
        row['errors'].append(str(exc) if isinstance(exc, RuntimeError) else type(exc).__name__)
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--date', required=True, help='Client-local YYYY-MM-DD; never infer from pipeline timestamps')
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--group', default='greenberrynl')
    parser.add_argument('--workers', type=int, default=6)
    args = parser.parse_args()
    dt.date.fromisoformat(args.date)
    group = urllib.parse.quote(args.group, safe='')
    projects = pages(f'groups/{group}/projects?include_subgroups=true')
    print(f'{len(projects)} visible projects; reading immutable default-branch snapshots', flush=True)
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as executor:
        for index, row in enumerate(executor.map(inspect, projects), 1):
            rows.append(row)
            if index % 25 == 0:
                print(f'Read {index}/{len(projects)}', flush=True)
    ci_id = urllib.parse.quote('greenberrynl/config/ci', safe='')
    refs = {b['name']: b['commit']['id'] for b in pages(f'projects/{ci_id}/repository/branches')}
    refs.update({t['name']: t['commit']['id'] for t in pages(f'projects/{ci_id}/repository/tags')})
    for row in rows:
        row['ci_ref_evidence'] = [{ 'ref': ref, 'sha': refs.get(ref, ref if re.fullmatch(r'[0-9a-f]{40}', ref) else None), 'status': 'dynamic' if '$' in ref else ('exists' if ref in refs or re.fullmatch(r'[0-9a-f]{40}', ref) else 'missing') } for ref in row['ci_refs']]
    # Full SHA-looking pins are syntax only; verify such commits separately.
    for row in rows:
        for ref in row['ci_ref_evidence']:
            if re.fullmatch(r'[0-9a-f]{40}', ref['ref']):
                ref['status'] = 'unverified_sha'
    result = {'date': args.date, 'collected_at_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'scope': 'Visible group projects; default-branch metadata, root manifest ranges and bounded static local CI includes. No production/deploy, nested manifests, lock versions, schedules or vulnerability scan verification.', 'projects': sorted(rows, key=lambda row: row['path_with_namespace']), 'ci_refs': refs}
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output / f'portfolio-{args.date}.json'
    if target.exists():
        raise SystemExit(f'Refusing to overwrite existing evidence: {target}')
    target.write_text(json.dumps(result, indent=2) + '\n')
    with (args.output / f'portfolio-{args.date}.csv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['project_id', 'project', 'archived', 'default_branch', 'sha', 'committed_at', 'ci_refs', 'ci_resolution', 'errors'])
        writer.writeheader()
        for row in result['projects']:
            writer.writerow(dict(project_id=row['id'], project=row['path_with_namespace'], archived=row['archived'], default_branch=row['default_branch'], sha=row.get('sha', ''), committed_at=row.get('committed_at', ''), ci_refs=';'.join(row['ci_refs']), ci_resolution=row['ci_resolution'], errors=';'.join(row['errors'])))
    print(f'Wrote {target}; projects with errors: {sum(bool(row["errors"]) for row in rows)}', flush=True)


if __name__ == '__main__':
    main()
