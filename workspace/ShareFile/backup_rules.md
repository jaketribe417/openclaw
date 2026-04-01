# Backup and Change Tracking Rules

## Backup Rule
Before modifying ANY existing file, create a timestamped backup in:
`sharefile/backups/<original-path>/<filename>_YYYY-MM-DD_HH-MM-SS.bak`

## Change Log Rule
After EVERY file operation (create, modify, delete), append to:
`sharefile/changes/change_log.jsonl`

Format:
```json
{"timestamp": "ISO-8601", "action": "create|modify|delete|backup", "file": "path", "details": "..."}
```

## Pre-Upgrade Baseline
Run benchmark test before any changes to establish comparison point.
