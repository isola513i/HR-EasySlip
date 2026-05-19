# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. **Fetch the latest guidelines** from the source URL provided below.
2. **Read the specified files** (or prompt the user for specific files/patterns).
3. **Check against all rules** found in the fetched guidelines.
4. **Output findings** using the terse `file:line` format.

## Guidelines Source

Always fetch fresh guidelines before each review:
[https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)

_Note: Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions._

## Usage

**When a user provides a file or pattern argument:**

- Fetch guidelines from the source URL above.
- Read the specified files.
- Apply all rules from the fetched guidelines.
- Output findings using the format specified in the guidelines.

**If no files are specified:**

- Ask the user which files they would like to review.
