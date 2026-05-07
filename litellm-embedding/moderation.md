---
title: "litellm.moderation()"
category: "litellm-embedding"
tags:
  - litellm
  - litellm-embedding
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/embedding/moderation.md"
summary: "LiteLLM supports the moderation endpoint for OpenAI"
---

# litellm.moderation()

# litellm.moderation()
LiteLLM supports the moderation endpoint for OpenAI

## Usage
```python
from litellm import moderation
os.environ['OPENAI_API_KEY'] = ""
response = moderation(input="i'm ishaan cto of litellm")   
```
