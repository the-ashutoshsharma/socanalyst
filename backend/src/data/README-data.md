# Dataset Documentation - LogHub Linux System Logs

## 1. Dataset Overview
- **Dataset Name**: LogHub Linux `auth.log` Collection
- **Domain**: Linux System & Authentication Telemetry
- **Primary Source File**: `backend/src/data/real-logs-raw.txt` (2,000 raw lines, unmodified)
- **Extracted Dataset**: `backend/src/data/real-logs.json` (40 representative entries parsed strictly from the raw dataset)

## 2. Academic Citation & Attribution
The raw log dataset is sourced from the LogHub benchmark dataset repository created and maintained by the LogPAI research group.

> **Citation**:
> Jieming Zhu, Shilin He, Pinjia He, Jinyang Liu, Michael R. Lyu.  
> *"Loghub: A Large Collection of System Log Datasets for AI-driven Log Analytics"*,  
> In **IEEE International Symposium on Software Reliability Engineering (ISSRE)**, 2023.

- **Source URL**: `https://raw.githubusercontent.com/logpai/loghub/master/Linux/Linux_2k.log`
- **Official Repository**: `https://github.com/logpai/loghub`

## 3. License
The LogHub dataset is published under the **MIT License**.
Refer to the official repository at [logpai/loghub](https://github.com/logpai/loghub) for full terms and copyright notices.

## 4. Authenticity & Lineage Guarantee
- Every record in `real-logs.json` directly corresponds to an unmodified, authentic line from `real-logs-raw.txt`.
- No log telemetry or field values are fabricated or hand-crafted.
- Parsed metadata fields (`timestamp`, `hostname`, `sourceIp`, `eventType`, `severity`, `rawLog`) are extracted directly from the underlying syslog entries without mutating the original `rawLog` string.
