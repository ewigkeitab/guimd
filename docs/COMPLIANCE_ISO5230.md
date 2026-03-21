# OpenChain (ISO/IEC 5230) Compliance Declaration

This document declares the project's adherence to the **ISO/IEC 5230:2020** (OpenChain Specification v2.1) which defines the key requirements for an open source license compliance program.

**Version:** 1.1.5
**Date:** 2026-03-20

## 1. Program Introduction

Guimd follows a systematic approach to identify and manage open source software (OSS) components used in its software supply chain.

### 1.1 Policy
Our policy is to:
- Identify all OSS components and their respective licenses.
- Respect the licensing obligations of each component (attribution, source disclosure, etc.).
- Ensure license compatibility with our outgoing license (MIT).

## 2. Component Identification

We use automated and manual scans to identify components in:
- `go.mod` (Backend dependencies)
- `frontend/package.json` (Frontend dependencies)
- Bundled assets and external libraries.

The current identification results are documented in the [Full License Identification Result](docs/GUIMD_LICENSE_AUDIT_REPORT.md#L9-L71).

## 3. Compliance Process

### 3.1 License Verification
Every dependency is checked for:
- **SPDX Identifier:** Standardized identification of the license.
- **Copyleft Risks:** Exclusion of restrictive licenses (GPL, AGPL) to maintain commercial flexibility.
- **Obligations:** Retention of copyright notices and license texts.

### 3.2 Documentation
We maintain a Software Bill of Materials (SBOM) in the [CycloneDX format](docs/SBOM_CycloneDX.json) to facilitate automated compliance checks.

## 4. Responsibility and Training

The project maintainer is responsible for ensuring compliance. All contributors are expected to follow the dependency management guidelines provided in our development documentation.

---
**Status:** Compliant with ISO/IEC 5230 Principles
**Last Review:** 2026-03-20
